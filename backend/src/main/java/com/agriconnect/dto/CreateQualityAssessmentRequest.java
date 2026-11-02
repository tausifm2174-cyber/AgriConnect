package com.agriconnect.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request DTO for creating an official quality assessment by an authorized Admin.
 * Score, grade, admin ID, and verification status are strictly calculated and assigned server-side.
 */
public class CreateQualityAssessmentRequest {

    @NotNull(message = "Harvest ID is required")
    private Integer harvestId;

    @NotNull(message = "Freshness rating is required")
    @Min(value = 1, message = "Freshness must be between 1 and 10")
    @Max(value = 10, message = "Freshness must be between 1 and 10")
    private Integer freshness;

    @NotNull(message = "Appearance rating is required")
    @Min(value = 1, message = "Appearance must be between 1 and 10")
    @Max(value = 10, message = "Appearance must be between 1 and 10")
    private Integer appearance;

    @NotNull(message = "Size rating is required")
    @Min(value = 1, message = "Size must be between 1 and 10")
    @Max(value = 10, message = "Size must be between 1 and 10")
    private Integer size;

    @NotNull(message = "Color rating is required")
    @Min(value = 1, message = "Color must be between 1 and 10")
    @Max(value = 10, message = "Color must be between 1 and 10")
    private Integer color;

    @NotNull(message = "Ripeness rating is required")
    @Min(value = 1, message = "Ripeness must be between 1 and 10")
    @Max(value = 10, message = "Ripeness must be between 1 and 10")
    private Integer ripeness;

    @NotNull(message = "Damage percentage is required")
    @DecimalMin(value = "0.00", message = "Damage percentage cannot be negative")
    @DecimalMax(value = "100.00", message = "Damage percentage cannot exceed 100%")
    private BigDecimal damagePercentage;

    @Size(max = 255, message = "Inspector notes cannot exceed 255 characters")
    private String inspectorNotes;

    public CreateQualityAssessmentRequest() {
    }

    public CreateQualityAssessmentRequest(Integer harvestId, Integer freshness, Integer appearance,
                                          Integer size, Integer color, Integer ripeness,
                                          BigDecimal damagePercentage, String inspectorNotes) {
        this.harvestId = harvestId;
        this.freshness = freshness;
        this.appearance = appearance;
        this.size = size;
        this.color = color;
        this.ripeness = ripeness;
        this.damagePercentage = damagePercentage;
        this.inspectorNotes = inspectorNotes;
    }

    public Integer getHarvestId() {
        return harvestId;
    }

    public void setHarvestId(Integer harvestId) {
        this.harvestId = harvestId;
    }

    public Integer getFreshness() {
        return freshness;
    }

    public void setFreshness(Integer freshness) {
        this.freshness = freshness;
    }

    public Integer getAppearance() {
        return appearance;
    }

    public void setAppearance(Integer appearance) {
        this.appearance = appearance;
    }

    public Integer getSize() {
        return size;
    }

    public void setSize(Integer size) {
        this.size = size;
    }

    public Integer getColor() {
        return color;
    }

    public void setColor(Integer color) {
        this.color = color;
    }

    public Integer getRipeness() {
        return ripeness;
    }

    public void setRipeness(Integer ripeness) {
        this.ripeness = ripeness;
    }

    public BigDecimal getDamagePercentage() {
        return damagePercentage;
    }

    public void setDamagePercentage(BigDecimal damagePercentage) {
        this.damagePercentage = damagePercentage;
    }

    public String getInspectorNotes() {
        return inspectorNotes;
    }

    public void setInspectorNotes(String inspectorNotes) {
        this.inspectorNotes = inspectorNotes;
    }
}
