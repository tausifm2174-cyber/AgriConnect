package com.agriconnect.dto;

import com.agriconnect.entity.Payment;
import com.agriconnect.entity.PaymentMethod;
import com.agriconnect.entity.PaymentStatus;
import com.agriconnect.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Enriched response DTO for Payment Management (Phase 10).
 * Combines financial transaction audit attributes with relational order, buyer, and farmer metadata.
 */
public class PaymentResponse {

    private Integer paymentId;
    private Integer orderId;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String transactionReference;
    private String remarks;
    private LocalDateTime paymentDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Order Specifications
    private OrderStatus orderStatus;
    private BigDecimal orderQuantity;
    private BigDecimal agreedPricePerKg;
    private BigDecimal orderTotalAmount;
    private LocalDateTime orderDate;

    // Crop / Harvest Details
    private Integer harvestId;
    private Integer cropId;
    private String cropName;
    private String cropCategory;

    // Buyer Information
    private Integer buyerId;
    private String buyerName;
    private String businessName;
    private String buyerEmail;
    private String buyerPhone;

    // Farmer Information
    private Integer farmerId;
    private String farmerName;
    private String farmLocation;
    private String farmerEmail;
    private String farmerPhone;

    public PaymentResponse() {
    }

    public PaymentResponse(Payment payment) {
        if (payment != null) {
            this.paymentId = payment.getPaymentId();
            this.amount = payment.getAmount();
            this.paymentMethod = payment.getPaymentMethod();
            this.paymentStatus = payment.getPaymentStatus();
            this.transactionReference = payment.getTransactionReference();
            this.remarks = payment.getRemarks();
            this.paymentDate = payment.getPaymentDate();
            this.createdAt = payment.getCreatedAt();
            this.updatedAt = payment.getUpdatedAt();

            if (payment.getOrder() != null) {
                var o = payment.getOrder();
                this.orderId = o.getOrderId();
                this.orderStatus = o.getOrderStatus();
                this.orderQuantity = o.getQuantity();
                this.agreedPricePerKg = o.getAgreedPricePerKg();
                this.orderTotalAmount = o.getTotalAmount();
                this.orderDate = o.getOrderDate();

                if (o.getBuyer() != null) {
                    this.buyerId = o.getBuyer().getUserId();
                    this.buyerName = o.getBuyer().getFullName();
                    this.buyerEmail = o.getBuyer().getEmail();
                    this.buyerPhone = o.getBuyer().getPhone();
                }

                if (o.getHarvest() != null) {
                    this.harvestId = o.getHarvest().getHarvestId();
                    if (o.getHarvest().getCrop() != null) {
                        this.cropId = o.getHarvest().getCrop().getCropId();
                        this.cropName = o.getHarvest().getCrop().getCropName();
                        if (o.getHarvest().getCrop().getCategory() != null) {
                            this.cropCategory = o.getHarvest().getCrop().getCategory().name();
                        }
                    }
                    if (o.getHarvest().getFarmer() != null) {
                        this.farmerId = o.getHarvest().getFarmer().getUserId();
                        this.farmerName = o.getHarvest().getFarmer().getFullName();
                        this.farmerEmail = o.getHarvest().getFarmer().getEmail();
                        this.farmerPhone = o.getHarvest().getFarmer().getPhone();
                    }
                }
            }
        }
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
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

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
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

    public LocalDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public OrderStatus getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(OrderStatus orderStatus) {
        this.orderStatus = orderStatus;
    }

    public BigDecimal getOrderQuantity() {
        return orderQuantity;
    }

    public void setOrderQuantity(BigDecimal orderQuantity) {
        this.orderQuantity = orderQuantity;
    }

    public BigDecimal getAgreedPricePerKg() {
        return agreedPricePerKg;
    }

    public void setAgreedPricePerKg(BigDecimal agreedPricePerKg) {
        this.agreedPricePerKg = agreedPricePerKg;
    }

    public BigDecimal getOrderTotalAmount() {
        return orderTotalAmount;
    }

    public void setOrderTotalAmount(BigDecimal orderTotalAmount) {
        this.orderTotalAmount = orderTotalAmount;
    }

    public LocalDateTime getOrderDate() {
        return orderDate;
    }

    public void setOrderDate(LocalDateTime orderDate) {
        this.orderDate = orderDate;
    }

    public Integer getHarvestId() {
        return harvestId;
    }

    public void setHarvestId(Integer harvestId) {
        this.harvestId = harvestId;
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

    public String getCropCategory() {
        return cropCategory;
    }

    public void setCropCategory(String cropCategory) {
        this.cropCategory = cropCategory;
    }

    public Integer getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Integer buyerId) {
        this.buyerId = buyerId;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public String getBuyerEmail() {
        return buyerEmail;
    }

    public void setBuyerEmail(String buyerEmail) {
        this.buyerEmail = buyerEmail;
    }

    public String getBuyerPhone() {
        return buyerPhone;
    }

    public void setBuyerPhone(String buyerPhone) {
        this.buyerPhone = buyerPhone;
    }

    public Integer getFarmerId() {
        return farmerId;
    }

    public void setFarmerId(Integer farmerId) {
        this.farmerId = farmerId;
    }

    public String getFarmerName() {
        return farmerName;
    }

    public void setFarmerName(String farmerName) {
        this.farmerName = farmerName;
    }

    public String getFarmLocation() {
        return farmLocation;
    }

    public void setFarmLocation(String farmLocation) {
        this.farmLocation = farmLocation;
    }

    public String getFarmerEmail() {
        return farmerEmail;
    }

    public void setFarmerEmail(String farmerEmail) {
        this.farmerEmail = farmerEmail;
    }

    public String getFarmerPhone() {
        return farmerPhone;
    }

    public void setFarmerPhone(String farmerPhone) {
        this.farmerPhone = farmerPhone;
    }
}
