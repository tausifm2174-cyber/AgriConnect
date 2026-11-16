package com.agriconnect.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request payload to create a new delivery record for an accepted order.
 */
public class CreateDeliveryRequest {

    @NotNull(message = "Order ID is required.")
    private Integer orderId;

    @NotBlank(message = "Delivery address is required.")
    @Size(max = 255, message = "Delivery address cannot exceed 255 characters.")
    private String deliveryAddress;

    @Size(max = 20, message = "Vehicle number cannot exceed 20 characters.")
    private String vehicleNumber;

    @Size(max = 50, message = "Tracking number cannot exceed 50 characters.")
    private String trackingNumber;

    @Size(max = 255, message = "Remarks cannot exceed 255 characters.")
    private String remarks;

    public CreateDeliveryRequest() {
    }

    public CreateDeliveryRequest(Integer orderId, String deliveryAddress, String vehicleNumber,
                                 String trackingNumber, String remarks) {
        this.orderId = orderId;
        this.deliveryAddress = deliveryAddress;
        this.vehicleNumber = vehicleNumber;
        this.trackingNumber = trackingNumber;
        this.remarks = remarks;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getTrackingNumber() {
        return trackingNumber;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
