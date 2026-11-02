package com.agriconnect.dto;

import com.agriconnect.entity.QualityGrade;
import com.agriconnect.entity.VerificationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO representing an eligible matched farmer harvest lot for a buyer requirement.
 * Includes harvest inventory details, verified quality assessment metrics,
 * transparent score component breakdown, and total match score.
 */
public class MatchedHarvestDto {

    private Integer harvestId;
    private Integer cropId;
    private String cropName;
    private Integer farmerId;
    private String farmerName;
    private BigDecimal availableQuantity;
    private BigDecimal pricePerKg;
    private LocalDate harvestDate;
    private String location;

    // Verified Quality Details (from Phase 5 Quality Assessment)
    private QualityGrade qualityGrade;
    private BigDecimal qualityScore;
    private VerificationStatus qualityVerificationStatus;
    private Integer freshness;
    private Integer appearance;
    private Integer size;
    private Integer color;
    private Integer ripeness;
    private BigDecimal damagePercentage;

    // Calculated Match Scoring (0.00 - 100.00 scale)
    private Double matchScore;
    private Double priceScore;
    private Double qualityScoreComponent;
    private Double locationScore;
    private Double quantityScore;
    private boolean locationMatch;

    public MatchedHarvestDto() {
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

    public BigDecimal getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(BigDecimal availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public BigDecimal getPricePerKg() {
        return pricePerKg;
    }

    public void setPricePerKg(BigDecimal pricePerKg) {
        this.pricePerKg = pricePerKg;
    }

    public LocalDate getHarvestDate() {
        return harvestDate;
    }

    public void setHarvestDate(LocalDate harvestDate) {
        this.harvestDate = harvestDate;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
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

    public Double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(Double matchScore) {
        this.matchScore = matchScore;
    }

    public Double getPriceScore() {
        return priceScore;
    }

    public void setPriceScore(Double priceScore) {
        this.priceScore = priceScore;
    }

    public Double getQualityScoreComponent() {
        return qualityScoreComponent;
    }

    public void setQualityScoreComponent(Double qualityScoreComponent) {
        this.qualityScoreComponent = qualityScoreComponent;
    }

    public Double getLocationScore() {
        return locationScore;
    }

    public void setLocationScore(Double locationScore) {
        this.locationScore = locationScore;
    }

    public Double getQuantityScore() {
        return quantityScore;
    }

    public void setQuantityScore(Double quantityScore) {
        this.quantityScore = quantityScore;
    }

    public boolean isLocationMatch() {
        return locationMatch;
    }

    public void setLocationMatch(boolean locationMatch) {
        this.locationMatch = locationMatch;
    }
}
