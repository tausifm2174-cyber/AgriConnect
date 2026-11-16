package com.agriconnect.service;

import com.agriconnect.dto.CreateDeliveryRequest;
import com.agriconnect.dto.DeliveryResponse;
import com.agriconnect.dto.UpdateDeliveryStatusRequest;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.BuyerProfileRepository;
import com.agriconnect.repository.DeliveryRepository;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Service managing Delivery & Logistics Fulfillment (Phase 9).
 * Ensures:
 * - 1:1 delivery contract binding to valid non-cancelled orders.
 * - Duplicate delivery prevention.
 * - Strict multi-tenant ownership enforcement for Buyers, Farmers, and Administrators.
 * - Synchronized, atomic state transitions between Delivery and Order entities.
 * - Prevention of invalid backward status transitions.
 */
@Service
public class DeliveryService {

    private static final Logger log = LoggerFactory.getLogger(DeliveryService.class);

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final FarmerProfileRepository farmerProfileRepository;

    public DeliveryService(DeliveryRepository deliveryRepository,
                           OrderRepository orderRepository,
                           BuyerProfileRepository buyerProfileRepository,
                           FarmerProfileRepository farmerProfileRepository) {
        this.deliveryRepository = deliveryRepository;
        this.orderRepository = orderRepository;
        this.buyerProfileRepository = buyerProfileRepository;
        this.farmerProfileRepository = farmerProfileRepository;
    }

    /**
     * Creates a new delivery record for an existing eligible order.
     * Enforces ownership, uniqueness, and valid initial state.
     *
     * @param actorUserId Authenticated user ID from JWT
     * @param actorRole   Role of the caller (BUYER, FARMER, ADMIN)
     * @param request     Delivery creation specifications
     * @return 201 Created DeliveryResponse
     */
    @Transactional
    public DeliveryResponse createDelivery(Integer actorUserId, Role actorRole, CreateDeliveryRequest request) {
        if (request.getOrderId() == null) {
            throw new BadRequestException("Order ID is required to create a delivery.");
        }

        if (request.getDeliveryAddress() == null || request.getDeliveryAddress().trim().isBlank()) {
            throw new BadRequestException("Delivery address is required and cannot be blank.");
        }

        // 1. Fetch and write-lock the target Order
        Order order = orderRepository.findByIdForUpdate(request.getOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + request.getOrderId()));

        // 2. Prevent duplicate delivery creation for the same order
        if (deliveryRepository.existsByOrder_OrderId(order.getOrderId())) {
            throw new BadRequestException("A delivery record already exists for Order #" + order.getOrderId()
                    + ". Duplicate delivery creation is prevented.");
        }

        // 3. Verify Order status eligibility
        if (order.getOrderStatus() == OrderStatus.CANCELLED || order.getOrderStatus() == OrderStatus.REJECTED) {
            throw new BadRequestException("Cannot create delivery for order #" + order.getOrderId()
                    + " because order status is " + order.getOrderStatus() + ".");
        }

        // 4. Enforce strict role-bounded ownership
        if (actorRole == Role.BUYER) {
            if (!order.getBuyer().getUserId().equals(actorUserId)) {
                log.warn("Security violation: Buyer #{} attempted to create delivery for order #{} owned by buyer #{}",
                        actorUserId, order.getOrderId(), order.getBuyer().getUserId());
                throw new AccessDeniedException("Access denied: You do not have permission to create delivery for order #" + order.getOrderId());
            }
        } else if (actorRole == Role.FARMER) {
            if (!order.getHarvest().getFarmer().getUserId().equals(actorUserId)) {
                log.warn("Security violation: Farmer #{} attempted to create delivery for order #{} owned by farmer #{}",
                        actorUserId, order.getOrderId(), order.getHarvest().getFarmer().getUserId());
                throw new AccessDeniedException("Access denied: You do not have permission to create delivery for order #" + order.getOrderId());
            }
        } else if (actorRole != Role.ADMIN) {
            throw new AccessDeniedException("Unauthorized role for creating deliveries.");
        }

        // 5. Generate tracking number if not supplied
        String trackingNumber = (request.getTrackingNumber() != null && !request.getTrackingNumber().trim().isBlank())
                ? request.getTrackingNumber().trim()
                : generateTrackingNumber(order.getOrderId());

