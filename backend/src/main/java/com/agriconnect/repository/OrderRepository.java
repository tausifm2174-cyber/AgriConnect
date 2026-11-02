package com.agriconnect.repository;

import com.agriconnect.entity.Order;
import com.agriconnect.entity.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Orders.
 * Supports role-bounded queries for Buyers, Farmers, and Administrators,
 * as well as pessimistic locking for safe concurrent order state transitions.
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {

    /**
     * Retrieve all orders placed by a specific buyer, ordered by newest first.
     */
    List<Order> findByBuyer_UserIdOrderByOrderDateDesc(Integer buyerUserId);

    /**
     * Retrieve all orders for harvests owned by a specific farmer, ordered by newest first.
     */
    List<Order> findByHarvest_Farmer_UserIdOrderByOrderDateDesc(Integer farmerUserId);

    /**
     * Retrieve all orders across the marketplace, ordered by newest first (for Admin).
     */
    List<Order> findAllByOrderByOrderDateDesc();

    /**
     * Retrieve all orders filtered by status (for Admin).
     */
    List<Order> findByOrderStatusOrderByOrderDateDesc(OrderStatus orderStatus);

    /**
     * Retrieve an order by ID strictly enforcing buyer ownership.
     */
    Optional<Order> findByOrderIdAndBuyer_UserId(Integer orderId, Integer buyerUserId);

    /**
     * Retrieve an order by ID strictly enforcing farmer ownership of the harvest.
     */
    Optional<Order> findByOrderIdAndHarvest_Farmer_UserId(Integer orderId, Integer farmerUserId);

    /**
     * Lock an order for update (SELECT ... FOR UPDATE) to prevent concurrent double-cancellation
     * or conflicting state transitions.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.orderId = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Integer id);

    /**
     * Count orders by buyer and status (for dashboard metrics).
     */
    long countByBuyer_UserIdAndOrderStatus(Integer buyerUserId, OrderStatus orderStatus);

    /**
     * Count orders by farmer and status (for dashboard metrics).
     */
    long countByHarvest_Farmer_UserIdAndOrderStatus(Integer farmerUserId, OrderStatus orderStatus);
}
