package com.agriconnect.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Detailed profile DTO for authenticated farmer containing user details,
 * farm specifications, and summary harvest statistics.
 */
public class FarmerProfileDetailResponse {

    private Integer farmerId;
    private String fullName;
    private String email;
    private String phone;
    private String farmLocation;
    private BigDecimal farmSizeAcres;
    private Integer experienceYears;
    private long totalHarvestsCount;
    private long activeHarvestsCount;
    private LocalDateTime memberSince;

    public FarmerProfileDetailResponse() {
    }

    public FarmerProfileDetailResponse(Integer farmerId, String fullName, String email, String phone,
                                       String farmLocation, BigDecimal farmSizeAcres, Integer experienceYears,
                                       long totalHarvestsCount, long activeHarvestsCount, LocalDateTime memberSince) {
        this.farmerId = farmerId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.farmLocation = farmLocation;
        this.farmSizeAcres = farmSizeAcres;
        this.experienceYears = experienceYears;
        this.totalHarvestsCount = totalHarvestsCount;
        this.activeHarvestsCount = activeHarvestsCount;
        this.memberSince = memberSince;
    }

    public Integer getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(Integer farmerId) {
        this.farmerId = farmerId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
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

    public long getTotalHarvestsCount() {
        return totalHarvestsCount;
    }

    public void setTotalHarvestsCount(long totalHarvestsCount) {
        this.totalHarvestsCount = totalHarvestsCount;
    }

    public long getActiveHarvestsCount() {
        return activeHarvestsCount;
    }

    public void setActiveHarvestsCount(long activeHarvestsCount) {
        this.activeHarvestsCount = activeHarvestsCount;
    }

    public LocalDateTime getMemberSince() {
        return memberSince;
    }

    public void setMemberSince(LocalDateTime memberSince) {
        this.memberSince = memberSince;
    }
}
