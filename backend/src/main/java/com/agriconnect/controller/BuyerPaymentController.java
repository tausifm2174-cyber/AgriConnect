package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.CreatePaymentRequest;
import com.agriconnect.dto.PaymentResponse;
import com.agriconnect.dto.PaymentSummaryDto;
import com.agriconnect.entity.Role;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing Payment Management endpoints for authenticated Commercial Buyers (ROLE_BUYER).
 * Allows initiating payment for orders, viewing own payment history, and tracking settlement summaries.
 */
@RestController
@RequestMapping("/api/buyer/payments")
public class BuyerPaymentController {

    private final PaymentService paymentService;

    public BuyerPaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Submit/record a payment for an eligible commercial purchase order.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreatePaymentRequest request) {
        PaymentResponse response = paymentService.createPayment(userDetails.getUserId(), Role.BUYER, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment recorded successfully", response));
    }

    /**
     * Retrieve all payments made by the authenticated buyer.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getMyPayments(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<PaymentResponse> payments = paymentService.getBuyerPayments(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Buyer payments retrieved successfully", payments));
    }

    /**
     * Retrieve specific payment details, strictly enforcing buyer ownership.
     */
    @GetMapping("/{paymentId}")
    public ResponseEntity<ApiResponse<PaymentResponse>> getPaymentById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer paymentId) {
        PaymentResponse payment = paymentService.getBuyerPaymentById(userDetails.getUserId(), paymentId);
        return ResponseEntity.ok(ApiResponse.success("Payment details retrieved successfully", payment));
    }

    /**
     * Retrieve financial balance and payment audit summary for a specific order.
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<ApiResponse<PaymentSummaryDto>> getOrderPaymentSummary(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer orderId) {
        PaymentSummaryDto summary = paymentService.getOrderPaymentSummary(userDetails.getUserId(), Role.BUYER, orderId);
        return ResponseEntity.ok(ApiResponse.success("Order payment summary retrieved successfully", summary));
    }
}
