package com.agriconnect.dto;

import com.agriconnect.entity.Crop;
import com.agriconnect.entity.CropCategory;
import com.agriconnect.entity.CropSeason;

import java.time.LocalDateTime;

/**
 * Safe response DTO for agricultural crop catalog.
 */
public class CropResponse {

    private Integer cropId;
    private String cropName;
    private CropCategory category;
    private CropSeason season;
    private String description;
    private LocalDateTime createdAt;

    public CropResponse() {
    }

    public CropResponse(Crop crop) {
        if (crop != null) {
            this.cropId = crop.getCropId();
            this.cropName = crop.getCropName();
            this.category = crop.getCategory();
            this.season = crop.getSeason();
            this.description = crop.getDescription();
            this.createdAt = crop.getCreatedAt();
        }
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

    public CropCategory getCategory() {
        return category;
    }

    public void setCategory(CropCategory category) {
        this.category = category;
    }

    public CropSeason getSeason() {
        return season;
    }

    public void setSeason(CropSeason season) {
        this.season = season;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
