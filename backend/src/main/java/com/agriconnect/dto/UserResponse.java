package com.agriconnect.dto;

import com.agriconnect.entity.Role;
import com.agriconnect.entity.UserStatus;

/**
 * Current authenticated user profile information (GET /api/auth/me).
 * Never exposes passwords or password hashes.
 */
public class UserResponse {

    private Integer userId;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private UserStatus status;
    private FarmerProfileDto farmerProfile;
    private BuyerProfileDto buyerProfile;

    public UserResponse() {
    }

    public UserResponse(Integer userId, String fullName, String email, String phone, Role role, UserStatus status) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.status = status;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public UserStatus getStatus() {
        return status;
    }

    public void setStatus(UserStatus status) {
        this.status = status;
    }

    public FarmerProfileDto getFarmerProfile() {
        return farmerProfile;
    }

    public void setFarmerProfile(FarmerProfileDto farmerProfile) {
        this.farmerProfile = farmerProfile;
    }

    public BuyerProfileDto getBuyerProfile() {
        return buyerProfile;
    }

    public void setBuyerProfile(BuyerProfileDto buyerProfile) {
        this.buyerProfile = buyerProfile;
    }
}
