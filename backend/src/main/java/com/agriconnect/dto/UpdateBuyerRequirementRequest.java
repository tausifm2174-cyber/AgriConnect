package com.agriconnect.dto;

import com.agriconnect.entity.QualityGrade;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request payload for modifying an existing buyer requirement.
 */
public class UpdateBuyerRequirementRequest {

    @NotNull(message = "Crop ID is required.")
    private Integer cropId;

    @NotNull(message = "Required quantity is required.")
    @Positive(message = "Required quantity must be greater than 0 kg.")
    private BigDecimal requiredQuantity;

    @NotNull(message = "Maximum price per kg is required.")
    @Positive(message = "Maximum price per kg must be greater than 0.")
    private BigDecimal maxPricePerKg;

    @NotNull(message = "Minimum quality grade is required (A, B, or C).")
    private QualityGrade minQualityGrade;

    @NotBlank(message = "Preferred location is required.")
    @Size(max = 150, message = "Preferred location cannot exceed 150 characters.")
    private String preferredLocation;

    @NotNull(message = "Required-by date is required.")
    private LocalDate requiredByDate;

    public UpdateBuyerRequirementRequest() {
    }

    public UpdateBuyerRequirementRequest(Integer cropId, BigDecimal requiredQuantity, BigDecimal maxPricePerKg,
                                         QualityGrade minQualityGrade, String preferredLocation, LocalDate requiredByDate) {
        this.cropId = cropId;
        this.requiredQuantity = requiredQuantity;
        this.maxPricePerKg = maxPricePerKg;
        this.minQualityGrade = minQualityGrade;
        this.preferredLocation = preferredLocation;
        this.requiredByDate = requiredByDate;
    }

    public Integer getCropId() {
        return cropId;
    }

    public void setCropId(Integer cropId) {
        this.cropId = cropId;
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
}
