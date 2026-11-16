package com.agriconnect.service;

import com.agriconnect.dto.CreatePaymentRequest;
import com.agriconnect.dto.PaymentResponse;
import com.agriconnect.dto.PaymentSummaryDto;
import com.agriconnect.dto.UpdatePaymentStatusRequest;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.BuyerProfileRepository;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.OrderRepository;
import com.agriconnect.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Service managing Payment Processing, Settlement & Financial Audit (Phase 10).
 * Enforces:
 * - Order ownership and tenant isolation (Buyers own payment creation/viewing; Farmers view receipts; Admin audits all).
 * - Balance integrity (rejection of payments exceeding order total or on fully paid orders).
 * - Order status eligibility (rejection of payments on CANCELLED, REJECTED, or non-accepted orders).
 * - State machine validation (non-reversible progression, duplicate payment handling, refund restrictions).
 * - Synchronized order confirmation upon payment settlement.
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final PriceHistoryService priceHistoryService;

    public PaymentService(PaymentRepository paymentRepository,
                          OrderRepository orderRepository,
                          BuyerProfileRepository buyerProfileRepository,
                          FarmerProfileRepository farmerProfileRepository,
                          PriceHistoryService priceHistoryService) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.buyerProfileRepository = buyerProfileRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.priceHistoryService = priceHistoryService;
    }

    /**
     * Creates and records a payment against a purchase order.
     * Enforces ownership, positive balance, and valid order state.
     *
     * @param actorUserId Authenticated user ID from JWT
     * @param actorRole   Role of caller (BUYER or ADMIN)
     * @param request     Payment creation details
     * @return 201 Created PaymentResponse
     */
    @Transactional
    public PaymentResponse createPayment(Integer actorUserId, Role actorRole, CreatePaymentRequest request) {
        if (request.getOrderId() == null) {
            throw new BadRequestException("Order ID is required to process payment.");
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Payment amount must be greater than zero.");
        }
        if (request.getPaymentMethod() == null) {
            throw new BadRequestException("Payment method is required.");
        }

        // 1. Fetch and write-lock target Order
        Order order = orderRepository.findByIdForUpdate(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + request.getOrderId()));

        // 2. Ownership verification
        if (actorRole == Role.BUYER) {
            if (!order.getBuyer().getUserId().equals(actorUserId)) {
                log.warn("Security violation: Buyer #{} attempted to make payment for order #{} owned by buyer #{}",
                        actorUserId, order.getOrderId(), order.getBuyer().getUserId());
                throw new AccessDeniedException("Access denied: You do not have permission to pay for order #" + order.getOrderId());
            }
        } else if (actorRole != Role.ADMIN) {
            throw new AccessDeniedException("Unauthorized role for making payments.");
        }

        // 3. Order status eligibility
        if (order.getOrderStatus() == OrderStatus.CANCELLED || order.getOrderStatus() == OrderStatus.REJECTED) {
            throw new BadRequestException("Cannot make payment for order #" + order.getOrderId()
                    + " because order status is " + order.getOrderStatus() + ".");
        }
        if (order.getOrderStatus() == OrderStatus.PENDING) {
            throw new BadRequestException("Cannot make payment for order #" + order.getOrderId()
                    + " with status PENDING. The order must first be accepted by the farmer.");
        }

        // 4. Financial Balance Verification
        BigDecimal currentPaid = paymentRepository.sumCompletedAmountByOrderId(order.getOrderId());
        BigDecimal remainingBalance = order.getTotalAmount().subtract(currentPaid);

        if (remainingBalance.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Order #" + order.getOrderId() + " is already fully paid.");
        }
        if (request.getAmount().compareTo(remainingBalance) > 0) {
            throw new BadRequestException("Payment amount (" + request.getAmount()
                    + ") exceeds remaining balance (" + remainingBalance + ") for Order #" + order.getOrderId() + ".");
        }

        // 5. Unique Transaction Reference
        String txnRef;
        if (request.getTransactionReference() != null && !request.getTransactionReference().trim().isBlank()) {
            txnRef = request.getTransactionReference().trim();
            if (paymentRepository.existsByTransactionReference(txnRef)) {
                throw new BadRequestException("Transaction reference '" + txnRef + "' already exists.");
            }
        } else {
            txnRef = generateTransactionReference(order.getOrderId());
        }

        // 6. Determine initial status
        PaymentStatus initialStatus = request.getPaymentStatus() != null
                ? request.getPaymentStatus()
                : PaymentStatus.COMPLETED;

        // 7. Persist payment
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(request.getAmount());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setPaymentStatus(initialStatus);
        payment.setTransactionReference(txnRef);
        payment.setRemarks(request.getRemarks() != null ? request.getRemarks().trim() : null);

        Payment saved = paymentRepository.save(payment);
        log.info("Payment #{} created for Order #{} with amount ₹{} and status {}",
                saved.getPaymentId(), order.getOrderId(), saved.getAmount(), saved.getPaymentStatus());

        // 8. Synchronize Order state to CONFIRMED if ACCEPTED and payment is successful
        if (initialStatus.isSuccessful() && order.getOrderStatus() == OrderStatus.ACCEPTED) {
            order.setOrderStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
            log.info("Order #{} transitioned from ACCEPTED to CONFIRMED upon successful payment.", order.getOrderId());
        }

        // 9. Record price history for analytical reporting (Phase 11)
        if (initialStatus.isSuccessful()) {
            priceHistoryService.recordPriceForCompletedOrder(order);
        }

        return enrichPaymentResponse(saved);
    }

    /**
     * Retrieve all payments made by the authenticated buyer.
     */
    @Transactional(readOnly = true)
    public List<PaymentResponse> getBuyerPayments(Integer buyerUserId) {
        return paymentRepository.findByOrder_Buyer_UserIdOrderByPaymentDateDesc(buyerUserId)
                .stream()
                .map(this::enrichPaymentResponse)
                .toList();
    }

    /**
     * Retrieve a specific payment by ID for the authenticated buyer.
     * Enforces strict buyer tenant isolation.
     */
    @Transactional(readOnly = true)
    public PaymentResponse getBuyerPaymentById(Integer buyerUserId, Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + paymentId));

        if (!payment.getOrder().getBuyer().getUserId().equals(buyerUserId)) {
            log.warn("Security violation: Buyer #{} attempted to view payment #{} owned by buyer #{}",
                    buyerUserId, paymentId, payment.getOrder().getBuyer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to view payment #" + paymentId);
        }

        return enrichPaymentResponse(payment);
    }

    /**
     * Retrieve all payment records for harvests owned by the authenticated farmer.
     */
    @Transactional(readOnly = true)
    public List<PaymentResponse> getFarmerPayments(Integer farmerUserId) {
        return paymentRepository.findByOrder_Harvest_Farmer_UserIdOrderByPaymentDateDesc(farmerUserId)
                .stream()
                .map(this::enrichPaymentResponse)
                .toList();
    }

    /**
     * Retrieve a specific payment record by ID for the authenticated farmer.
     * Enforces farmer ownership isolation.
     */
    @Transactional(readOnly = true)
    public PaymentResponse getFarmerPaymentById(Integer farmerUserId, Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + paymentId));

        if (!payment.getOrder().getHarvest().getFarmer().getUserId().equals(farmerUserId)) {
            log.warn("Security violation: Farmer #{} attempted to view payment #{} for farmer #{}",
                    farmerUserId, paymentId, payment.getOrder().getHarvest().getFarmer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to view payment #" + paymentId);
        }

        return enrichPaymentResponse(payment);
    }

    /**
     * Retrieve all payments across the marketplace with optional filtering (Admin only).
     */
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments(PaymentStatus status, PaymentMethod method) {
        List<Payment> payments;
        if (status != null && method != null) {
            payments = paymentRepository.findByPaymentStatusAndPaymentMethodOrderByPaymentDateDesc(status, method);
        } else if (status != null) {
            payments = paymentRepository.findByPaymentStatusOrderByPaymentDateDesc(status);
        } else if (method != null) {
            payments = paymentRepository.findByPaymentMethodOrderByPaymentDateDesc(method);
        } else {
            payments = paymentRepository.findAllByOrderByPaymentDateDesc();
        }

        return payments.stream()
                .map(this::enrichPaymentResponse)
                .toList();
    }

    /**
     * Retrieve any payment record by ID (Admin only).
     */
    @Transactional(readOnly = true)
    public PaymentResponse getAdminPaymentById(Integer paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + paymentId));
        return enrichPaymentResponse(payment);
    }

    /**
     * Update payment status (Admin or settlement simulation).
     * Validates state transition machine and financial balance.
     */
    @Transactional
    public PaymentResponse updatePaymentStatus(Integer actorUserId, Role actorRole,
                                               Integer paymentId, UpdatePaymentStatusRequest request) {
        if (request.getPaymentStatus() == null) {
            throw new BadRequestException("Target payment status is required.");
        }

        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with ID: " + paymentId));

        PaymentStatus currentStatus = payment.getPaymentStatus();
        PaymentStatus targetStatus = request.getPaymentStatus();

        if (!currentStatus.canTransitionTo(targetStatus)) {
            throw new BadRequestException("Payment #" + paymentId + " cannot transition from "
                    + currentStatus + " to " + targetStatus + ".");
        }

        Order order = payment.getOrder();

        // If transitioning from non-successful to successful, verify it won't exceed total balance
        if (!currentStatus.isSuccessful() && targetStatus.isSuccessful()) {
            BigDecimal currentPaid = paymentRepository.sumCompletedAmountByOrderId(order.getOrderId());
            BigDecimal remainingBalance = order.getTotalAmount().subtract(currentPaid);
            if (payment.getAmount().compareTo(remainingBalance) > 0) {
                throw new BadRequestException("Transitioning Payment #" + paymentId + " to " + targetStatus
                        + " of amount " + payment.getAmount() + " would exceed order remaining balance (" + remainingBalance + ").");
            }
        }

        payment.setPaymentStatus(targetStatus);
        if (request.getRemarks() != null && !request.getRemarks().trim().isBlank()) {
            payment.setRemarks(request.getRemarks().trim());
        }
        if (request.getTransactionReference() != null && !request.getTransactionReference().trim().isBlank()) {
            String newRef = request.getTransactionReference().trim();
            if (!newRef.equals(payment.getTransactionReference()) && paymentRepository.existsByTransactionReference(newRef)) {
                throw new BadRequestException("Transaction reference '" + newRef + "' already exists.");
            }
            payment.setTransactionReference(newRef);
        }

        Payment saved = paymentRepository.save(payment);
        log.info("Payment #{} status updated from {} to {} by Actor #{} ({})",
                paymentId, currentStatus, targetStatus, actorUserId, actorRole);

        // Synchronize Order status if needed
        if (targetStatus.isSuccessful() && order.getOrderStatus() == OrderStatus.ACCEPTED) {
            order.setOrderStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
            log.info("Order #{} transitioned to CONFIRMED following settlement of Payment #{}", order.getOrderId(), paymentId);
        }

        // Record price history for analytical reporting (Phase 11)
        if (targetStatus.isSuccessful()) {
            priceHistoryService.recordPriceForCompletedOrder(order);
        }

        return enrichPaymentResponse(saved);
    }

    /**
     * Get financial settlement summary for a specific order.
     */
    @Transactional(readOnly = true)
    public PaymentSummaryDto getOrderPaymentSummary(Integer actorUserId, Role actorRole, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        // Ownership enforcement
        if (actorRole == Role.BUYER) {
            if (!order.getBuyer().getUserId().equals(actorUserId)) {
                throw new AccessDeniedException("Access denied: You do not have permission to view payments for order #" + orderId);
            }
        } else if (actorRole == Role.FARMER) {
            if (!order.getHarvest().getFarmer().getUserId().equals(actorUserId)) {
                throw new AccessDeniedException("Access denied: You do not have permission to view payments for order #" + orderId);
            }
        } else if (actorRole != Role.ADMIN) {
            throw new AccessDeniedException("Unauthorized role for viewing order payment summary.");
        }

        List<Payment> payments = paymentRepository.findByOrder_OrderIdOrderByPaymentDateDesc(orderId);
        List<PaymentResponse> paymentResponses = payments.stream().map(this::enrichPaymentResponse).toList();

        BigDecimal totalPaid = paymentRepository.sumCompletedAmountByOrderId(orderId);
        BigDecimal remaining = order.getTotalAmount().subtract(totalPaid);
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            remaining = BigDecimal.ZERO;
        }
        boolean fullyPaid = remaining.compareTo(BigDecimal.ZERO) == 0;

        return new PaymentSummaryDto(orderId, order.getTotalAmount(), totalPaid, remaining, fullyPaid, paymentResponses);
    }

    /**
     * Enriches payment response with buyer profile (business name) and farmer profile (farm location).
     */
    private PaymentResponse enrichPaymentResponse(Payment payment) {
        PaymentResponse response = new PaymentResponse(payment);

        if (payment.getOrder() != null) {
            Order o = payment.getOrder();
            if (o.getBuyer() != null) {
                buyerProfileRepository.findById(o.getBuyer().getUserId())
                        .ifPresent(bp -> response.setBusinessName(bp.getBusinessName()));
            }
            if (o.getHarvest() != null && o.getHarvest().getFarmer() != null) {
                farmerProfileRepository.findById(o.getHarvest().getFarmer().getUserId())
                        .ifPresent(fp -> response.setFarmLocation(fp.getFarmLocation()));
            }
        }

        return response;
    }

    /**
     * Generates a unique simulation transaction reference: TXN-YYYYMMDD-ORD<orderId>-<4_digits>
     */
    private String generateTransactionReference(Integer orderId) {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return String.format("TXN-%s-ORD%d-%04d", dateStr, orderId, rand);
    }
}
