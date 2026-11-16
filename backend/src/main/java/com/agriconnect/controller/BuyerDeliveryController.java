package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.CreateDeliveryRequest;
import com.agriconnect.dto.DeliveryResponse;
import com.agriconnect.dto.UpdateDeliveryStatusRequest;
import com.agriconnect.entity.Role;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.DeliveryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing Delivery Management endpoints for authenticated Commercial Buyers (ROLE_BUYER).
 * Allows initiating delivery specification for orders, viewing own deliveries, and tracking status.
 */
@RestController
@RequestMapping("/api/buyer/deliveries")
public class BuyerDeliveryController {

    private final DeliveryService deliveryService;

    public BuyerDeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    /**
     * Create/schedule delivery specifications for an accepted order.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<DeliveryResponse>> createDelivery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateDeliveryRequest request) {
        DeliveryResponse response = deliveryService.createDelivery(userDetails.getUserId(), Role.BUYER, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Delivery created successfully", response));
    }

    /**
     * Retrieve all deliveries for the authenticated buyer's orders.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DeliveryResponse>>> getMyDeliveries(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<DeliveryResponse> deliveries = deliveryService.getBuyerDeliveries(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Buyer deliveries retrieved successfully", deliveries));
    }

    /**
     * Retrieve specific delivery details, strictly enforcing buyer ownership.
     */
    @GetMapping("/{deliveryId}")
    public ResponseEntity<ApiResponse<DeliveryResponse>> getDeliveryById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer deliveryId) {
        DeliveryResponse delivery = deliveryService.getBuyerDeliveryById(userDetails.getUserId(), deliveryId);
        return ResponseEntity.ok(ApiResponse.success("Delivery details retrieved successfully", delivery));
    }

    /**
     * Buyer confirms delivery receipt.
     */
    @PatchMapping("/{deliveryId}/confirm-received")
    public ResponseEntity<ApiResponse<DeliveryResponse>> confirmDeliveryReceipt(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer deliveryId,
            @RequestBody(required = false) UpdateDeliveryStatusRequest request) {
        DeliveryResponse response = deliveryService.markAsDelivered(userDetails.getUserId(), Role.BUYER, deliveryId, request);
        return ResponseEntity.ok(ApiResponse.success("Delivery receipt confirmed successfully", response));
    }
}
