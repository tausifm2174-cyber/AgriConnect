package com.agriconnect.dto;

import com.agriconnect.entity.CropCategory;
import com.agriconnect.entity.QualityAssessment;
import com.agriconnect.entity.QualityGrade;
import com.agriconnect.entity.VerificationStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Detailed DTO representation of an official agricultural quality assessment.
 */
public class QualityAssessmentResponse {

    private Integer assessmentId;
    private Integer harvestId;
    private Integer farmerId;
    private String farmerName;
    private Integer cropId;
    private String cropName;
    private CropCategory cropCategory;
    private LocalDate harvestDate;
    private String harvestLocation;
    private BigDecimal initialQuantity;
    private BigDecimal availableQuantity;

    private Integer adminId;
    private String adminName;

    private Integer freshness;
    private Integer appearance;
    private Integer size;
    private Integer color;
    private Integer ripeness;
    private BigDecimal damagePercentage;
    private BigDecimal qualityScore;
    private QualityGrade qualityGrade;
    private VerificationStatus verificationStatus;
    private LocalDate assessmentDate;
    private String inspectorNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public QualityAssessmentResponse() {
    }

    public QualityAssessmentResponse(QualityAssessment qa) {
        if (qa != null) {
            this.assessmentId = qa.getAssessmentId();
            if (qa.getHarvest() != null) {
                this.harvestId = qa.getHarvest().getHarvestId();
                this.harvestDate = qa.getHarvest().getHarvestDate();
                this.harvestLocation = qa.getHarvest().getLocation();
                this.initialQuantity = qa.getHarvest().getInitialQuantity();
                this.availableQuantity = qa.getHarvest().getAvailableQuantity();

                if (qa.getHarvest().getFarmer() != null) {
                    this.farmerId = qa.getHarvest().getFarmer().getUserId();
                    this.farmerName = qa.getHarvest().getFarmer().getFullName();
                }

                if (qa.getHarvest().getCrop() != null) {
                    this.cropId = qa.getHarvest().getCrop().getCropId();
                    this.cropName = qa.getHarvest().getCrop().getCropName();
                    this.cropCategory = qa.getHarvest().getCrop().getCategory();
                }
            }

            if (qa.getAdmin() != null) {
                this.adminId = qa.getAdmin().getUserId();
                this.adminName = qa.getAdmin().getFullName();
            }

            this.freshness = qa.getFreshness();
            this.appearance = qa.getAppearance();
            this.size = qa.getSize();
            this.color = qa.getColor();
            this.ripeness = qa.getRipeness();
            this.damagePercentage = qa.getDamagePercentage();
            this.qualityScore = qa.getQualityScore();
            this.qualityGrade = qa.getQualityGrade();
            this.verificationStatus = qa.getVerificationStatus();
            this.assessmentDate = qa.getAssessmentDate();
            this.inspectorNotes = qa.getInspectorNotes();
            this.createdAt = qa.getCreatedAt();
            this.updatedAt = qa.getUpdatedAt();
        }
    }

    public Integer getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(Integer assessmentId) {
        this.assessmentId = assessmentId;
    }

    public Integer getHarvestId() {
        return harvestId;
    }

    public void setHarvestId(Integer harvestId) {
        this.harvestId = harvestId;
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

    public CropCategory getCropCategory() {
        return cropCategory;
    }

    public void setCropCategory(CropCategory cropCategory) {
        this.cropCategory = cropCategory;
    }

    public LocalDate getHarvestDate() {
        return harvestDate;
    }

    public void setHarvestDate(LocalDate harvestDate) {
        this.harvestDate = harvestDate;
    }

    public String getHarvestLocation() {
        return harvestLocation;
    }

    public void setHarvestLocation(String harvestLocation) {
        this.harvestLocation = harvestLocation;
    }

    public BigDecimal getInitialQuantity() {
        return initialQuantity;
    }

    public void setInitialQuantity(BigDecimal initialQuantity) {
        this.initialQuantity = initialQuantity;
    }

    public BigDecimal getAvailableQuantity() {
        return availableQuantity;
    }

    public void setAvailableQuantity(BigDecimal availableQuantity) {
        this.availableQuantity = availableQuantity;
    }

    public Integer getAdminId() {
        return adminId;
    }

    public void setAdminId(Integer adminId) {
        this.adminId = adminId;
    }

    public String getAdminName() {
        return adminName;
    }

    public void setAdminName(String adminName) {
        this.adminName = adminName;
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
