package com.agriconnect.repository;

import com.agriconnect.entity.Payment;
import com.agriconnect.entity.PaymentMethod;
import com.agriconnect.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    // Buyer-specific queries
    List<Payment> findByOrder_Buyer_UserIdOrderByPaymentDateDesc(Integer buyerId);

    Optional<Payment> findByPaymentIdAndOrder_Buyer_UserId(Integer paymentId, Integer buyerId);

    // Farmer-specific queries
    List<Payment> findByOrder_Harvest_Farmer_UserIdOrderByPaymentDateDesc(Integer farmerId);

    Optional<Payment> findByPaymentIdAndOrder_Harvest_Farmer_UserId(Integer paymentId, Integer farmerId);

    // Order-specific queries
    List<Payment> findByOrder_OrderIdOrderByPaymentDateDesc(Integer orderId);

    // Transaction reference checks
    Optional<Payment> findByTransactionReference(String transactionReference);

    boolean existsByTransactionReference(String transactionReference);

    // Admin filter queries
    List<Payment> findAllByOrderByPaymentDateDesc();

    List<Payment> findByPaymentStatusOrderByPaymentDateDesc(PaymentStatus paymentStatus);

    List<Payment> findByPaymentMethodOrderByPaymentDateDesc(PaymentMethod paymentMethod);

    List<Payment> findByPaymentStatusAndPaymentMethodOrderByPaymentDateDesc(
            PaymentStatus paymentStatus, PaymentMethod paymentMethod);

    // Aggregate queries for DBMS calculation & settlement integrity
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.order.orderId = :orderId AND p.paymentStatus IN (com.agriconnect.entity.PaymentStatus.COMPLETED, com.agriconnect.entity.PaymentStatus.PAID)")
    BigDecimal sumCompletedAmountByOrderId(@Param("orderId") Integer orderId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
           "WHERE p.paymentStatus IN (com.agriconnect.entity.PaymentStatus.COMPLETED, com.agriconnect.entity.PaymentStatus.PAID)")
    BigDecimal sumOverallCompletedPaymentValue();

    long countByPaymentStatus(PaymentStatus paymentStatus);
}
