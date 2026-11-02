package com.agriconnect.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request payload for a commercial buyer placing an order against an available farmer harvest lot.
 */
public class CreateOrderRequest {

    @NotNull(message = "Harvest ID is required.")
    private Integer harvestId;

    @NotNull(message = "Order quantity is required.")
    @Positive(message = "Order quantity must be greater than 0 kg.")
    private BigDecimal quantity;

    @Positive(message = "Agreed price per kg must be greater than 0.")
    private BigDecimal agreedPricePerKg;

    private Integer requirementId;

    @Size(max = 255, message = "Remarks cannot exceed 255 characters.")
    private String remarks;

    public CreateOrderRequest() {
    }

    public CreateOrderRequest(Integer harvestId, BigDecimal quantity, BigDecimal agreedPricePerKg,
                              Integer requirementId, String remarks) {
        this.harvestId = harvestId;
        this.quantity = quantity;
        this.agreedPricePerKg = agreedPricePerKg;
        this.requirementId = requirementId;
        this.remarks = remarks;
    }

    public Integer getHarvestId() {
        return harvestId;
    }

    public void setHarvestId(Integer harvestId) {
        this.harvestId = harvestId;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getAgreedPricePerKg() {
        return agreedPricePerKg;
    }

    public void setAgreedPricePerKg(BigDecimal agreedPricePerKg) {
        this.agreedPricePerKg = agreedPricePerKg;
    }

    public Integer getRequirementId() {
        return requirementId;
    }

    public void setRequirementId(Integer requirementId) {
        this.requirementId = requirementId;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
