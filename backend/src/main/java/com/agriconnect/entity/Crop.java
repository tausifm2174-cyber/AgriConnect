package com.agriconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Standard agricultural crop catalog master entity.
 * Mapped to the existing 'crops' table in MySQL.
 */
@Entity
@Table(name = "crops")
public class Crop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "crop_id")
    private Integer cropId;

    @Column(name = "crop_name", nullable = false, unique = true, length = 60)
    private String cropName;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private CropCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "season")
    private CropSeason season = CropSeason.ALL_SEASON;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Crop() {
    }

    public Crop(String cropName, CropCategory category, CropSeason season, String description) {
        this.cropName = cropName;
        this.category = category;
        this.season = season != null ? season : CropSeason.ALL_SEASON;
        this.description = description;
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
}
