package com.agriconnect.dto;

import com.agriconnect.entity.BusinessType;

/**
 * Safe summary DTO for BuyerProfile.
 */
public class BuyerProfileDto {

    private Integer buyerId;
    private String businessName;
    private BusinessType businessType;
    private String gstin;
    private String businessAddress;

    public BuyerProfileDto() {
    }

    public BuyerProfileDto(Integer buyerId, String businessName, BusinessType businessType, String gstin, String businessAddress) {
        this.buyerId = buyerId;
        this.businessName = businessName;
        this.businessType = businessType;
        this.gstin = gstin;
        this.businessAddress = businessAddress;
    }

    public Integer getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Integer buyerId) {
        this.buyerId = buyerId;
    }

    public String getBusinessName() {
        return businessName;
    }

    public void setBusinessName(String businessName) {
        this.businessName = businessName;
    }

    public BusinessType getBusinessType() {
        return businessType;
    }

    public void setBusinessType(BusinessType businessType) {
        this.businessType = businessType;
    }

    public String getGstin() {
        return gstin;
    }

    public void setGstin(String gstin) {
        this.gstin = gstin;
    }

    public String getBusinessAddress() {
        return businessAddress;
    }

    public void setBusinessAddress(String businessAddress) {
        this.businessAddress = businessAddress;
    }
}
