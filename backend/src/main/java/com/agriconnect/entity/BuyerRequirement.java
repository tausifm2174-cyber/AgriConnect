package com.agriconnect.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Buyer Requirement entity representing commercial crop purchase demand.
 * Mapped to the existing 'buyer_requirements' table in MySQL.
 */
@Entity
@Table(name = "buyer_requirements")
public class BuyerRequirement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "requirement_id")
    private Integer requirementId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "crop_id", nullable = false)
    private Crop crop;

    @Column(name = "required_quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal requiredQuantity;

    @Column(name = "max_price_per_kg", nullable = false, precision = 8, scale = 2)
    private BigDecimal maxPricePerKg;

    @Enumerated(EnumType.STRING)
    @Column(name = "min_quality_grade", nullable = false)
    private QualityGrade minQualityGrade;

    @Column(name = "preferred_location", length = 150)
    private String preferredLocation;

    @Column(name = "required_by_date")
    private LocalDate requiredByDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private RequirementStatus status = RequirementStatus.OPEN;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public BuyerRequirement() {
    }

    public BuyerRequirement(User buyer, Crop crop, BigDecimal requiredQuantity, BigDecimal maxPricePerKg,
                            QualityGrade minQualityGrade, String preferredLocation, LocalDate requiredByDate,
                            RequirementStatus status) {
        this.buyer = buyer;
        this.crop = crop;
        this.requiredQuantity = requiredQuantity;
        this.maxPricePerKg = maxPricePerKg;
        this.minQualityGrade = minQualityGrade;
        this.preferredLocation = preferredLocation;
        this.requiredByDate = requiredByDate;
        this.status = status != null ? status : RequirementStatus.OPEN;
    }

    public Integer getRequirementId() {
        return requirementId;
    }

    public void setRequirementId(Integer requirementId) {
        this.requirementId = requirementId;
    }

    public User getBuyer() {
        return buyer;
    }

    public void setBuyer(User buyer) {
        this.buyer = buyer;
    }

    public Crop getCrop() {
        return crop;
    }

    public void setCrop(Crop crop) {
        this.crop = crop;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
