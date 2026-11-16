package com.agriconnect.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Settlement summary DTO representing financial balance and payment audit for an order.
 */
public class PaymentSummaryDto {

    private Integer orderId;
    private BigDecimal orderTotal;
    private BigDecimal totalPaid;
    private BigDecimal remainingBalance;
    private boolean fullyPaid;
    private List<PaymentResponse> payments;

    public PaymentSummaryDto() {
    }

    public PaymentSummaryDto(Integer orderId, BigDecimal orderTotal, BigDecimal totalPaid,
                             BigDecimal remainingBalance, boolean fullyPaid, List<PaymentResponse> payments) {
        this.orderId = orderId;
        this.orderTotal = orderTotal;
        this.totalPaid = totalPaid;
        this.remainingBalance = remainingBalance;
        this.fullyPaid = fullyPaid;
        this.payments = payments;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public BigDecimal getOrderTotal() {
        return orderTotal;
    }

    public void setOrderTotal(BigDecimal orderTotal) {
        this.orderTotal = orderTotal;
    }

    public BigDecimal getTotalPaid() {
        return totalPaid;
    }

    public void setTotalPaid(BigDecimal totalPaid) {
        this.totalPaid = totalPaid;
    }

    public BigDecimal getRemainingBalance() {
        return remainingBalance;
    }

    public void setRemainingBalance(BigDecimal remainingBalance) {
        this.remainingBalance = remainingBalance;
    }

    public boolean isFullyPaid() {
        return fullyPaid;
    }

    public void setFullyPaid(boolean fullyPaid) {
        this.fullyPaid = fullyPaid;
    }

    public List<PaymentResponse> getPayments() {
        return payments;
    }

    public void setPayments(List<PaymentResponse> payments) {
        this.payments = payments;
    }
}
