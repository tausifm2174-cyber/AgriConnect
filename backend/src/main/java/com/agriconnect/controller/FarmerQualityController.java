package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.QualityAssessmentResponse;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.QualityAssessmentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * Controller exposing read-only quality inspection details for authenticated farmers.
 * Accessible only by users holding the FARMER role.
 * Harvest ownership is strictly validated against the authenticated user ID.
 */
@RestController
@RequestMapping("/api/farmer/harvests")
public class FarmerQualityController {

    private final QualityAssessmentService qualityAssessmentService;

    public FarmerQualityController(QualityAssessmentService qualityAssessmentService) {
        this.qualityAssessmentService = qualityAssessmentService;
    }

    /**
     * Retrieves the official quality assessment for a specific harvest lot owned by the farmer.
     * GET /api/farmer/harvests/{harvestId}/quality
     */
    @GetMapping("/{harvestId}/quality")
    public ResponseEntity<ApiResponse<QualityAssessmentResponse>> getHarvestQuality(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer harvestId) {
        Optional<QualityAssessmentResponse> responseOpt =
                qualityAssessmentService.getFarmerHarvestQuality(userDetails.getUserId(), harvestId);

        if (responseOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success("Quality assessment not available yet.", null));
        }

        return ResponseEntity.ok(ApiResponse.success("Quality assessment retrieved successfully", responseOpt.get()));
    }
}
