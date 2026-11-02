package com.agriconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 1:1 specialization profile table for BUYER role.
 * Mapped to the existing 'buyer_profiles' table in MySQL.
 */
@Entity
@Table(name = "buyer_profiles")
public class BuyerProfile {

    @Id
    @Column(name = "buyer_id")
    private Integer buyerId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "buyer_id")
    private User user;

    @Column(name = "business_name", nullable = false, length = 120)
    private String businessName;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_type", nullable = false)
    private BusinessType businessType;

    @Column(name = "gstin", length = 15, unique = true)
    private String gstin;

    @Column(name = "business_address", nullable = false, length = 200)
    private String businessAddress;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public BuyerProfile() {
    }

    public BuyerProfile(User user, String businessName, BusinessType businessType, String gstin, String businessAddress) {
        this.user = user;
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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
