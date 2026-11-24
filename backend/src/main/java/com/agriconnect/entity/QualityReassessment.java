package com.agriconnect.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity recording an immutable historical entry of administrative quality reinspection.
 * Captures previous state, physical parameter re-evaluations, recalculated scores, and administrative decisions.
 */
@Entity
@Table(name = "quality_reassessments")
public class QualityReassessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reassessment_id")
    private Integer reassessmentId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quality_assessment_id", nullable = false)
    private QualityAssessment qualityAssessment;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "harvest_id", nullable = false)
    private Harvest harvest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requested_by", nullable = false)
    private User requestedBy;

    @Column(name = "reason", nullable = false, length = 255)
    private String reason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_feedback_id")
    private BuyerQualityFeedback buyerFeedback;

    @Column(name = "freshness", nullable = false)
    private Integer freshness;

    @Column(name = "appearance", nullable = false)
    private Integer appearance;

    @Column(name = "size", nullable = false)
    private Integer size;

    @Column(name = "color", nullable = false)
    private Integer color;

    @Column(name = "ripeness", nullable = false)
    private Integer ripeness;

    @Column(name = "damage_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal damagePercentage;

    @Column(name = "recalculated_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal recalculatedScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "recalculated_grade", nullable = false)
    private QualityGrade recalculatedGrade;

    @Column(name = "inspection_remarks", nullable = false, length = 500)
    private String inspectionRemarks;

    @Column(name = "previous_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal previousScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_grade", nullable = false)
    private QualityGrade previousGrade;

    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false)
    private ReassessmentDecision decision;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inspected_by", nullable = false)
    private User inspectedBy;

    @Column(name = "inspected_at")
    private LocalDateTime inspectedAt = LocalDateTime.now();

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public QualityReassessment() {
    }

    public QualityReassessment(QualityAssessment qualityAssessment, Harvest harvest, User requestedBy,
                               String reason, BuyerQualityFeedback buyerFeedback, Integer freshness,
                               Integer appearance, Integer size, Integer color, Integer ripeness,
                               BigDecimal damagePercentage, BigDecimal recalculatedScore,
                               QualityGrade recalculatedGrade, String inspectionRemarks,
                               BigDecimal previousScore, QualityGrade previousGrade,
                               ReassessmentDecision decision, User inspectedBy) {
        this.qualityAssessment = qualityAssessment;
        this.harvest = harvest;
        this.requestedBy = requestedBy;
        this.reason = reason;
        this.buyerFeedback = buyerFeedback;
        this.freshness = freshness;
        this.appearance = appearance;
        this.size = size;
        this.color = color;
        this.ripeness = ripeness;
        this.damagePercentage = damagePercentage;
        this.recalculatedScore = recalculatedScore;
        this.recalculatedGrade = recalculatedGrade;
        this.inspectionRemarks = inspectionRemarks;
        this.previousScore = previousScore;
        this.previousGrade = previousGrade;
        this.decision = decision;
        this.inspectedBy = inspectedBy;
        this.inspectedAt = LocalDateTime.now();
    }

    public Integer getReassessmentId() {
        return reassessmentId;
    }

    public void setReassessmentId(Integer reassessmentId) {
        this.reassessmentId = reassessmentId;
    }

    public QualityAssessment getQualityAssessment() {
        return qualityAssessment;
    }

    public void setQualityAssessment(QualityAssessment qualityAssessment) {
        this.qualityAssessment = qualityAssessment;
    }

    public Harvest getHarvest() {
        return harvest;
    }

    public void setHarvest(Harvest harvest) {
        this.harvest = harvest;
    }

    public User getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(User requestedBy) {
        this.requestedBy = requestedBy;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public BuyerQualityFeedback getBuyerFeedback() {
        return buyerFeedback;
    }

    public void setBuyerFeedback(BuyerQualityFeedback buyerFeedback) {
        this.buyerFeedback = buyerFeedback;
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

    public User getInspectedBy() {
        return inspectedBy;
    }

    public void setInspectedBy(User inspectedBy) {
        this.inspectedBy = inspectedBy;
    }

    public LocalDateTime getInspectedAt() {
        return inspectedAt;
    }

    public void setInspectedAt(LocalDateTime inspectedAt) {
        this.inspectedAt = inspectedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
