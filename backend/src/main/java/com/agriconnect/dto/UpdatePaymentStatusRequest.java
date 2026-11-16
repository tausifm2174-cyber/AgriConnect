package com.agriconnect.dto;

import com.agriconnect.entity.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload to transition payment status (Admin or settlement processing).
 */
public class UpdatePaymentStatusRequest {

    @NotNull(message = "Payment status is required.")
    private PaymentStatus paymentStatus;

    @Size(max = 255, message = "Remarks cannot exceed 255 characters.")
    private String remarks;

    @Size(max = 100, message = "Transaction reference cannot exceed 100 characters.")
    private String transactionReference;

    public UpdatePaymentStatusRequest() {
    }

    public UpdatePaymentStatusRequest(PaymentStatus paymentStatus, String remarks) {
        this.paymentStatus = paymentStatus;
        this.remarks = remarks;
    }

    public UpdatePaymentStatusRequest(PaymentStatus paymentStatus, String remarks, String transactionReference) {
        this.paymentStatus = paymentStatus;
        this.remarks = remarks;
        this.transactionReference = transactionReference;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }
}
