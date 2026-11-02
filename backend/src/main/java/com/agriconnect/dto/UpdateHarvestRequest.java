package com.agriconnect.dto;

import com.agriconnect.entity.HarvestStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Payload for updating an existing harvest lot owned by the authenticated farmer.
 */
public class UpdateHarvestRequest {

    @DecimalMin(value = "0.00", message = "Available quantity cannot be negative")
    @Digits(integer = 8, fraction = 2, message = "Available quantity must have at most 8 integer digits and 2 decimal places")
    private BigDecimal availableQuantity;

    @DecimalMin(value = "0.01", message = "Price per kg must be greater than 0")
    @Digits(integer = 6, fraction = 2, message = "Price must have at most 6 integer digits and 2 decimal places")
    private BigDecimal pricePerKg;

    private LocalDate harvestDate;

    @Size(max = 150, message = "Location must not exceed 150 characters")
    private String location;

    private HarvestStatus status;

    public UpdateHarvestRequest() {
    }

    public UpdateHarvestRequest(BigDecimal availableQuantity, BigDecimal pricePerKg, LocalDate harvestDate, String location, HarvestStatus status) {
        this.availableQuantity = availableQuantity;
        this.pricePerKg = pricePerKg;
        this.harvestDate = harvestDate;
        this.location = location;
        this.status = status;
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
}
