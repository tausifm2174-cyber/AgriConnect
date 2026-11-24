package com.agriconnect.dto;

import com.agriconnect.entity.QualityGrade;
import com.agriconnect.entity.QualityReassessment;
import com.agriconnect.entity.ReassessmentDecision;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class QualityReassessmentResponse {

    private Integer reassessmentId;
    private Integer qualityAssessmentId;
    private Integer harvestId;
    private String cropName;
    private String farmerName;
    private Integer requestedById;
    private String requestedByName;
    private String reason;
    private Integer buyerFeedbackId;
    private Integer freshness;
    private Integer appearance;
    private Integer size;
    private Integer color;
    private Integer ripeness;
    private BigDecimal damagePercentage;
    private BigDecimal recalculatedScore;
    private QualityGrade recalculatedGrade;
    private String inspectionRemarks;
    private BigDecimal previousScore;
    private QualityGrade previousGrade;
    private ReassessmentDecision decision;
    private Integer inspectedById;
    private String inspectedByName;
    private LocalDateTime inspectedAt;

    public QualityReassessmentResponse() {
    }

    public QualityReassessmentResponse(QualityReassessment qr) {
        if (qr != null) {
            this.reassessmentId = qr.getReassessmentId();
            if (qr.getQualityAssessment() != null) {
                this.qualityAssessmentId = qr.getQualityAssessment().getAssessmentId();
            }
            if (qr.getHarvest() != null) {
                this.harvestId = qr.getHarvest().getHarvestId();
                if (qr.getHarvest().getCrop() != null) {
                    this.cropName = qr.getHarvest().getCrop().getCropName();
                }
                if (qr.getHarvest().getFarmer() != null) {
                    this.farmerName = qr.getHarvest().getFarmer().getFullName();
                }
            }
            if (qr.getRequestedBy() != null) {
                this.requestedById = qr.getRequestedBy().getUserId();
                this.requestedByName = qr.getRequestedBy().getFullName();
            }
            this.reason = qr.getReason();
            if (qr.getBuyerFeedback() != null) {
                this.buyerFeedbackId = qr.getBuyerFeedback().getFeedbackId();
            }
            this.freshness = qr.getFreshness();
            this.appearance = qr.getAppearance();
            this.size = qr.getSize();
            this.color = qr.getColor();
            this.ripeness = qr.getRipeness();
            this.damagePercentage = qr.getDamagePercentage();
            this.recalculatedScore = qr.getRecalculatedScore();
            this.recalculatedGrade = qr.getRecalculatedGrade();
            this.inspectionRemarks = qr.getInspectionRemarks();
            this.previousScore = qr.getPreviousScore();
            this.previousGrade = qr.getPreviousGrade();
            this.decision = qr.getDecision();
            if (qr.getInspectedBy() != null) {
                this.inspectedById = qr.getInspectedBy().getUserId();
                this.inspectedByName = qr.getInspectedBy().getFullName();
            }
            this.inspectedAt = qr.getInspectedAt();
        }
    }

    public Integer getReassessmentId() {
        return reassessmentId;
    }

    public void setReassessmentId(Integer reassessmentId) {
        this.reassessmentId = reassessmentId;
    }

    public Integer getQualityAssessmentId() {
        return qualityAssessmentId;
    }

    public void setQualityAssessmentId(Integer qualityAssessmentId) {
        this.qualityAssessmentId = qualityAssessmentId;
    }

    public Integer getHarvestId() {
        return harvestId;
    }

    public void setHarvestId(Integer harvestId) {
        this.harvestId = harvestId;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public Integer getRequestedById() {
        return requestedById;
    }

    public void setRequestedById(Integer requestedById) {
        this.requestedById = requestedById;
    }

    public String getRequestedByName() {
        return requestedByName;
    }

    public void setRequestedByName(String requestedByName) {
        this.requestedByName = requestedByName;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Integer getBuyerFeedbackId() {
        return buyerFeedbackId;
    }

    public void setBuyerFeedbackId(Integer buyerFeedbackId) {
        this.buyerFeedbackId = buyerFeedbackId;
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

    public BigDecimal getRecalculatedScore() {
        return recalculatedScore;
    }

    public void setRecalculatedScore(BigDecimal recalculatedScore) {
        this.recalculatedScore = recalculatedScore;
    }

    public QualityGrade getRecalculatedGrade() {
        return recalculatedGrade;
    }

    public void setRecalculatedGrade(QualityGrade recalculatedGrade) {
        this.recalculatedGrade = recalculatedGrade;
    }

    public String getInspectionRemarks() {
        return inspectionRemarks;
    }

    public void setInspectionRemarks(String inspectionRemarks) {
        this.inspectionRemarks = inspectionRemarks;
    }

    public BigDecimal getPreviousScore() {
        return previousScore;
    }

    public void setPreviousScore(BigDecimal previousScore) {
        this.previousScore = previousScore;
    }

    public QualityGrade getPreviousGrade() {
        return previousGrade;
    }

    public void setPreviousGrade(QualityGrade previousGrade) {
        this.previousGrade = previousGrade;
    }

    public ReassessmentDecision getDecision() {
        return decision;
    }

    public void setDecision(ReassessmentDecision decision) {
        this.decision = decision;
    }

    public Integer getInspectedById() {
        return inspectedById;
    }

    public void setInspectedById(Integer inspectedById) {
        this.inspectedById = inspectedById;
    }

    public String getInspectedByName() {
        return inspectedByName;
    }

    public void setInspectedByName(String inspectedByName) {
        this.inspectedByName = inspectedByName;
    }

    public LocalDateTime getInspectedAt() {
        return inspectedAt;
    }

    public void setInspectedAt(LocalDateTime inspectedAt) {
        this.inspectedAt = inspectedAt;
    }
}
