package com.agriconnect.dto;

import com.agriconnect.entity.BuyerRequirement;
import com.agriconnect.entity.QualityGrade;
import com.agriconnect.entity.RequirementStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Standard response DTO for buyer requirements.
 */
public class BuyerRequirementResponse {

    private Integer requirementId;
    private Integer buyerId;
    private String buyerName;
    private Integer cropId;
    private String cropName;
    private String cropCategory;
    private BigDecimal requiredQuantity;
    private BigDecimal maxPricePerKg;
    private QualityGrade minQualityGrade;
    private String preferredLocation;
    private LocalDate requiredByDate;
    private RequirementStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BuyerRequirementResponse() {
    }

    public BuyerRequirementResponse(BuyerRequirement requirement) {
        this.requirementId = requirement.getRequirementId();
        if (requirement.getBuyer() != null) {
            this.buyerId = requirement.getBuyer().getUserId();
            this.buyerName = requirement.getBuyer().getFullName();
        }
        if (requirement.getCrop() != null) {
            this.cropId = requirement.getCrop().getCropId();
            this.cropName = requirement.getCrop().getCropName();
            this.cropCategory = requirement.getCrop().getCategory() != null ? requirement.getCrop().getCategory().name() : null;
        }
        this.requiredQuantity = requirement.getRequiredQuantity();
        this.maxPricePerKg = requirement.getMaxPricePerKg();
        this.minQualityGrade = requirement.getMinQualityGrade();
        this.preferredLocation = requirement.getPreferredLocation();
        this.requiredByDate = requirement.getRequiredByDate();
        this.status = requirement.getStatus();
        this.createdAt = requirement.getCreatedAt();
        this.updatedAt = requirement.getUpdatedAt();
    }

    public Integer getRequirementId() {
        return requirementId;
    }

    public void setRequirementId(Integer requirementId) {
        this.requirementId = requirementId;
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

    public BigDecimal getRequiredQuantity() {
        return requiredQuantity;
    }

    public void setRequiredQuantity(BigDecimal requiredQuantity) {
        this.requiredQuantity = requiredQuantity;
    }

    public BigDecimal getMaxPricePerKg() {
        return maxPricePerKg;
    }

    public void setMaxPricePerKg(BigDecimal maxPricePerKg) {
        this.maxPricePerKg = maxPricePerKg;
    }

    public QualityGrade getMinQualityGrade() {
        return minQualityGrade;
    }

    public void setMinQualityGrade(QualityGrade minQualityGrade) {
        this.minQualityGrade = minQualityGrade;
    }

    public String getPreferredLocation() {
        return preferredLocation;
    }

    public void setPreferredLocation(String preferredLocation) {
        this.preferredLocation = preferredLocation;
    }

    public LocalDate getRequiredByDate() {
        return requiredByDate;
    }

    public void setRequiredByDate(LocalDate requiredByDate) {
        this.requiredByDate = requiredByDate;
    }

    public RequirementStatus getStatus() {
        return status;
    }

    public void setStatus(RequirementStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
