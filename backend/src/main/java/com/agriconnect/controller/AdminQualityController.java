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
 * Controller exposing Quality Management, Verification, Reassessment, and Audit endpoints for administrators (Phases 5 & 16C).
 * Protected by Spring Security: Accessible only by users holding the ADMIN role.
 */
@RestController
@RequestMapping("/api/admin/quality")
public class AdminQualityController {

    private final QualityAssessmentService qualityAssessmentService;

    public AdminQualityController(QualityAssessmentService qualityAssessmentService) {
        this.qualityAssessmentService = qualityAssessmentService;
    }

    /**
     * Get all quality assessments across the marketplace (for Admin Dashboard).
     * GET /api/admin/quality
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<QualityAssessmentResponse>>> getAllAssessments() {
        List<QualityAssessmentResponse> assessments = qualityAssessmentService.getAllAssessments();
        return ResponseEntity.ok(ApiResponse.success("All quality assessments retrieved successfully", assessments));
    }

    /**
     * Get harvests requiring quality assessment or filtered by status.
     * GET /api/admin/quality/pending
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<AdminHarvestQualitySummaryResponse>>> getPendingHarvests(
            @RequestParam(name = "status", required = false) String status) {
        List<AdminHarvestQualitySummaryResponse> harvests = qualityAssessmentService.getPendingHarvests(status);
        return ResponseEntity.ok(ApiResponse.success("Pending harvests for assessment retrieved successfully", harvests));
    }

    /**
     * Get harvest details for assessment (includes existing assessment if present).
     * GET /api/admin/quality/harvests/{harvestId}
     */
    @GetMapping("/harvests/{harvestId}")
    public ResponseEntity<ApiResponse<HarvestQualityDetailResponse>> getHarvestDetailsForAssessment(
            @PathVariable Integer harvestId) {
        HarvestQualityDetailResponse response = qualityAssessmentService.getHarvestDetailsForAssessment(harvestId);
        return ResponseEntity.ok(ApiResponse.success("Harvest inspection details retrieved successfully", response));
    }

    /**
     * Create official quality assessment.
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
     * Get quality assessment details by ID.
     * GET /api/admin/quality/{assessmentId}
     */
    @GetMapping("/{assessmentId}")
    public ResponseEntity<ApiResponse<QualityAssessmentResponse>> getAssessmentById(
            @PathVariable Integer assessmentId) {
        QualityAssessmentResponse response = qualityAssessmentService.getAssessmentById(assessmentId);
        return ResponseEntity.ok(ApiResponse.success("Quality assessment details retrieved successfully", response));
    }

    /**
     * Update existing quality assessment.
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
     * Formally verify a quality assessment.
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
     * Reject a quality assessment.
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
     * Request or initiate quality reassessment on an assessment lot.
     * POST /api/admin/quality/{assessmentId}/request-reassessment
     */
    @PostMapping("/{assessmentId}/request-reassessment")
    public ResponseEntity<ApiResponse<QualityAssessmentResponse>> requestReassessment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer assessmentId,
            @Valid @RequestBody RequestReassessmentRequest request) {
        QualityAssessmentResponse response = qualityAssessmentService.requestReassessment(userDetails.getUserId(), assessmentId, request);
        return ResponseEntity.ok(ApiResponse.success("Quality reassessment requested and harvest flagged", response));
    }

    /**
     * Perform physical reinspection and record administrative reassessment decision.
     * POST /api/admin/quality/{assessmentId}/reassess
     */
    @PostMapping("/{assessmentId}/reassess")
    public ResponseEntity<ApiResponse<QualityReassessmentResponse>> performReassessment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer assessmentId,
            @Valid @RequestBody PerformReassessmentRequest request) {
        QualityReassessmentResponse response = qualityAssessmentService.performReassessment(userDetails.getUserId(), assessmentId, request);
        return ResponseEntity.ok(ApiResponse.success("Quality reinspection recorded successfully", response));
    }

    /**
     * Retrieve complete chronological quality audit timeline.
     * GET /api/admin/quality/{assessmentId}/audit-history
     */
    @GetMapping("/{assessmentId}/audit-history")
    public ResponseEntity<ApiResponse<List<QualityAuditTimelineItem>>> getAuditHistory(
            @PathVariable Integer assessmentId) {
        List<QualityAuditTimelineItem> history = qualityAssessmentService.getAuditHistory(assessmentId);
        return ResponseEntity.ok(ApiResponse.success("Quality audit history retrieved successfully", history));
    }

    /**
     * Retrieve all historical reassessments across the platform.
     * GET /api/admin/quality/reassessments
     */
    @GetMapping("/reassessments")
    public ResponseEntity<ApiResponse<List<QualityReassessmentResponse>>> getAllReassessments() {
        List<QualityReassessmentResponse> list = qualityAssessmentService.getAllReassessments();
        return ResponseEntity.ok(ApiResponse.success("Historical quality reassessments retrieved successfully", list));
    }

    /**
     * Retrieve all buyer quality feedback reports across the platform.
     * GET /api/admin/quality/feedback
     */
    @GetMapping("/feedback")
    public ResponseEntity<ApiResponse<List<BuyerQualityFeedbackResponse>>> getAllBuyerFeedback(
            @RequestParam(name = "status", required = false) String status) {
        List<BuyerQualityFeedbackResponse> list = qualityAssessmentService.getAllBuyerFeedback(status);
        return ResponseEntity.ok(ApiResponse.success("Buyer quality feedback retrieved successfully", list));
    }

    /**
     * Overview metrics for admin dashboard cards (Pending, Verified, Rejected, ReassessmentRequired, Feedback).
     * GET /api/admin/quality/metrics
     */
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getMetrics() {
        Map<String, Long> metrics = qualityAssessmentService.getAssessmentMetrics();
        return ResponseEntity.ok(ApiResponse.success("Quality assessment metrics retrieved successfully", metrics));
    }
}
