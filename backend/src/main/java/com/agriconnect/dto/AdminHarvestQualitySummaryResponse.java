package com.agriconnect.dto;

import com.agriconnect.entity.CropCategory;
import com.agriconnect.entity.Harvest;
import com.agriconnect.entity.HarvestStatus;
import com.agriconnect.entity.QualityAssessment;
import com.agriconnect.entity.QualityGrade;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Summary DTO combining harvest listing information with its current quality assessment status
 * for administrative assessment queues and verification workflows.
 */
public class AdminHarvestQualitySummaryResponse {

    private Integer harvestId;
    private Integer cropId;
    private String cropName;
    private CropCategory cropCategory;
    private Integer farmerId;
    private String farmerName;
    private String farmerPhone;
    private BigDecimal initialQuantity;
    private BigDecimal availableQuantity;
    private BigDecimal pricePerKg;
    private LocalDate harvestDate;
    private String location;
    private HarvestStatus harvestStatus;

    // Quality Assessment Details (if already assessed)
    private boolean hasAssessment;
    private Integer assessmentId;
    private String assessmentStatus; // "NOT_ASSESSED", "PENDING", "VERIFIED", "REJECTED"
    private BigDecimal qualityScore;
    private QualityGrade qualityGrade;
    private LocalDate assessmentDate;

    public AdminHarvestQualitySummaryResponse() {
    }

    public AdminHarvestQualitySummaryResponse(Harvest harvest, QualityAssessment qa) {
        if (harvest != null) {
            this.harvestId = harvest.getHarvestId();
            if (harvest.getCrop() != null) {
                this.cropId = harvest.getCrop().getCropId();
                this.cropName = harvest.getCrop().getCropName();
                this.cropCategory = harvest.getCrop().getCategory();
            }
            if (harvest.getFarmer() != null) {
                this.farmerId = harvest.getFarmer().getUserId();
                this.farmerName = harvest.getFarmer().getFullName();
                this.farmerPhone = harvest.getFarmer().getPhone();
            }
            this.initialQuantity = harvest.getInitialQuantity();
            this.availableQuantity = harvest.getAvailableQuantity();
            this.pricePerKg = harvest.getPricePerKg();
            this.harvestDate = harvest.getHarvestDate();
            this.location = harvest.getLocation();
            this.harvestStatus = harvest.getStatus();
        }

        if (qa != null) {
            this.hasAssessment = true;
            this.assessmentId = qa.getAssessmentId();
            this.assessmentStatus = qa.getVerificationStatus().name();
            this.qualityScore = qa.getQualityScore();
            this.qualityGrade = qa.getQualityGrade();
            this.assessmentDate = qa.getAssessmentDate();
        } else {
            this.hasAssessment = false;
            this.assessmentId = null;
            this.assessmentStatus = "NOT_ASSESSED";
            this.qualityScore = null;
            this.qualityGrade = null;
            this.assessmentDate = null;
        }
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

    public CropCategory getCropCategory() {
        return cropCategory;
    }

    public void setCropCategory(CropCategory cropCategory) {
        this.cropCategory = cropCategory;
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

    public String getFarmerPhone() {
        return farmerPhone;
    }

    public void setFarmerPhone(String farmerPhone) {
        this.farmerPhone = farmerPhone;
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

    public HarvestStatus getHarvestStatus() {
        return harvestStatus;
    }

    public void setHarvestStatus(HarvestStatus harvestStatus) {
        this.harvestStatus = harvestStatus;
    }

    public boolean isHasAssessment() {
        return hasAssessment;
    }

    public void setHasAssessment(boolean hasAssessment) {
        this.hasAssessment = hasAssessment;
    }

    public Integer getAssessmentId() {
        return assessmentId;
    }

    public void setAssessmentId(Integer assessmentId) {
        this.assessmentId = assessmentId;
    }

    public String getAssessmentStatus() {
        return assessmentStatus;
    }

    public void setAssessmentStatus(String assessmentStatus) {
        this.assessmentStatus = assessmentStatus;
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

    public LocalDate getAssessmentDate() {
        return assessmentDate;
    }

    public void setAssessmentDate(LocalDate assessmentDate) {
        this.assessmentDate = assessmentDate;
    }
}
