package com.agriconnect.controller;

import com.agriconnect.dto.*;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.QualityAssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller exposing Quality Management and Verification endpoints for administrators (Phase 5).
 * Protected by Spring Security: Accessible only by users holding the ADMIN role.
 * Identity of the assessing/verifying admin is extracted strictly from the JWT authentication token.
 */
@RestController
@RequestMapping("/api/admin/quality")
public class AdminQualityController {

    private final QualityAssessmentService qualityAssessmentService;

    public AdminQualityController(QualityAssessmentService qualityAssessmentService) {
        this.qualityAssessmentService = qualityAssessmentService;
    }

    /**
     * 1. Get harvests requiring quality assessment or filtered by status.
     * GET /api/admin/quality/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<AdminHarvestQualitySummaryResponse>>> getPendingHarvests(
            @RequestParam(name = "status", required = false) String status) {
        List<AdminHarvestQualitySummaryResponse> harvests = qualityAssessmentService.getPendingHarvests(status);
        return ResponseEntity.ok(ApiResponse.success("Pending harvests for assessment retrieved successfully", harvests));
    }

    /**
     * 2. Get harvest details for assessment (includes existing assessment if present).
     * GET /api/admin/quality/harvests/{harvestId}
     */
    @GetMapping("/harvests/{harvestId}")
    public ResponseEntity<ApiResponse<HarvestQualityDetailResponse>> getHarvestDetailsForAssessment(
            @PathVariable Integer harvestId) {
        HarvestQualityDetailResponse response = qualityAssessmentService.getHarvestDetailsForAssessment(harvestId);
        return ResponseEntity.ok(ApiResponse.success("Harvest inspection details retrieved successfully", response));
    }

    /**
     * 3. Create official quality assessment.
     * POST /api/admin/quality
     */
    @PostMapping
    public ResponseEntity<ApiResponse<QualityAssessmentResponse>> createAssessment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateQualityAssessmentRequest request) {
        QualityAssessmentResponse response = qualityAssessmentService.createAssessment(userDetails.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Quality assessment created successfully", response));
    }

    /**
     * 4. Get quality assessment details by ID.
     * GET /api/admin/quality/{assessmentId}
     */
    @GetMapping("/{assessmentId}")
    public ResponseEntity<ApiResponse<QualityAssessmentResponse>> getAssessmentById(
            @PathVariable Integer assessmentId) {
        QualityAssessmentResponse response = qualityAssessmentService.getAssessmentById(assessmentId);
        return ResponseEntity.ok(ApiResponse.success("Quality assessment details retrieved successfully", response));
    }

    /**
     * 5. Update existing quality assessment.
     * PUT /api/admin/quality/{assessmentId}
     */
    @PutMapping("/{assessmentId}")
    public ResponseEntity<ApiResponse<QualityAssessmentResponse>> updateAssessment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer assessmentId,
            @Valid @RequestBody UpdateQualityAssessmentRequest request) {
        QualityAssessmentResponse response = qualityAssessmentService.updateAssessment(userDetails.getUserId(), assessmentId, request);
        return ResponseEntity.ok(ApiResponse.success("Quality assessment updated and resubmitted successfully", response));
    }

    /**
     * 6. Formally verify a quality assessment.
     * PUT /api/admin/quality/{assessmentId}/verify
     */
    @PutMapping("/{assessmentId}/verify")
    public ResponseEntity<ApiResponse<QualityAssessmentResponse>> verifyAssessment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer assessmentId) {
        QualityAssessmentResponse response = qualityAssessmentService.verifyAssessment(userDetails.getUserId(), assessmentId);
        return ResponseEntity.ok(ApiResponse.success("Quality assessment verified successfully", response));
    }

    /**
     * 7. Reject a quality assessment.
     * PUT /api/admin/quality/{assessmentId}/reject
     */
    @PutMapping("/{assessmentId}/reject")
    public ResponseEntity<ApiResponse<QualityAssessmentResponse>> rejectAssessment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer assessmentId,
            @RequestBody(required = false) Map<String, String> body) {
        String notes = body != null ? body.get("notes") : null;
        QualityAssessmentResponse response = qualityAssessmentService.rejectAssessment(userDetails.getUserId(), assessmentId, notes);
        return ResponseEntity.ok(ApiResponse.success("Quality assessment marked as rejected", response));
    }

    /**
     * Overview metrics for admin dashboard cards (Pending, Verified, Rejected).
     * GET /api/admin/quality/metrics
     */
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getMetrics() {
        Map<String, Long> metrics = qualityAssessmentService.getAssessmentMetrics();
        return ResponseEntity.ok(ApiResponse.success("Quality assessment metrics retrieved successfully", metrics));
    }
}
