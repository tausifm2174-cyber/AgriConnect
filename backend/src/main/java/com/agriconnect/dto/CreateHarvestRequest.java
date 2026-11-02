package com.agriconnect.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Payload for adding a new harvest lot by authenticated farmer.
 * Note: farmerId is NEVER accepted from client; it is securely derived from JWT.
 */
public class CreateHarvestRequest {

    @NotNull(message = "Crop ID is required")
    private Integer cropId;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.01", message = "Quantity must be greater than 0")
    @Digits(integer = 8, fraction = 2, message = "Quantity must have at most 8 integer digits and 2 decimal places")
    private BigDecimal quantity;

    @NotNull(message = "Price per kg is required")
    @DecimalMin(value = "0.01", message = "Price per kg must be greater than 0")
    @Digits(integer = 6, fraction = 2, message = "Price must have at most 6 integer digits and 2 decimal places")
    private BigDecimal pricePerKg;

    @NotNull(message = "Harvest date is required")
    private LocalDate harvestDate;

    @NotBlank(message = "Harvest location is required")
    @Size(max = 150, message = "Location must not exceed 150 characters")
    private String location;

    public CreateHarvestRequest() {
    }

    public CreateHarvestRequest(Integer cropId, BigDecimal quantity, BigDecimal pricePerKg, LocalDate harvestDate, String location) {
        this.cropId = cropId;
        this.quantity = quantity;
        this.pricePerKg = pricePerKg;
        this.harvestDate = harvestDate;
        this.location = location;
    }

    public Integer getCropId() {
        return cropId;
    }

    public void setCropId(Integer cropId) {
        this.cropId = cropId;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
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
}
