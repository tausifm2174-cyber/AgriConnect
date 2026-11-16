package com.agriconnect.dto;

import jakarta.validation.constraints.Size;

/**
 * Request payload for transitioning delivery status (e.g. shipping, delivering)
 * and updating logistics metadata.
 */
public class UpdateDeliveryStatusRequest {

    @Size(max = 50, message = "Tracking number cannot exceed 50 characters.")
    private String trackingNumber;

    @Size(max = 20, message = "Vehicle number cannot exceed 20 characters.")
    private String vehicleNumber;

    @Size(max = 255, message = "Remarks cannot exceed 255 characters.")
    private String remarks;

    @Size(max = 255, message = "Delivery address cannot exceed 255 characters.")
    private String deliveryAddress;

    public UpdateDeliveryStatusRequest() {
    }

    public UpdateDeliveryStatusRequest(String trackingNumber, String vehicleNumber, String remarks) {
        this.trackingNumber = trackingNumber;
        this.vehicleNumber = vehicleNumber;
        this.remarks = remarks;
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

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getDeliveryAddress() {
        return deliveryAddress;
    }

    public void setDeliveryAddress(String deliveryAddress) {
        this.deliveryAddress = deliveryAddress;
    }
}