        // 6. Transition Order from ACCEPTED to CONFIRMED if applicable
        if (order.getOrderStatus() == OrderStatus.ACCEPTED) {
            order.setOrderStatus(OrderStatus.CONFIRMED);
            orderRepository.save(order);
            log.info("Order #{} transitioned from ACCEPTED to CONFIRMED upon delivery creation.", order.getOrderId());
        }

        // 7. Persist Delivery
        Delivery delivery = new Delivery();
        delivery.setOrder(order);
        delivery.setDeliveryStatus(DeliveryStatus.PENDING);
        delivery.setDeliveryAddress(request.getDeliveryAddress().trim());
        delivery.setVehicleNumber(request.getVehicleNumber() != null ? request.getVehicleNumber().trim() : null);
        delivery.setTrackingNumber(trackingNumber);
        delivery.setRemarks(request.getRemarks() != null ? request.getRemarks().trim() : null);

        Delivery saved = deliveryRepository.save(delivery);
        log.info("Delivery #{} created for Order #{} with tracking number {}",
                saved.getDeliveryId(), order.getOrderId(), saved.getTrackingNumber());

        return enrichDeliveryResponse(saved);
    }

    /**
     * Retrieve all deliveries for orders placed by the authenticated buyer.
     */
    @Transactional(readOnly = true)
    public List<DeliveryResponse> getBuyerDeliveries(Integer buyerUserId) {
        return deliveryRepository.findByOrder_Buyer_UserIdOrderByCreatedAtDesc(buyerUserId)
                .stream()
                .map(this::enrichDeliveryResponse)
                .toList();
    }

    /**
     * Retrieve specific delivery by ID, strictly enforcing buyer ownership.
     */
    @Transactional(readOnly = true)
    public DeliveryResponse getBuyerDeliveryById(Integer buyerUserId, Integer deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with ID: " + deliveryId));

        if (!delivery.getOrder().getBuyer().getUserId().equals(buyerUserId)) {
            log.warn("Security violation: Buyer #{} attempted to view delivery #{} owned by buyer #{}",
                    buyerUserId, deliveryId, delivery.getOrder().getBuyer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to view delivery #" + deliveryId);
        }

        return enrichDeliveryResponse(delivery);
    }

    /**
     * Retrieve all deliveries for harvests owned by the authenticated farmer.
     */
    @Transactional(readOnly = true)
    public List<DeliveryResponse> getFarmerDeliveries(Integer farmerUserId) {
        return deliveryRepository.findByOrder_Harvest_Farmer_UserIdOrderByCreatedAtDesc(farmerUserId)
                .stream()
                .map(this::enrichDeliveryResponse)
                .toList();
    }

    /**
     * Retrieve specific delivery by ID, strictly enforcing farmer ownership.
     */
    @Transactional(readOnly = true)
    public DeliveryResponse getFarmerDeliveryById(Integer farmerUserId, Integer deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with ID: " + deliveryId));

        if (!delivery.getOrder().getHarvest().getFarmer().getUserId().equals(farmerUserId)) {
            log.warn("Security violation: Farmer #{} attempted to view delivery #{} owned by farmer #{}",
                    farmerUserId, deliveryId, delivery.getOrder().getHarvest().getFarmer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to view delivery #" + deliveryId);
        }

        return enrichDeliveryResponse(delivery);
    }

    /**
     * Farmer marks delivery as SHIPPED.
     * Synchronously and atomically transitions associated Order to SHIPPED.
     * Enforces farmer ownership and valid state transition.
     */
    @Transactional
    public DeliveryResponse shipDelivery(Integer farmerUserId, Integer deliveryId, UpdateDeliveryStatusRequest request) {
        log.info("Farmer #{} shipping delivery #{}", farmerUserId, deliveryId);

        // Pessimistic write-lock on delivery
        Delivery delivery = deliveryRepository.findByIdForUpdate(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with ID: " + deliveryId));

        Order order = delivery.getOrder();

        // Enforce farmer ownership
        if (!order.getHarvest().getFarmer().getUserId().equals(farmerUserId)) {
            log.warn("Security violation: Farmer #{} attempted to ship delivery #{} owned by farmer #{}",
                    farmerUserId, deliveryId, order.getHarvest().getFarmer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to ship delivery #" + deliveryId);
        }

        // Validate delivery status transition
        if (!delivery.getDeliveryStatus().canTransitionTo(DeliveryStatus.SHIPPED)) {
            throw new BadRequestException("Delivery #" + deliveryId + " cannot transition from "
                    + delivery.getDeliveryStatus() + " to SHIPPED.");
        }

        // Validate order status transition
        if (order.getOrderStatus() != OrderStatus.CONFIRMED && order.getOrderStatus() != OrderStatus.ACCEPTED) {
            throw new BadRequestException("Order #" + order.getOrderId() + " with status "
                    + order.getOrderStatus() + " cannot transition to SHIPPED. Must be ACCEPTED or CONFIRMED.");
        }

        // Update delivery details
        delivery.setDeliveryStatus(DeliveryStatus.SHIPPED);
        delivery.setDispatchedAt(LocalDateTime.now());

        if (request != null) {
            if (request.getTrackingNumber() != null && !request.getTrackingNumber().trim().isBlank()) {
                delivery.setTrackingNumber(request.getTrackingNumber().trim());
            }
            if (request.getVehicleNumber() != null && !request.getVehicleNumber().trim().isBlank()) {
                delivery.setVehicleNumber(request.getVehicleNumber().trim());
            }
            if (request.getRemarks() != null && !request.getRemarks().trim().isBlank()) {
                delivery.setRemarks(request.getRemarks().trim());
            }
            if (request.getDeliveryAddress() != null && !request.getDeliveryAddress().trim().isBlank()) {
                delivery.setDeliveryAddress(request.getDeliveryAddress().trim());
            }
        }

        // Synchronously update Order status to SHIPPED
        order.setOrderStatus(OrderStatus.SHIPPED);
        orderRepository.save(order);

        Delivery savedDelivery = deliveryRepository.save(delivery);
        log.info("Delivery #{} and Order #{} atomically updated to SHIPPED.", deliveryId, order.getOrderId());

        return enrichDeliveryResponse(savedDelivery);
    }

    /**
     * Marks delivery as DELIVERED.
     * Can be invoked by authorized Farmer or Admin (or Buyer confirming receipt).
     * Synchronously and atomically transitions associated Order to DELIVERED.
     * Rejects invalid backward transitions (e.g. from DELIVERED or CANCELLED).
     */
    @Transactional
    public DeliveryResponse markAsDelivered(Integer actorUserId, Role actorRole, Integer deliveryId, UpdateDeliveryStatusRequest request) {
        log.info("User #{} (Role: {}) marking delivery #{} as DELIVERED", actorUserId, actorRole, deliveryId);

        // Pessimistic write-lock on delivery
        Delivery delivery = deliveryRepository.findByIdForUpdate(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with ID: " + deliveryId));

        Order order = delivery.getOrder();

        // Enforce ownership based on caller role
        if (actorRole == Role.FARMER) {
            if (!order.getHarvest().getFarmer().getUserId().equals(actorUserId)) {
                log.warn("Security violation: Farmer #{} attempted to deliver foreign delivery #{}", actorUserId, deliveryId);
                throw new AccessDeniedException("Access denied: You do not have permission to modify delivery #" + deliveryId);
            }
        } else if (actorRole == Role.BUYER) {
            if (!order.getBuyer().getUserId().equals(actorUserId)) {
                log.warn("Security violation: Buyer #{} attempted to confirm foreign delivery #{}", actorUserId, deliveryId);
                throw new AccessDeniedException("Access denied: You do not have permission to modify delivery #" + deliveryId);
            }
        } else if (actorRole != Role.ADMIN) {
            throw new AccessDeniedException("Unauthorized role for updating delivery status.");
        }

        // Validate delivery transition
        if (!delivery.getDeliveryStatus().canTransitionTo(DeliveryStatus.DELIVERED)) {
            throw new BadRequestException("Delivery #" + deliveryId + " cannot transition from "
                    + delivery.getDeliveryStatus() + " to DELIVERED.");
        }

        // Validate order transition
        if (order.getOrderStatus() != OrderStatus.SHIPPED) {
            throw new BadRequestException("Order #" + order.getOrderId() + " with status "
                    + order.getOrderStatus() + " cannot transition to DELIVERED. Order must be SHIPPED first.");
        }

        // Update delivery details
        delivery.setDeliveryStatus(DeliveryStatus.DELIVERED);
        delivery.setDeliveredAt(LocalDateTime.now());

        if (request != null) {
            if (request.getRemarks() != null && !request.getRemarks().trim().isBlank()) {
                delivery.setRemarks(request.getRemarks().trim());
            }
        }

        // Synchronously update Order status to DELIVERED
        order.setOrderStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        Delivery savedDelivery = deliveryRepository.save(delivery);
        log.info("Delivery #{} and Order #{} atomically completed with status DELIVERED.", deliveryId, order.getOrderId());

        return enrichDeliveryResponse(savedDelivery);
    }

    /**
     * Administrative overview: retrieve all deliveries with optional status filter.
     */
    @Transactional(readOnly = true)
    public List<DeliveryResponse> getAllDeliveries(DeliveryStatus status) {
        List<Delivery> deliveries = (status != null)
                ? deliveryRepository.findByDeliveryStatusOrderByCreatedAtDesc(status)
                : deliveryRepository.findAllByOrderByCreatedAtDesc();

        return deliveries.stream()
                .map(this::enrichDeliveryResponse)
                .toList();
    }

    /**
     * Administrative endpoint to inspect any delivery audit details.
     */
    @Transactional(readOnly = true)
    public DeliveryResponse getAdminDeliveryById(Integer deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with ID: " + deliveryId));
        return enrichDeliveryResponse(delivery);
    }

    /**
     * Administrative override: update delivery status and keep order synchronized.
     */
    @Transactional
    public DeliveryResponse updateDeliveryStatusByAdmin(Integer deliveryId, DeliveryStatus targetStatus, UpdateDeliveryStatusRequest request) {
        log.info("Admin updating delivery #{} to status {}", deliveryId, targetStatus);

        Delivery delivery = deliveryRepository.findByIdForUpdate(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with ID: " + deliveryId));

        Order order = delivery.getOrder();

        if (targetStatus == DeliveryStatus.SHIPPED) {
            return shipDelivery(order.getHarvest().getFarmer().getUserId(), deliveryId, request);
        } else if (targetStatus == DeliveryStatus.DELIVERED) {
            return markAsDelivered(order.getHarvest().getFarmer().getUserId(), Role.ADMIN, deliveryId, request);
        }

        if (!delivery.getDeliveryStatus().canTransitionTo(targetStatus)) {
            throw new BadRequestException("Delivery #" + deliveryId + " cannot transition from "
                    + delivery.getDeliveryStatus() + " to " + targetStatus + ".");
        }

        delivery.setDeliveryStatus(targetStatus);
        if (request != null) {
            if (request.getTrackingNumber() != null) delivery.setTrackingNumber(request.getTrackingNumber().trim());
            if (request.getVehicleNumber() != null) delivery.setVehicleNumber(request.getVehicleNumber().trim());
            if (request.getRemarks() != null) delivery.setRemarks(request.getRemarks().trim());
            if (request.getDeliveryAddress() != null) delivery.setDeliveryAddress(request.getDeliveryAddress().trim());
        }

        Delivery saved = deliveryRepository.save(delivery);
        return enrichDeliveryResponse(saved);
    }

    /**
     * Helper to enrich delivery response with profile metadata.
     */
    private DeliveryResponse enrichDeliveryResponse(Delivery delivery) {
        DeliveryResponse response = new DeliveryResponse(delivery);

        if (delivery.getOrder() != null) {
            Order o = delivery.getOrder();
            if (o.getBuyer() != null) {
                buyerProfileRepository.findById(o.getBuyer().getUserId())
                        .ifPresent(bp -> response.setBusinessName(bp.getBusinessName()));
            }
            if (o.getHarvest() != null && o.getHarvest().getFarmer() != null) {
                farmerProfileRepository.findById(o.getHarvest().getFarmer().getUserId())
                        .ifPresent(fp -> {
                            if (response.getFarmLocation() == null) {
                                response.setFarmLocation(fp.getFarmLocation());
                            }
                        });
            }
        }

        return response;
    }

    /**
     * Generates a unique tracking number in format: TRK-YYYYMMDD-ORD<orderId>-<4_digits>
     */
    private String generateTrackingNumber(Integer orderId) {
        String dateStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return String.format("TRK-%s-ORD%d-%04d", dateStr, orderId, rand);
    }
}
