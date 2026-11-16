package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.PaymentResponse;
import com.agriconnect.dto.PaymentSummaryDto;
import com.agriconnect.entity.Role;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.PaymentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing Payment Monitoring endpoints for authenticated Farmers (ROLE_FARMER).
 * Allows viewing settlement receipts and payment history for their sold produce orders.
 */
@RestController
@RequestMapping("/api/farmer/payments")
public class FarmerPaymentController {

    private final PaymentService paymentService;

    public FarmerPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Retrieve all payment records for harvests produced by the authenticated farmer.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<PaymentResponse> payments = paymentService.getFarmerPayments(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Farmer payments retrieved successfully", payments));
    }

    /**
     * Retrieve single payment details, strictly enforcing farmer produce ownership.
     */
    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer paymentId) {
        PaymentResponse payment = paymentService.getFarmerPaymentById(userDetails.getUserId(), paymentId);
        return ResponseEntity.ok(ApiResponse.success("Payment details retrieved successfully", payment));
    }

    /**
     * Retrieve financial balance and payment audit summary for a specific farmer order.
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<PaymentSummaryDto>> getOrderPaymentSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer orderId) {
        PaymentSummaryDto summary = paymentService.getOrderPaymentSummary(userDetails.getUserId(), Role.FARMER, orderId);
        return ResponseEntity.ok(ApiResponse.success("Order payment summary retrieved successfully", summary));
    }
}
