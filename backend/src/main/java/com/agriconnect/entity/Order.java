package com.agriconnect.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Order entity representing a point-in-time purchase contract between a commercial buyer
 * and a farmer's harvested lot.
 * Mapped to the existing 'orders' table in MySQL.
 */
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_id")
    private Integer orderId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "harvest_id", nullable = false)
    private Harvest harvest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requirement_id")
    private BuyerRequirement requirement;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "agreed_price_per_kg", nullable = false, precision = 8, scale = 2)
    private BigDecimal agreedPricePerKg;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_status", nullable = false)
    private OrderStatus orderStatus = OrderStatus.PENDING;

    @Column(name = "remarks", length = 255)
    private String remarks;

    @Column(name = "cancellation_reason", length = 255)
    private String cancellationReason;

    @Column(name = "order_date", insertable = false, updatable = false)
    private LocalDateTime orderDate;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public Order() {
    }

    public Order(User buyer, Harvest harvest, BuyerRequirement requirement,
                 BigDecimal quantity, BigDecimal agreedPricePerKg, BigDecimal totalAmount,
                 OrderStatus orderStatus, String remarks) {
        this.buyer = buyer;
        this.harvest = harvest;
        this.requirement = requirement;
        this.quantity = quantity;
        this.agreedPricePerKg = agreedPricePerKg;
        this.totalAmount = totalAmount;
        this.orderStatus = orderStatus != null ? orderStatus : OrderStatus.PENDING;
        this.remarks = remarks;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public User getBuyer() {
        return buyer;
    }

    public void setBuyer(User buyer) {
        this.buyer = buyer;
    }

    public Harvest getHarvest() {
        return harvest;
    }

    public void setHarvest(Harvest harvest) {
        this.harvest = harvest;
    }

    public BuyerRequirement getRequirement() {
        return requirement;
    }

    public void setRequirement(BuyerRequirement requirement) {
        this.requirement = requirement;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getAgreedPricePerKg() {
        return agreedPricePerKg;
    }

    public void setAgreedPricePerKg(BigDecimal agreedPricePerKg) {
        this.agreedPricePerKg = agreedPricePerKg;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
