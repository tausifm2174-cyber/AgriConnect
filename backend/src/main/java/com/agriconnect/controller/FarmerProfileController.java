package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.FarmerProfileDetailResponse;
import com.agriconnect.dto.FarmerProfileDto;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.FarmerProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller exposing Farmer Profile endpoints for authenticated farmers.
 * Accessible only by users with ROLE_FARMER.
 */
@RestController
@RequestMapping("/api/farmer/profile")
public class FarmerProfileController {

    private final FarmerProfileService farmerProfileService;

    public FarmerProfileController(FarmerProfileService farmerProfileService) {
        this.farmerProfileService = farmerProfileService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<FarmerProfileDetailResponse>> getMyFarmerProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        FarmerProfileDetailResponse profile = farmerProfileService.getFarmerProfile(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Farmer profile retrieved successfully", profile));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<FarmerProfileDetailResponse>> updateMyFarmerProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody FarmerProfileDto updateDto) {
        FarmerProfileDetailResponse profile = farmerProfileService.updateFarmerProfile(userDetails.getUserId(), updateDto);
        return ResponseEntity.ok(ApiResponse.success("Farmer profile updated successfully", profile));
    }
}
