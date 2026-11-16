package com.agriconnect.repository;

import com.agriconnect.entity.Delivery;
import com.agriconnect.entity.DeliveryStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Deliveries (Phase 9).
 * Provides role-bounded queries enforcing buyer and farmer ownership,
 * administrative overview queries, and pessimistic locking for atomic state transitions.
 */
@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Integer> {

    /**
     * Look up delivery associated with a specific order ID.
     */
    Optional<Delivery> findByOrder_OrderId(Integer orderId);

    /**
     * Check if a delivery record already exists for an order.
     */
    boolean existsByOrder_OrderId(Integer orderId);

    /**
     * Find delivery by tracking number.
     */
    Optional<Delivery> findByTrackingNumber(String trackingNumber);

    /**
     * Retrieve all deliveries for orders placed by a specific buyer, newest first.
     */
    List<Delivery> findByOrder_Buyer_UserIdOrderByCreatedAtDesc(Integer buyerUserId);

    /**
     * Retrieve delivery strictly enforcing buyer ownership of the order.
     */
    Optional<Delivery> findByDeliveryIdAndOrder_Buyer_UserId(Integer deliveryId, Integer buyerUserId);

    /**
     * Retrieve all deliveries for harvests produced by a specific farmer, newest first.
     */
    List<Delivery> findByOrder_Harvest_Farmer_UserIdOrderByCreatedAtDesc(Integer farmerUserId);

    /**
     * Retrieve delivery strictly enforcing farmer ownership of the harvest.
     */
    Optional<Delivery> findByDeliveryIdAndOrder_Harvest_Farmer_UserId(Integer deliveryId, Integer farmerUserId);

    /**
     * Retrieve all deliveries across the marketplace, newest first (Admin).
     */
    List<Delivery> findAllByOrderByCreatedAtDesc();

    /**
     * Retrieve deliveries filtered by delivery status (Admin).
     */
    List<Delivery> findByDeliveryStatusOrderByCreatedAtDesc(DeliveryStatus deliveryStatus);

    /**
     * Pessimistic row-locking for safe concurrent updates (SELECT ... FOR UPDATE).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM Delivery d WHERE d.deliveryId = :id")
    Optional<Delivery> findByIdForUpdate(@Param("id") Integer id);

    /**
     * Count deliveries by status for dashboard metrics.
     */
    long countByDeliveryStatus(DeliveryStatus deliveryStatus);

    /**
     * Count deliveries by buyer and status.
     */
    long countByOrder_Buyer_UserIdAndDeliveryStatus(Integer buyerUserId, DeliveryStatus deliveryStatus);

    /**
     * Count deliveries by farmer and status.
     */
    long countByOrder_Harvest_Farmer_UserIdAndDeliveryStatus(Integer farmerUserId, DeliveryStatus deliveryStatus);
}
