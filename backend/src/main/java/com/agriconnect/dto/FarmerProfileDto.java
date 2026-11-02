package com.agriconnect.dto;

import java.math.BigDecimal;

/**
 * Safe summary DTO for FarmerProfile.
 */
public class FarmerProfileDto {

    private Integer farmerId;
    private String farmLocation;
    private BigDecimal farmSizeAcres;
    private Integer experienceYears;

    public FarmerProfileDto() {
    }

    public FarmerProfileDto(Integer farmerId, String farmLocation, BigDecimal farmSizeAcres, Integer experienceYears) {
        this.farmerId = farmerId;
        this.farmLocation = farmLocation;
        this.farmSizeAcres = farmSizeAcres;
        this.experienceYears = experienceYears;
    }

    public Integer getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(Integer farmerId) {
        this.farmerId = farmerId;
    }

    public String getFarmLocation() {
        return farmLocation;
    }

    public void setFarmLocation(String farmLocation) {
        this.farmLocation = farmLocation;
    }

    public BigDecimal getFarmSizeAcres() {
        return farmSizeAcres;
    }

    public void setFarmSizeAcres(BigDecimal farmSizeAcres) {
        this.farmSizeAcres = farmSizeAcres;
    }

    public Integer getExperienceYears() {
        return experienceYears;
    }

    public void setExperienceYears(Integer experienceYears) {
        this.experienceYears = experienceYears;
    }
}
