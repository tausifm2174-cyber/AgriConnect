package com.agriconnect.dto;

import com.agriconnect.entity.ReassessmentDecision;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public class PerformReassessmentRequest {

    @NotNull(message = "Freshness rating is required.")
    @Min(value = 1, message = "Freshness must be between 1 and 10.")
    @Max(value = 10, message = "Freshness must be between 1 and 10.")
    private Integer freshness;

    @NotNull(message = "Appearance rating is required.")
    @Min(value = 1, message = "Appearance must be between 1 and 10.")
    @Max(value = 10, message = "Appearance must be between 1 and 10.")
    private Integer appearance;

    @NotNull(message = "Size rating is required.")
    @Min(value = 1, message = "Size must be between 1 and 10.")
    @Max(value = 10, message = "Size must be between 1 and 10.")
    private Integer size;

    @NotNull(message = "Color rating is required.")
    @Min(value = 1, message = "Color must be between 1 and 10.")
    @Max(value = 10, message = "Color must be between 1 and 10.")
    private Integer color;

    @NotNull(message = "Ripeness rating is required.")
    @Min(value = 1, message = "Ripeness must be between 1 and 10.")
    @Max(value = 10, message = "Ripeness must be between 1 and 10.")
    private Integer ripeness;

    @NotNull(message = "Damage percentage is required.")
    @DecimalMin(value = "0.00", message = "Damage percentage cannot be negative.")
    @DecimalMax(value = "100.00", message = "Damage percentage cannot exceed 100.00%.")
    private BigDecimal damagePercentage;

    @NotNull(message = "Reassessment decision (RE_VERIFIED or REJECTED) is required.")
    private ReassessmentDecision decision;

    @NotBlank(message = "Reassessment reason is required.")
    @Size(max = 255, message = "Reason cannot exceed 255 characters.")
    private String reason;

    @NotBlank(message = "Inspection remarks are required.")
    @Size(max = 500, message = "Remarks cannot exceed 500 characters.")
    private String inspectionRemarks;

    private Integer buyerFeedbackId;

    public PerformReassessmentRequest() {
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

    public ReassessmentDecision getDecision() {
        return decision;
    }

    public void setDecision(ReassessmentDecision decision) {
        this.decision = decision;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getInspectionRemarks() {
        return inspectionRemarks;
    }

    public void setInspectionRemarks(String inspectionRemarks) {
        this.inspectionRemarks = inspectionRemarks;
    }

    public Integer getBuyerFeedbackId() {
        return buyerFeedbackId;
    }

    public void setBuyerFeedbackId(Integer buyerFeedbackId) {
        this.buyerFeedbackId = buyerFeedbackId;
    }
}
