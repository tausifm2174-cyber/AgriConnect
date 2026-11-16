package com.agriconnect.dto;

import com.agriconnect.entity.PriceHistory;
import com.agriconnect.entity.PriceSourceType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Enriched response DTO for Price History & Analytics (Phase 11).
 * Represents APMC mandi benchmarks or completed commercial marketplace transactions.
 */
public class PriceHistoryResponse {

    private Integer priceId;
    private Integer cropId;
    private String cropName;
    private String cropCategory;
    private PriceSourceType sourceType;

    // Relational transaction attributes (populated for TRANSACTION_SALE)
    private Integer orderId;
    private Integer farmerId;
    private String farmerName;
    private Integer buyerId;
    private String buyerName;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;

    // Benchmark and trading price indicators
    private BigDecimal modalPricePerKg;
    private BigDecimal minPricePerKg;
    private BigDecimal maxPricePerKg;
    private BigDecimal effectivePrice;

    private String marketLocation;
    private LocalDate recordedDate;
    private LocalDateTime createdAt;

    public PriceHistoryResponse() {
    }

    public PriceHistoryResponse(PriceHistory entity) {
        if (entity != null) {
            this.priceId = entity.getPriceId();
            if (entity.getCrop() != null) {
                this.cropId = entity.getCrop().getCropId();
                this.cropName = entity.getCrop().getCropName();
                this.cropCategory = entity.getCrop().getCategory() != null ? entity.getCrop().getCategory().name() : null;
            }
            this.sourceType = entity.getSourceType();

            if (entity.getOrder() != null) {
                this.orderId = entity.getOrder().getOrderId();
            }
            if (entity.getFarmer() != null) {
                this.farmerId = entity.getFarmer().getUserId();
                this.farmerName = entity.getFarmer().getFullName();
            }
            if (entity.getBuyer() != null) {
                this.buyerId = entity.getBuyer().getUserId();
                this.buyerName = entity.getBuyer().getFullName();
            }

            this.quantity = entity.getQuantity();
            this.unitPrice = entity.getUnitPrice();
            this.totalAmount = entity.getTotalAmount();
            this.modalPricePerKg = entity.getModalPricePerKg();
            this.minPricePerKg = entity.getMinPricePerKg();
            this.maxPricePerKg = entity.getMaxPricePerKg();

            this.effectivePrice = entity.getEffectivePrice();
            this.marketLocation = entity.getMarketLocation();
            this.recordedDate = entity.getRecordedDate();
            this.createdAt = entity.getCreatedAt();
        }
    }

    public static PriceHistoryResponse fromEntity(PriceHistory entity) {
        return new PriceHistoryResponse(entity);
    }

    // Getters and Setters

    public Integer getPriceId() {
        return priceId;
    }

    public void setPriceId(Integer priceId) {
        this.priceId = priceId;
    }

    public Integer getCropId() {
        return cropId;
    }

    public void setCropId(Integer cropId) {
        this.cropId = cropId;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public String getCropCategory() {
        return cropCategory;
    }

    public void setCropCategory(String cropCategory) {
        this.cropCategory = cropCategory;
    }

    public PriceSourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(PriceSourceType sourceType) {
        this.sourceType = sourceType;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public Integer getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(Integer farmerId) {
        this.farmerId = farmerId;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public Integer getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Integer buyerId) {
        this.buyerId = buyerId;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
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

    public BigDecimal getEffectivePrice() {
        return effectivePrice;
    }

    public void setEffectivePrice(BigDecimal effectivePrice) {
        this.effectivePrice = effectivePrice;
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
}
