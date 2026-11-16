package com.agriconnect.dto;

import com.agriconnect.entity.Delivery;
import com.agriconnect.entity.DeliveryStatus;
import com.agriconnect.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Standard response DTO for Delivery Management (Phase 9).
 * Enriched with relational order specifications, party identities, and logistics audit timestamps.
 */
public class DeliveryResponse {

    private Integer deliveryId;
    private Integer orderId;
    private DeliveryStatus deliveryStatus;
    private String trackingNumber;
    private String vehicleNumber;
    private String deliveryAddress;
    private String remarks;
    private LocalDateTime dispatchedAt;
    private LocalDateTime deliveredAt;
    private LocalDate estimatedDeliveryDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Order Specifications
    private OrderStatus orderStatus;
    private BigDecimal quantity;
    private BigDecimal agreedPricePerKg;
    private BigDecimal totalAmount;
    private LocalDateTime orderDate;

    // Crop & Harvest details
    private Integer harvestId;
    private Integer cropId;
    private String cropName;
    private String cropCategory;

    // Buyer Information
    private Integer buyerId;
    private String buyerName;
    private String businessName;
    private String buyerPhone;
    private String buyerEmail;

    // Farmer Information
    private Integer farmerId;
    private String farmerName;
    private String farmLocation;
    private String farmerPhone;
    private String farmerEmail;

    public DeliveryResponse() {
    }

    public DeliveryResponse(Delivery delivery) {
        if (delivery != null) {
            this.deliveryId = delivery.getDeliveryId();
            this.deliveryStatus = delivery.getDeliveryStatus();
            this.trackingNumber = delivery.getTrackingNumber();
            this.vehicleNumber = delivery.getVehicleNumber();
            this.deliveryAddress = delivery.getDeliveryAddress();
            this.remarks = delivery.getRemarks();
            this.dispatchedAt = delivery.getDispatchedAt();
            this.deliveredAt = delivery.getDeliveredAt();
            this.estimatedDeliveryDate = delivery.getEstimatedDeliveryDate();
            this.createdAt = delivery.getCreatedAt();
            this.updatedAt = delivery.getUpdatedAt();

            if (delivery.getOrder() != null) {
                var o = delivery.getOrder();
                this.orderId = o.getOrderId();
                this.orderStatus = o.getOrderStatus();
                this.quantity = o.getQuantity();
                this.agreedPricePerKg = o.getAgreedPricePerKg();
                this.totalAmount = o.getTotalAmount();
                this.orderDate = o.getOrderDate();

                if (o.getBuyer() != null) {
                    this.buyerId = o.getBuyer().getUserId();
                    this.buyerName = o.getBuyer().getFullName();
                    this.buyerPhone = o.getBuyer().getPhone();
                    this.buyerEmail = o.getBuyer().getEmail();
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
                        this.farmerPhone = o.getHarvest().getFarmer().getPhone();
                        this.farmerEmail = o.getHarvest().getFarmer().getEmail();
                    }
                }
            }
        }
    }

    public Integer getDeliveryId() {
        return deliveryId;
    }

    public void setDeliveryId(Integer deliveryId) {
        this.deliveryId = deliveryId;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public DeliveryStatus getDeliveryStatus() {
        return deliveryStatus;
    }

    public void setDeliveryStatus(DeliveryStatus deliveryStatus) {
        this.deliveryStatus = deliveryStatus;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getDispatchedAt() {
        return dispatchedAt;
    }

    public void setDispatchedAt(LocalDateTime dispatchedAt) {
        this.dispatchedAt = dispatchedAt;
    }

    public LocalDateTime getDeliveredAt() {
        return deliveredAt;
    }

    public void setDeliveredAt(LocalDateTime deliveredAt) {
        this.deliveredAt = deliveredAt;
    }

    public LocalDate getEstimatedDeliveryDate() {
        return estimatedDeliveryDate;
    }

    public void setEstimatedDeliveryDate(LocalDate estimatedDeliveryDate) {
        this.estimatedDeliveryDate = estimatedDeliveryDate;
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

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
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

    public String getBuyerPhone() {
        return buyerPhone;
    }

    public void setBuyerPhone(String buyerPhone) {
        this.buyerPhone = buyerPhone;
    }

    public String getBuyerEmail() {
        return buyerEmail;
    }

    public void setBuyerEmail(String buyerEmail) {
        this.buyerEmail = buyerEmail;
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

    public String getFarmerPhone() {
        return farmerPhone;
    }

    public void setFarmerPhone(String farmerPhone) {
        this.farmerPhone = farmerPhone;
    }

    public String getFarmerEmail() {
        return farmerEmail;
    }

    public void setFarmerEmail(String farmerEmail) {
        this.farmerEmail = farmerEmail;
    }
}
