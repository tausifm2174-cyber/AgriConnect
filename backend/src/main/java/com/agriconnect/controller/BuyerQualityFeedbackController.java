package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.BuyerQualityFeedbackResponse;
import com.agriconnect.dto.QualityAuditTimelineItem;
import com.agriconnect.dto.SubmitBuyerFeedbackRequest;
import com.agriconnect.entity.QualityAssessment;
import com.agriconnect.repository.OrderRepository;
import com.agriconnect.repository.QualityAssessmentRepository;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.QualityAssessmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

/**
 * Controller exposing Quality Feedback and Audit endpoints for authenticated Buyers (ROLE_BUYER).
 */
@RestController
@RequestMapping("/api/buyer/orders")
public class BuyerQualityFeedbackController {

    private final QualityAssessmentService qualityAssessmentService;
    private final OrderRepository orderRepository;
    private final QualityAssessmentRepository qualityAssessmentRepository;

    public BuyerQualityFeedbackController(QualityAssessmentService qualityAssessmentService,
                                         OrderRepository orderRepository,
                                         QualityAssessmentRepository qualityAssessmentRepository) {
        this.qualityAssessmentService = qualityAssessmentService;
        this.orderRepository = orderRepository;
        this.qualityAssessmentRepository = qualityAssessmentRepository;
    }

    /**
     * Submit quality feedback or report an issue on a delivered order.
     * POST /api/buyer/orders/{orderId}/feedback
     */
    @PostMapping("/{orderId}/feedback")
    public ResponseEntity<ApiResponse<BuyerQualityFeedbackResponse>> submitFeedback(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer orderId,
            @Valid @RequestBody SubmitBuyerFeedbackRequest request) {
        BuyerQualityFeedbackResponse response = qualityAssessmentService.submitBuyerFeedback(
                userDetails.getUserId(), orderId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse<>(201, "Quality feedback submitted successfully", response));
    }

    /**
     * Get quality feedback submitted for a specific order.
     * GET /api/buyer/orders/{orderId}/feedback
     */
    @GetMapping("/{orderId}/feedback")
    public ResponseEntity<ApiResponse<BuyerQualityFeedbackResponse>> getFeedback(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer orderId) {
        BuyerQualityFeedbackResponse response = qualityAssessmentService.getFeedbackByOrderId(
                orderId, userDetails.getUserId(), false).orElse(null);
        return ResponseEntity.ok(ApiResponse.success("Order quality feedback retrieved", response));
    }

    /**
     * Get quality audit history for the harvest lot associated with an order.
     * GET /api/buyer/orders/{orderId}/audit-history
     */
    @GetMapping("/{orderId}/audit-history")
    public ResponseEntity<ApiResponse<List<QualityAuditTimelineItem>>> getOrderQualityAuditHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer orderId) {
        return orderRepository.findById(orderId)
                .map(order -> {
                    if (!order.getBuyer().getUserId().equals(userDetails.getUserId())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(ApiResponse.<List<QualityAuditTimelineItem>>error(403, "Access denied"));
                    }
                    QualityAssessment qa = qualityAssessmentRepository
                            .findByHarvest_HarvestId(order.getHarvest().getHarvestId()).orElse(null);
                    if (qa == null) {
                        return ResponseEntity.ok(ApiResponse.success("No assessment found", Collections.<QualityAuditTimelineItem>emptyList()));
                    }
                    List<QualityAuditTimelineItem> history = qualityAssessmentService.getAuditHistory(qa.getAssessmentId());
                    return ResponseEntity.ok(ApiResponse.success("Audit history retrieved successfully", history));
                })
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error(404, "Order not found with ID: " + orderId)));
    }
}
