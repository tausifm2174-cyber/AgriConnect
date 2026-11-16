package com.agriconnect.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * PriceHistory entity representing historical crop pricing and commercial
 * market transactions (Phase 11).
 * Mapped to the 'price_history' table in MySQL.
 */
@Entity
@Table(name = "price_history")
public class PriceHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "price_id")
    private Integer priceId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "crop_id", nullable = false)
    private Crop crop;

    @Enumerated(EnumType.STRING)
    @Column(name = "source_type")
    private PriceSourceType sourceType = PriceSourceType.TRANSACTION_SALE;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", unique = true)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farmer_id")
    private User farmer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id")
    private User buyer;

    @Column(name = "quantity", precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "unit_price", precision = 8, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_amount", precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "modal_price_per_kg", nullable = false, precision = 8, scale = 2)
    private BigDecimal modalPricePerKg;

    @Column(name = "min_price_per_kg", nullable = false, precision = 8, scale = 2)
    private BigDecimal minPricePerKg;

    @Column(name = "max_price_per_kg", nullable = false, precision = 8, scale = 2)
    private BigDecimal maxPricePerKg;

    @Column(name = "market_location", nullable = false, length = 100)
    private String marketLocation;

    @Column(name = "recorded_date", nullable = false)
    private LocalDate recordedDate;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public PriceHistory() {
    }

    public PriceHistory(Crop crop, PriceSourceType sourceType, Order order, User farmer, User buyer,
            BigDecimal quantity, BigDecimal unitPrice, BigDecimal totalAmount,
            BigDecimal modalPricePerKg, BigDecimal minPricePerKg, BigDecimal maxPricePerKg,
            String marketLocation, LocalDate recordedDate) {
        this.crop = crop;
        this.sourceType = sourceType != null ? sourceType : PriceSourceType.TRANSACTION_SALE;
        this.order = order;
        this.farmer = farmer;
        this.buyer = buyer;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalAmount = totalAmount;
        this.modalPricePerKg = modalPricePerKg != null ? modalPricePerKg : unitPrice;
        this.minPricePerKg = minPricePerKg != null ? minPricePerKg : unitPrice;
        this.maxPricePerKg = maxPricePerKg != null ? maxPricePerKg : unitPrice;
        this.marketLocation = marketLocation;
        this.recordedDate = recordedDate != null ? recordedDate : LocalDate.now();
    }

    public Integer getPriceId() {
        return priceId;
    }

    public void setPriceId(Integer priceId) {
        this.priceId = priceId;
    }

    public Crop getCrop() {
        return crop;
    }

    public void setCrop(Crop crop) {
        this.crop = crop;
    }

    public PriceSourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(PriceSourceType sourceType) {
        this.sourceType = sourceType;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public User getFarmer() {
        return farmer;
    }

    public void setFarmer(User farmer) {
        this.farmer = farmer;
    }

    public User getBuyer() {
        return buyer;
    }

    public void setBuyer(User buyer) {
        this.buyer = buyer;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public BigDecimal getModalPricePerKg() {
        return modalPricePerKg;
    }

    public void setModalPricePerKg(BigDecimal modalPricePerKg) {
        this.modalPricePerKg = modalPricePerKg;
    }

    public BigDecimal getMinPricePerKg() {
        return minPricePerKg;
    }

    public void setMinPricePerKg(BigDecimal minPricePerKg) {
        this.minPricePerKg = minPricePerKg;
    }

    public BigDecimal getMaxPricePerKg() {
        return maxPricePerKg;
    }

    public void setMaxPricePerKg(BigDecimal maxPricePerKg) {
        this.maxPricePerKg = maxPricePerKg;
    }

    public String getMarketLocation() {
        return marketLocation;
    }

    public void setMarketLocation(String marketLocation) {
        this.marketLocation = marketLocation;
    }

    public LocalDate getRecordedDate() {
        return recordedDate;
    }

    public void setRecordedDate(LocalDate recordedDate) {
        this.recordedDate = recordedDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    /**
     * Helper method to return the effective price:
     * unitPrice for transaction sales, or modalPricePerKg for mandi benchmark entries.
     */
    public BigDecimal getEffectivePrice() {
        return unitPrice != null ? unitPrice : modalPricePerKg;
    }
}
