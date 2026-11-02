package com.agriconnect.dto;

import com.agriconnect.entity.CropCategory;
import com.agriconnect.entity.CropSeason;
import com.agriconnect.entity.Harvest;
import com.agriconnect.entity.HarvestStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Detailed response representation for a harvest lot.
 */
public class HarvestResponse {

    private Integer harvestId;
    private Integer farmerId;
    private String farmerName;
    private Integer cropId;
    private String cropName;
    private CropCategory cropCategory;
    private CropSeason cropSeason;
    private BigDecimal initialQuantity;
    private BigDecimal availableQuantity;
    private BigDecimal pricePerKg;
    private LocalDate harvestDate;
    private String location;
    private HarvestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public HarvestResponse() {
    }

    public HarvestResponse(Harvest harvest) {
        if (harvest != null) {
            this.harvestId = harvest.getHarvestId();
            if (harvest.getFarmer() != null) {
                this.farmerId = harvest.getFarmer().getUserId();
                this.farmerName = harvest.getFarmer().getFullName();
            }
            if (harvest.getCrop() != null) {
                this.cropId = harvest.getCrop().getCropId();
                this.cropName = harvest.getCrop().getCropName();
                this.cropCategory = harvest.getCrop().getCategory();
                this.cropSeason = harvest.getCrop().getSeason();
            }
            this.initialQuantity = harvest.getInitialQuantity();
            this.availableQuantity = harvest.getAvailableQuantity();
            this.pricePerKg = harvest.getPricePerKg();
            this.harvestDate = harvest.getHarvestDate();
            this.location = harvest.getLocation();
            this.status = harvest.getStatus();
            this.createdAt = harvest.getCreatedAt();
            this.updatedAt = harvest.getUpdatedAt();
        }
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

    public CropSeason getCropSeason() {
        return cropSeason;
    }

    public void setCropSeason(CropSeason cropSeason) {
        this.cropSeason = cropSeason;
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

    public HarvestStatus getStatus() {
        return status;
    }

    public void setStatus(HarvestStatus status) {
        this.status = status;
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
