package com.agriconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RequestReassessmentRequest {

    @NotBlank(message = "Reason for reassessment is required.")
    @Size(max = 255, message = "Reason cannot exceed 255 characters.")
    private String reason;

    private Integer buyerFeedbackId;

    @Size(max = 500, message = "Inspection notes cannot exceed 500 characters.")
    private String notes;

    public RequestReassessmentRequest() {
    }

    public RequestReassessmentRequest(String reason, Integer buyerFeedbackId, String notes) {
        this.reason = reason;
        this.buyerFeedbackId = buyerFeedbackId;
        this.notes = notes;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Integer getBuyerFeedbackId() {
        return buyerFeedbackId;
    }

    public void setBuyerFeedbackId(Integer buyerFeedbackId) {
        this.buyerFeedbackId = buyerFeedbackId;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
