package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.CreateHarvestRequest;
import com.agriconnect.dto.HarvestResponse;
import com.agriconnect.dto.UpdateHarvestRequest;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.HarvestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing Harvest Management endpoints for authenticated farmers.
 * Accessible only by users with ROLE_FARMER.
 * Ownership boundaries are strictly enforced across all operations.
 */
@RestController
@RequestMapping("/api/farmer/harvests")
public class FarmerHarvestController {

    private final HarvestService harvestService;

    public FarmerHarvestController(HarvestService harvestService) {
        this.harvestService = harvestService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HarvestResponse>> createHarvest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateHarvestRequest request) {
        HarvestResponse response = harvestService.createHarvest(userDetails.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Harvest lot created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HarvestResponse>>> getMyHarvests(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<HarvestResponse> harvests = harvestService.getFarmerHarvests(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Farmer harvests retrieved successfully", harvests));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HarvestResponse>> getHarvestById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer id) {
        HarvestResponse response = harvestService.getFarmerHarvestById(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Harvest details retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<HarvestResponse>> updateHarvest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer id,
            @Valid @RequestBody UpdateHarvestRequest request) {
        HarvestResponse response = harvestService.updateFarmerHarvest(userDetails.getUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Harvest updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHarvest(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer id) {
        harvestService.deleteFarmerHarvest(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Harvest deleted successfully", null));
    }
}
