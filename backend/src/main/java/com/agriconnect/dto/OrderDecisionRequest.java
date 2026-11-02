package com.agriconnect.dto;

import jakarta.validation.constraints.Size;

/**
 * Request payload for optional reason or remarks when updating order status (e.g., cancellation or rejection).
 */
public class OrderDecisionRequest {

    @Size(max = 255, message = "Reason cannot exceed 255 characters.")
    private String reason;

    public OrderDecisionRequest() {
    }

    public OrderDecisionRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
