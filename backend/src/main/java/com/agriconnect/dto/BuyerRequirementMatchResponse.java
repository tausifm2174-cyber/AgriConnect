package com.agriconnect.dto;

import com.agriconnect.entity.BuyerRequirement;
import com.agriconnect.entity.QualityGrade;
import com.agriconnect.entity.RequirementStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Composite response DTO returning matching engine results for a specific buyer requirement.
 * Encapsulates buyer demand criteria, total matched harvest count, and ranked harvest matches.
 */
public class BuyerRequirementMatchResponse {

    private Integer requirementId;
    private Integer cropId;
    private String cropName;
    private BigDecimal requiredQuantity;
    private BigDecimal maximumPricePerKg;
    private QualityGrade minimumQualityGrade;
    private String preferredLocation;
    private LocalDate requiredByDate;
    private RequirementStatus status;
    private int totalMatches;
    private List<MatchedHarvestDto> matches = new ArrayList<>();

    public BuyerRequirementMatchResponse() {
    }

    public BuyerRequirementMatchResponse(BuyerRequirement requirement, List<MatchedHarvestDto> matches) {
        if (requirement != null) {
            this.requirementId = requirement.getRequirementId();
            if (requirement.getCrop() != null) {
                this.cropId = requirement.getCrop().getCropId();
                this.cropName = requirement.getCrop().getCropName();
            }
            this.requiredQuantity = requirement.getRequiredQuantity();
            this.maximumPricePerKg = requirement.getMaxPricePerKg();
            this.minimumQualityGrade = requirement.getMinQualityGrade();
            this.preferredLocation = requirement.getPreferredLocation();
            this.requiredByDate = requirement.getRequiredByDate();
            this.status = requirement.getStatus();
        }
        this.matches = matches != null ? matches : new ArrayList<>();
        this.totalMatches = this.matches.size();
    }

    public Integer getRequirementId() {
        return requirementId;
    }

    public void setRequirementId(Integer requirementId) {
        this.requirementId = requirementId;
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

    public BigDecimal getRequiredQuantity() {
        return requiredQuantity;
    }

    public void setRequiredQuantity(BigDecimal requiredQuantity) {
        this.requiredQuantity = requiredQuantity;
    }

    public BigDecimal getMaximumPricePerKg() {
        return maximumPricePerKg;
    }

    public void setMaximumPricePerKg(BigDecimal maximumPricePerKg) {
        this.maximumPricePerKg = maximumPricePerKg;
    }

    public QualityGrade getMinimumQualityGrade() {
        return minimumQualityGrade;
    }

    public void setMinimumQualityGrade(QualityGrade minimumQualityGrade) {
        this.minimumQualityGrade = minimumQualityGrade;
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

    public int getTotalMatches() {
        return totalMatches;
    }

    public void setTotalMatches(int totalMatches) {
        this.totalMatches = totalMatches;
    }

    public List<MatchedHarvestDto> getMatches() {
        return matches;
    }

    public void setMatches(List<MatchedHarvestDto> matches) {
        this.matches = matches != null ? matches : new ArrayList<>();
        this.totalMatches = this.matches.size();
    }
}
