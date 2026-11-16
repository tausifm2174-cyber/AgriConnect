package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.PaymentResponse;
import com.agriconnect.dto.PaymentSummaryDto;
import com.agriconnect.dto.UpdatePaymentStatusRequest;
import com.agriconnect.entity.PaymentMethod;
import com.agriconnect.entity.PaymentStatus;
import com.agriconnect.entity.Role;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing Payment Financial Audit endpoints for Administrators (ROLE_ADMIN).
 * Allows global visibility, status updates/refunds, and financial reconciliation.
 */
@RestController
@RequestMapping("/api/admin/payments")
public class AdminPaymentController {

    private final PaymentService paymentService;

    public AdminPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Retrieve all payments across the marketplace with optional status and method filters.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getAllPayments(
            @RequestParam(value = "status", required = false) PaymentStatus status,
            @RequestParam(value = "method", required = false) PaymentMethod method) {
        List<PaymentResponse> payments = paymentService.getAllPayments(status, method);
        return ResponseEntity.ok(ApiResponse.success("Marketplace payments retrieved successfully", payments));
    }

    /**
     * Retrieve single payment audit record by ID.
     */
    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(@PathVariable Integer paymentId) {
        PaymentResponse payment = paymentService.getAdminPaymentById(paymentId);
        return ResponseEntity.ok(ApiResponse.success("Payment audit record retrieved successfully", payment));
    }

    /**
     * Administrative payment status transition (e.g. COMPLETED -> REFUNDED, PENDING -> COMPLETED).
     */
    @PatchMapping("/{paymentId}/status")
    public ResponseEntity<ApiResponse<PaymentResponse>> updatePaymentStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer paymentId,
            @RequestParam(value = "status", required = false) PaymentStatus statusParam,
            @Valid @RequestBody(required = false) UpdatePaymentStatusRequest request) {

        UpdatePaymentStatusRequest effectiveRequest = request != null ? request : new UpdatePaymentStatusRequest();
        if (statusParam != null) {
            effectiveRequest.setPaymentStatus(statusParam);
        }

        PaymentResponse response = paymentService.updatePaymentStatus(
                userDetails != null ? userDetails.getUserId() : 1,
                Role.ADMIN,
                paymentId,
                effectiveRequest
        );
        return ResponseEntity.ok(ApiResponse.success("Payment status updated successfully", response));
    }

    /**
     * Retrieve order financial settlement summary.
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<PaymentSummaryDto>> getOrderPaymentSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer orderId) {
        PaymentSummaryDto summary = paymentService.getOrderPaymentSummary(
                userDetails != null ? userDetails.getUserId() : 1,
                Role.ADMIN,
                orderId
        );
        return ResponseEntity.ok(ApiResponse.success("Order payment summary retrieved successfully", summary));
    }
}
