package com.agriconnect.dto;

import com.agriconnect.entity.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Detailed DTO representation of an Order, containing complete buyer, farmer,
 * crop, pricing, stock, quality certificate, and lifecycle status details.
 */
public class OrderResponse {

    private Integer orderId;

    // Buyer Information
    private Integer buyerId;
    private String buyerName;
    private String buyerEmail;
    private String buyerPhone;
    private String businessName;

    // Farmer Information
    private Integer farmerId;
    private String farmerName;
    private String farmerEmail;
    private String farmerPhone;
    private String farmLocation;

    // Crop and Harvest Details
    private Integer harvestId;
    private Integer cropId;
    private String cropName;
    private String cropCategory;
    private Integer requirementId;

    // Financial & Quantity Contract Terms
    private BigDecimal quantity;
    private BigDecimal agreedPricePerKg;
    private BigDecimal totalAmount;

    // Order Lifecycle Status
    private OrderStatus status;
    private String remarks;
    private String cancellationReason;

    // Verified Quality Snapshot
    private QualityGrade qualityGrade;
    private BigDecimal qualityScore;
    private VerificationStatus qualityVerificationStatus;

    // Audit Timestamps
    private LocalDateTime orderDate;
    private LocalDateTime updatedAt;

    public OrderResponse() {
    }

    public OrderResponse(Order order) {
        if (order != null) {
            this.orderId = order.getOrderId();
            this.quantity = order.getQuantity();
            this.agreedPricePerKg = order.getAgreedPricePerKg();
            this.totalAmount = order.getTotalAmount();
            this.status = order.getOrderStatus();
            this.remarks = order.getRemarks();
            this.cancellationReason = order.getCancellationReason();
            this.orderDate = order.getOrderDate();
            this.updatedAt = order.getUpdatedAt();

            if (order.getBuyer() != null) {
                this.buyerId = order.getBuyer().getUserId();
                this.buyerName = order.getBuyer().getFullName();
                this.buyerEmail = order.getBuyer().getEmail();
                this.buyerPhone = order.getBuyer().getPhone();
            }

            if (order.getRequirement() != null) {
                this.requirementId = order.getRequirement().getRequirementId();
            }

            if (order.getHarvest() != null) {
                Harvest h = order.getHarvest();
                this.harvestId = h.getHarvestId();
                this.farmLocation = h.getLocation();

                if (h.getCrop() != null) {
                    this.cropId = h.getCrop().getCropId();
                    this.cropName = h.getCrop().getCropName();
                    if (h.getCrop().getCategory() != null) {
                        this.cropCategory = h.getCrop().getCategory().name();
                    }
                }

                if (h.getFarmer() != null) {
                    this.farmerId = h.getFarmer().getUserId();
                    this.farmerName = h.getFarmer().getFullName();
                    this.farmerEmail = h.getFarmer().getEmail();
                    this.farmerPhone = h.getFarmer().getPhone();
                }
            }
        }
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
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

    public String getBuyerEmail() {
        return buyerEmail;
    }

    public void setBuyerEmail(String buyerEmail) {
        this.buyerEmail = buyerEmail;
    }

    public String getBuyerPhone() {
        return buyerPhone;
    }

    public void setBuyerPhone(String buyerPhone) {
        this.buyerPhone = buyerPhone;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
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

    public String getFarmerEmail() {
        return farmerEmail;
    }

    public void setFarmerEmail(String farmerEmail) {
        this.farmerEmail = farmerEmail;
    }

    public String getFarmerPhone() {
        return farmerPhone;
    }

    public void setFarmerPhone(String farmerPhone) {
        this.farmerPhone = farmerPhone;
    }

    public String getFarmLocation() {
        return farmLocation;
    }

    public void setFarmLocation(String farmLocation) {
        this.farmLocation = farmLocation;
    }

    public Integer getHarvestId() {
        return harvestId;
    }

    public void setHarvestId(Integer harvestId) {
        this.harvestId = harvestId;
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

    public Integer getRequirementId() {
        return requirementId;
    }

    public void setRequirementId(Integer requirementId) {
        this.requirementId = requirementId;
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

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
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

    public QualityGrade getQualityGrade() {
        return qualityGrade;
    }

    public void setQualityGrade(QualityGrade qualityGrade) {
        this.qualityGrade = qualityGrade;
    }

    public BigDecimal getQualityScore() {
        return qualityScore;
    }

    public void setQualityScore(BigDecimal qualityScore) {
        this.qualityScore = qualityScore;
    }

    public VerificationStatus getQualityVerificationStatus() {
        return qualityVerificationStatus;
    }

    public void setQualityVerificationStatus(VerificationStatus qualityVerificationStatus) {
        this.qualityVerificationStatus = qualityVerificationStatus;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
