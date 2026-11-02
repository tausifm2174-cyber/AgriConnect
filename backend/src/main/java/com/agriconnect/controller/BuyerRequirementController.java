package com.agriconnect.controller;

import com.agriconnect.dto.*;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.BuyerRequirementService;
import com.agriconnect.service.MatchingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller exposing Buyer Requirement Management and Quality-Aware Matching endpoints
 * for authenticated commercial buyers.
 * Accessible only by users with ROLE_BUYER.
 * Ownership boundaries and JWT-derived identity are strictly enforced.
 */
@RestController
@RequestMapping("/api/buyer/requirements")
public class BuyerRequirementController {

    private final BuyerRequirementService requirementService;
    private final MatchingService matchingService;

    public BuyerRequirementController(BuyerRequirementService requirementService,
                                      MatchingService matchingService) {
        this.requirementService = requirementService;
        this.matchingService = matchingService;
    }

    /**
     * Post a new commercial crop requirement.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BuyerRequirementResponse>> createRequirement(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateBuyerRequirementRequest request) {
        BuyerRequirementResponse response = requirementService.createRequirement(userDetails.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Buyer requirement created successfully", response));
    }

    /**
     * Get all requirements posted by the authenticated buyer.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BuyerRequirementResponse>>> getMyRequirements(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<BuyerRequirementResponse> requirements = requirementService.getBuyerRequirements(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Buyer requirements retrieved successfully", requirements));
    }

    /**
     * Get summary metrics for the buyer dashboard overview.
     */
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<BuyerRequirementMetricsResponse>> getMetrics(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        BuyerRequirementMetricsResponse metrics = requirementService.getBuyerRequirementMetrics(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Buyer requirement metrics retrieved successfully", metrics));
    }

    /**
     * Get single requirement details by ID, enforcing ownership.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BuyerRequirementResponse>> getRequirementById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer id) {
        BuyerRequirementResponse response = requirementService.getBuyerRequirementById(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Buyer requirement retrieved successfully", response));
    }

    /**
     * Update an existing buyer requirement.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BuyerRequirementResponse>> updateRequirement(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer id,
            @Valid @RequestBody UpdateBuyerRequirementRequest request) {
        BuyerRequirementResponse response = requirementService.updateBuyerRequirement(userDetails.getUserId(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Buyer requirement updated successfully", response));
    }

    /**
     * Cancel an open buyer requirement.
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<BuyerRequirementResponse>> cancelRequirement(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer id) {
        BuyerRequirementResponse response = requirementService.cancelBuyerRequirement(userDetails.getUserId(), id);
        return ResponseEntity.ok(ApiResponse.success("Buyer requirement cancelled successfully", response));
    }

    /**
     * Quality-Aware Matching Engine Endpoint (Phase 7).
     * Retrieves deterministic, ranked matching harvest lots for the authenticated buyer's requirement.
     * Enforces requirement ownership, OPEN status, non-expiration, crop match, quantity coverage,
     * price ceiling, and verified quality standards.
     *
     * @param userDetails   Authenticated buyer principal from JWT
     * @param id            Buyer requirement ID
     * @param sort          Optional sorting criteria (defaults to 'best')
     * @return 200 OK with composite BuyerRequirementMatchResponse
     */
    @GetMapping("/{id}/matches")
    public ResponseEntity<ApiResponse<BuyerRequirementMatchResponse>> getRequirementMatches(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer id,
            @RequestParam(value = "sort", required = false, defaultValue = "best") String sort) {
        BuyerRequirementMatchResponse response = matchingService.findMatchesForRequirement(userDetails.getUserId(), id, sort);
        return ResponseEntity.ok(ApiResponse.success("Matching harvests retrieved successfully", response));
    }
}
