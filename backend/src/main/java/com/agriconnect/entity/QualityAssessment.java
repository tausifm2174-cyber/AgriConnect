package com.agriconnect.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Quality Assessment entity representing verified evaluation of harvest lots.
 * Mapped to the existing 'quality_assessments' table in MySQL.
 */
@Entity
@Table(name = "quality_assessments")
public class QualityAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assessment_id")
    private Integer assessmentId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "harvest_id", nullable = false, unique = true)
    private Harvest harvest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "admin_id", nullable = false)
    private User admin;

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

    @Column(name = "quality_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal qualityScore;

    @Enumerated(EnumType.STRING)
    @Column(name = "quality_grade", nullable = false)
    private QualityGrade qualityGrade;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;

    @Column(name = "assessment_date", nullable = false)
    private LocalDate assessmentDate;

    @Column(name = "inspector_notes", length = 255)
    private String inspectorNotes;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public QualityAssessment() {
    }

    public QualityAssessment(Harvest harvest, User admin, Integer freshness, Integer appearance,
                             Integer size, Integer color, Integer ripeness, BigDecimal damagePercentage,
                             BigDecimal qualityScore, QualityGrade qualityGrade,
                             VerificationStatus verificationStatus, LocalDate assessmentDate,
                             String inspectorNotes) {
        this.harvest = harvest;
        this.admin = admin;
        this.freshness = freshness;
        this.appearance = appearance;
        this.size = size;
        this.color = color;
        this.ripeness = ripeness;
        this.damagePercentage = damagePercentage;
        this.qualityScore = qualityScore;
        this.qualityGrade = qualityGrade;
        this.verificationStatus = verificationStatus != null ? verificationStatus : VerificationStatus.PENDING;
        this.assessmentDate = assessmentDate != null ? assessmentDate : LocalDate.now();
        this.inspectorNotes = inspectorNotes;
    }

    public Integer getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(Integer assessmentId) {
        this.assessmentId = assessmentId;
    }

    public Harvest getHarvest() {
        return harvest;
    }

    public void setHarvest(Harvest harvest) {
        this.harvest = harvest;
    }

    public User getAdmin() {
        return admin;
    }

    public void setAdmin(User admin) {
        this.admin = admin;
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

    public BigDecimal getQualityScore() {
        return qualityScore;
    }

    public void setQualityScore(BigDecimal qualityScore) {
        this.qualityScore = qualityScore;
    }

    public QualityGrade getQualityGrade() {
        return qualityGrade;
    }

    public void setQualityGrade(QualityGrade qualityGrade) {
        this.qualityGrade = qualityGrade;
    }

    public VerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public void setVerificationStatus(VerificationStatus verificationStatus) {
        this.verificationStatus = verificationStatus;
    }

    public LocalDate getAssessmentDate() {
        return assessmentDate;
    }

    public void setAssessmentDate(LocalDate assessmentDate) {
        this.assessmentDate = assessmentDate;
    }

    public String getInspectorNotes() {
        return inspectorNotes;
    }

    public void setInspectorNotes(String inspectorNotes) {
        this.inspectorNotes = inspectorNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
