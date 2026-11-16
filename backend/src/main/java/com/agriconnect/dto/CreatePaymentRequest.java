package com.agriconnect.dto;

import com.agriconnect.entity.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request payload to initiate or record a payment against a commercial purchase order.
 */
public class CreatePaymentRequest {

    @NotNull(message = "Order ID is required.")
    private Integer orderId;

    @NotNull(message = "Payment amount is required.")
    @DecimalMin(value = "0.01", message = "Payment amount must be greater than zero.")
    private BigDecimal amount;

    @NotNull(message = "Payment method is required.")
    private PaymentMethod paymentMethod;

    @Size(max = 100, message = "Transaction reference cannot exceed 100 characters.")
    private String transactionReference;

    @Size(max = 255, message = "Remarks cannot exceed 255 characters.")
    private String remarks;

    private com.agriconnect.entity.PaymentStatus paymentStatus;

    public CreatePaymentRequest() {
    }

    public CreatePaymentRequest(Integer orderId, BigDecimal amount, PaymentMethod paymentMethod,
                                String transactionReference, String remarks) {
        this.orderId = orderId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.transactionReference = transactionReference;
        this.remarks = remarks;
    }

    public CreatePaymentRequest(Integer orderId, BigDecimal amount, PaymentMethod paymentMethod,
                                String transactionReference, String remarks, com.agriconnect.entity.PaymentStatus paymentStatus) {
        this.orderId = orderId;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.transactionReference = transactionReference;
        this.remarks = remarks;
        this.paymentStatus = paymentStatus;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public com.agriconnect.entity.PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(com.agriconnect.entity.PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }
}
