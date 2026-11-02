package com.agriconnect.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 1:1 specialization profile table for FARMER role.
 * Mapped to the existing 'farmer_profiles' table in MySQL.
 */
@Entity
@Table(name = "farmer_profiles")
public class FarmerProfile {

    @Id
    @Column(name = "farmer_id")
    private Integer farmerId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "farmer_id")
    private User user;

    @Column(name = "farm_location", nullable = false, length = 150)
    private String farmLocation;

    @Column(name = "farm_size_acres", nullable = false, precision = 6, scale = 2)
    private BigDecimal farmSizeAcres;

    @Column(name = "experience_years")
    private Integer experienceYears = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public FarmerProfile() {
    }

    public FarmerProfile(User user, String farmLocation, BigDecimal farmSizeAcres, Integer experienceYears) {
        this.user = user;
        this.farmLocation = farmLocation;
        this.farmSizeAcres = farmSizeAcres;
        this.experienceYears = experienceYears != null ? experienceYears : 0;
    }

    public Integer getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(Integer farmerId) {
        this.farmerId = farmerId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
