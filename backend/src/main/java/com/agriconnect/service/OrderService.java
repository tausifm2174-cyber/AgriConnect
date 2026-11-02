package com.agriconnect.service;

import com.agriconnect.dto.CreateOrderRequest;
import com.agriconnect.dto.OrderDecisionRequest;
import com.agriconnect.dto.OrderResponse;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

/**
 * Service orchestrating Order Management (Phase 8).
 * Manages atomic order creation with pessimistic row-locking on harvests,
 * role-bounded lifecycle state transitions (PENDING -> ACCEPTED, REJECTED, CANCELLED),
 * and guaranteed single-time stock restoration.
 */
@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final HarvestRepository harvestRepository;
    private final BuyerRequirementRepository requirementRepository;
    private final QualityAssessmentRepository qualityAssessmentRepository;
    private final UserRepository userRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final FarmerProfileRepository farmerProfileRepository;

    public OrderService(OrderRepository orderRepository,
                        HarvestRepository harvestRepository,
                        BuyerRequirementRepository requirementRepository,
                        QualityAssessmentRepository qualityAssessmentRepository,
                        UserRepository userRepository,
                        BuyerProfileRepository buyerProfileRepository,
                        FarmerProfileRepository farmerProfileRepository) {
        this.orderRepository = orderRepository;
        this.harvestRepository = harvestRepository;
        this.requirementRepository = requirementRepository;
        this.qualityAssessmentRepository = qualityAssessmentRepository;
        this.userRepository = userRepository;
        this.buyerProfileRepository = buyerProfileRepository;
        this.farmerProfileRepository = farmerProfileRepository;
    }

    /**
     * Places a new commercial purchase order for a verified harvest lot.
     * Executes atomically with pessimistic write-locking on the target harvest lot
     * to prevent race conditions and stock overselling under concurrent purchase attempts.
     *
     * @param buyerUserId Authenticated buyer user ID from JWT
     * @param request     Order specifications (harvest ID, quantity, price, requirement ID, remarks)
     * @return 201 Created OrderResponse
     */
    @Transactional
    public OrderResponse createOrder(Integer buyerUserId, CreateOrderRequest request) {
        log.info("Buyer #{} placing order for Harvest lot #{} (Qty: {} kg)",
                buyerUserId, request.getHarvestId(), request.getQuantity());

        // 1. Verify Buyer identity
        User buyer = userRepository.findById(buyerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer user not found with ID: " + buyerUserId));

        if (buyer.getRole() != Role.BUYER) {
            throw new AccessDeniedException("Only users with role BUYER can place purchase orders.");
        }
        if (buyer.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Buyer account is not active.");
        }

        // 2. Validate quantity parameter
        if (request.getQuantity() == null || request.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Order quantity must be positive and greater than 0 kg.");
        }

        // 3. Acquire pessimistic write lock on the Harvest lot (SELECT ... FOR UPDATE)
        Harvest harvest = harvestRepository.findByIdForUpdate(request.getHarvestId())
                .orElseThrow(() -> new ResourceNotFoundException("Harvest not found with ID: " + request.getHarvestId()));

        User farmer = harvest.getFarmer();
        if (farmer == null || farmer.getStatus() != UserStatus.ACTIVE) {
            throw new BadRequestException("Harvest belongs to an invalid or inactive farmer.");
        }

        // 4. Verify Buyer and Farmer are distinct individuals
        if (buyer.getUserId().equals(farmer.getUserId())) {
            throw new BadRequestException("Buyers cannot place orders for their own harvested lots.");
        }

        // 5. Verify Harvest has an official VERIFIED Quality Assessment
        QualityAssessment qa = qualityAssessmentRepository.findByHarvest_HarvestId(harvest.getHarvestId())
                .orElseThrow(() -> new BadRequestException("Cannot place order: Harvest #" + harvest.getHarvestId()
                        + " does not have an official quality assessment on file."));

        if (qa.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new BadRequestException("Cannot place order: Harvest #" + harvest.getHarvestId()
                    + " has quality verification status " + qa.getVerificationStatus()
                    + ". Only VERIFIED harvests are eligible for purchase.");
        }

        // 6. Verify Harvest inventory status eligibility
        if (harvest.getStatus() == HarvestStatus.SOLD_OUT || harvest.getStatus() == HarvestStatus.CANCELLED) {
            throw new BadRequestException("Harvest #" + harvest.getHarvestId()
                    + " is currently " + harvest.getStatus() + " and not eligible for ordering.");
        }

        // 7. Verify stock coverage
        if (request.getQuantity().compareTo(harvest.getAvailableQuantity()) > 0) {
            throw new BadRequestException("Requested quantity (" + request.getQuantity()
                    + " kg) exceeds currently available harvest inventory (" + harvest.getAvailableQuantity() + " kg).");
        }

        // 8. Validate pricing and optional Buyer Requirement alignment
        BigDecimal agreedPrice = request.getAgreedPricePerKg() != null ? request.getAgreedPricePerKg() : harvest.getPricePerKg();
        BuyerRequirement requirement = null;

        if (request.getRequirementId() != null) {
            requirement = requirementRepository.findById(request.getRequirementId())
                    .orElseThrow(() -> new ResourceNotFoundException("Buyer requirement not found with ID: " + request.getRequirementId()));

            // Ownership check on requirement
            if (!requirement.getBuyer().getUserId().equals(buyerUserId)) {
                throw new BadRequestException("Buyer requirement #" + request.getRequirementId()
                        + " does not belong to the authenticated buyer.");
            }

            // Expiration and status check
            LocalDate today = LocalDate.now();
            if (requirement.getStatus() == RequirementStatus.OPEN && requirement.getRequiredByDate() != null
                    && requirement.getRequiredByDate().isBefore(today)) {
                requirement.setStatus(RequirementStatus.EXPIRED);
                requirementRepository.save(requirement);
                throw new BadRequestException("Buyer requirement #" + requirement.getRequirementId()
                        + " has EXPIRED (required-by date was " + requirement.getRequiredByDate() + ") and cannot be ordered against.");
            }

            if (requirement.getStatus() != RequirementStatus.OPEN) {
                throw new BadRequestException("Buyer requirement #" + requirement.getRequirementId()
                        + " has status " + requirement.getStatus() + ". Only OPEN requirements can be used to place orders.");
            }

            // Crop alignment
            if (!requirement.getCrop().getCropId().equals(harvest.getCrop().getCropId())) {
                throw new BadRequestException("Harvest crop (" + harvest.getCrop().getCropName()
                        + ") does not match requirement crop (" + requirement.getCrop().getCropName() + ").");
            }

            // Quality standard check
            List<QualityGrade> acceptableGrades = QualityGrade.getAcceptableGrades(requirement.getMinQualityGrade());
            if (!acceptableGrades.contains(qa.getQualityGrade())) {
                throw new BadRequestException("Harvest quality grade (" + qa.getQualityGrade()
                        + ") does not satisfy requirement minimum grade requirement (" + requirement.getMinQualityGrade() + ").");
            }

            // Price ceiling check
            if (agreedPrice.compareTo(requirement.getMaxPricePerKg()) > 0) {
                throw new BadRequestException("Agreed price (₹" + agreedPrice
                        + "/kg) exceeds requirement maximum ceiling price (₹" + requirement.getMaxPricePerKg() + "/kg).");
            }
        }

        if (agreedPrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Agreed price per kg must be greater than 0.");
        }

        // 9. Atomic Stock Deduction
        BigDecimal remainingStock = harvest.getAvailableQuantity().subtract(request.getQuantity());
        harvest.setAvailableQuantity(remainingStock);

        if (remainingStock.compareTo(BigDecimal.ZERO) == 0) {
            harvest.setStatus(HarvestStatus.SOLD_OUT);
            log.info("Harvest #{} marked as SOLD_OUT following order placement.", harvest.getHarvestId());
        } else {
            harvest.setStatus(HarvestStatus.PARTIALLY_SOLD);
        }
        harvestRepository.save(harvest);

        // 10. Compute immutable contract total amount
        BigDecimal totalAmount = request.getQuantity().multiply(agreedPrice).setScale(2, RoundingMode.HALF_UP);

        // 11. Create and persist Order
        Order order = new Order(
                buyer,
                harvest,
                requirement,
                request.getQuantity(),
                agreedPrice,
                totalAmount,
                OrderStatus.PENDING,
                request.getRemarks()
        );

        Order savedOrder = orderRepository.save(order);
        log.info("Order #{} successfully placed. Reserved {} kg of Harvest #{}. Total contract value: ₹{}",
                savedOrder.getOrderId(), savedOrder.getQuantity(), harvest.getHarvestId(), savedOrder.getTotalAmount());

        return enrichOrderResponse(savedOrder, qa);
    }

    /**
     * Retrieve all orders placed by the authenticated buyer.
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getBuyerOrders(Integer buyerUserId) {
        return orderRepository.findByBuyer_UserIdOrderByOrderDateDesc(buyerUserId)
                .stream()
                .map(this::enrichOrderResponse)
                .toList();
    }

    /**
     * Retrieve a specific order by ID, strictly enforcing buyer ownership.
     */
    @Transactional(readOnly = true)
    public OrderResponse getBuyerOrderById(Integer buyerUserId, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (!order.getBuyer().getUserId().equals(buyerUserId)) {
            log.warn("Security violation: Buyer #{} attempted to view order #{} owned by buyer #{}",
                    buyerUserId, orderId, order.getBuyer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to view order #" + orderId);
        }

        return enrichOrderResponse(order);
    }

    /**
     * Cancels an eligible PENDING order by the authenticated buyer.
     * Restores reserved harvest stock atomically exactly once.
     */
    @Transactional
    public OrderResponse cancelBuyerOrder(Integer buyerUserId, Integer orderId, OrderDecisionRequest request) {
        log.info("Buyer #{} requesting cancellation for order #{}", buyerUserId, orderId);

        // Lock order row for update
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        // Enforce ownership
        if (!order.getBuyer().getUserId().equals(buyerUserId)) {
            log.warn("Security violation: Buyer #{} attempted to cancel order #{} owned by buyer #{}",
                    buyerUserId, orderId, order.getBuyer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to cancel order #" + orderId);
        }

        // Validate lifecycle transition
        if (!order.getOrderStatus().canTransitionTo(OrderStatus.CANCELLED)) {
            throw new BadRequestException("Order #" + orderId + " cannot be cancelled because its current status is "
                    + order.getOrderStatus() + ". Only PENDING orders are eligible for cancellation.");
        }

        // Atomically restore harvest stock
        restoreHarvestStock(order);

        // Update order status
        order.setOrderStatus(OrderStatus.CANCELLED);
        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason().trim()
                : "Cancelled by buyer";
        order.setCancellationReason(reason);

        Order saved = orderRepository.save(order);
        log.info("Order #{} successfully CANCELLED by buyer. Stock restored.", orderId);
        return enrichOrderResponse(saved);
    }

    /**
     * Retrieve all incoming orders for harvests owned by the authenticated farmer.
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getFarmerOrders(Integer farmerUserId) {
        return orderRepository.findByHarvest_Farmer_UserIdOrderByOrderDateDesc(farmerUserId)
                .stream()
                .map(this::enrichOrderResponse)
                .toList();
    }

    /**
     * Retrieve a specific order by ID, strictly enforcing farmer ownership.
     */
    @Transactional(readOnly = true)
    public OrderResponse getFarmerOrderById(Integer farmerUserId, Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (!order.getHarvest().getFarmer().getUserId().equals(farmerUserId)) {
            log.warn("Security violation: Farmer #{} attempted to view order #{} for harvest owned by farmer #{}",
                    farmerUserId, orderId, order.getHarvest().getFarmer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to view order #" + orderId);
        }

        return enrichOrderResponse(order);
    }

    /**
     * Farmer accepts an incoming PENDING order.
     */
    @Transactional
    public OrderResponse acceptFarmerOrder(Integer farmerUserId, Integer orderId) {
        log.info("Farmer #{} accepting order #{}", farmerUserId, orderId);

        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (!order.getHarvest().getFarmer().getUserId().equals(farmerUserId)) {
            log.warn("Security violation: Farmer #{} attempted to accept order #{} for harvest owned by farmer #{}",
                    farmerUserId, orderId, order.getHarvest().getFarmer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to accept order #" + orderId);
        }

        if (!order.getOrderStatus().canTransitionTo(OrderStatus.ACCEPTED)) {
            throw new BadRequestException("Order #" + orderId + " cannot be accepted because its current status is "
                    + order.getOrderStatus() + ". Only PENDING orders can be accepted.");
        }

        order.setOrderStatus(OrderStatus.ACCEPTED);
        Order saved = orderRepository.save(order);
        log.info("Order #{} ACCEPTED by farmer #{}.", orderId, farmerUserId);
        return enrichOrderResponse(saved);
    }

    /**
     * Farmer rejects an incoming PENDING order.
     * Restores reserved harvest stock atomically exactly once.
     */
    @Transactional
    public OrderResponse rejectFarmerOrder(Integer farmerUserId, Integer orderId, OrderDecisionRequest request) {
        log.info("Farmer #{} rejecting order #{}", farmerUserId, orderId);

        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (!order.getHarvest().getFarmer().getUserId().equals(farmerUserId)) {
            log.warn("Security violation: Farmer #{} attempted to reject order #{} for harvest owned by farmer #{}",
                    farmerUserId, orderId, order.getHarvest().getFarmer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to reject order #" + orderId);
        }

        if (!order.getOrderStatus().canTransitionTo(OrderStatus.REJECTED)) {
            throw new BadRequestException("Order #" + orderId + " cannot be rejected because its current status is "
                    + order.getOrderStatus() + ". Only PENDING orders can be rejected.");
        }

        // Atomically restore harvest stock
        restoreHarvestStock(order);

        // Update order status
        order.setOrderStatus(OrderStatus.REJECTED);
        String reason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason().trim()
                : "Rejected by farmer";
        order.setCancellationReason(reason);

        Order saved = orderRepository.save(order);
        log.info("Order #{} successfully REJECTED by farmer. Stock restored.", orderId);
        return enrichOrderResponse(saved);
    }

    /**
     * Administrative endpoint to monitor all orders across the marketplace,
     * with optional status filtering.
     */
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders(OrderStatus status) {
        List<Order> orders = (status != null)
                ? orderRepository.findByOrderStatusOrderByOrderDateDesc(status)
                : orderRepository.findAllByOrderByOrderDateDesc();

        return orders.stream()
                .map(this::enrichOrderResponse)
                .toList();
    }

    /**
     * Administrative endpoint to inspect any order details.
     */
    @Transactional(readOnly = true)
    public OrderResponse getAdminOrderById(Integer orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));
        return enrichOrderResponse(order);
    }

    /**
     * Helper to restore harvest stock atomically with a pessimistic lock.
     * Ensures stock restoration is never applied multiple times.
     */
    private void restoreHarvestStock(Order order) {
        Harvest harvest = harvestRepository.findByIdForUpdate(order.getHarvest().getHarvestId())
                .orElseThrow(() -> new ResourceNotFoundException("Harvest not found with ID: " + order.getHarvest().getHarvestId()));

        BigDecimal restored = harvest.getAvailableQuantity().add(order.getQuantity());
        harvest.setAvailableQuantity(restored);

        if (restored.compareTo(harvest.getInitialQuantity()) >= 0) {
            harvest.setStatus(HarvestStatus.AVAILABLE);
        } else {
            harvest.setStatus(HarvestStatus.PARTIALLY_SOLD);
        }

        harvestRepository.save(harvest);
        log.info("Restored {} kg of stock to Harvest #{}. New available quantity: {} kg (Status: {})",
                order.getQuantity(), harvest.getHarvestId(), harvest.getAvailableQuantity(), harvest.getStatus());
    }

    /**
     * Enriches the response DTO with buyer profile, quality assessment, and farmer details.
     */
    private OrderResponse enrichOrderResponse(Order order) {
        QualityAssessment qa = qualityAssessmentRepository.findByHarvest_HarvestId(order.getHarvest().getHarvestId())
                .orElse(null);
        return enrichOrderResponse(order, qa);
    }

    private OrderResponse enrichOrderResponse(Order order, QualityAssessment qa) {
        OrderResponse response = new OrderResponse(order);

        if (qa != null) {
            response.setQualityGrade(qa.getQualityGrade());
            response.setQualityScore(qa.getQualityScore());
            response.setQualityVerificationStatus(qa.getVerificationStatus());
        }

        if (order.getBuyer() != null) {
            buyerProfileRepository.findById(order.getBuyer().getUserId())
                    .ifPresent(bp -> response.setBusinessName(bp.getBusinessName()));
        }

        if (order.getHarvest() != null && order.getHarvest().getFarmer() != null) {
            farmerProfileRepository.findById(order.getHarvest().getFarmer().getUserId())
                    .ifPresent(fp -> {
                        if (response.getFarmLocation() == null) {
                            response.setFarmLocation(fp.getFarmLocation());
                        }
                    });
        }

        return response;
    }
}
