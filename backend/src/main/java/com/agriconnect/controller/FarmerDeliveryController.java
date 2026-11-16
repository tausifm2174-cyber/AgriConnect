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
 * REST Controller exposing Delivery Management endpoints for authenticated Farmers (ROLE_FARMER).
 * Allows creating dispatch records, viewing outgoing deliveries, shipping lots, and completing delivery.
 */
@RestController
@RequestMapping("/api/farmer/deliveries")
public class FarmerDeliveryController {

    private final DeliveryService deliveryService;

    public FarmerDeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    /**
     * Create delivery record for farmer's accepted order.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<DeliveryResponse>> createDelivery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateDeliveryRequest request) {
        DeliveryResponse response = deliveryService.createDelivery(userDetails.getUserId(), Role.FARMER, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Delivery record created successfully", response));
    }

    /**
     * Retrieve all deliveries for harvests produced by the authenticated farmer.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DeliveryResponse>>> getMyDeliveries(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<DeliveryResponse> deliveries = deliveryService.getFarmerDeliveries(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Farmer deliveries retrieved successfully", deliveries));
    }

    /**
     * Retrieve single delivery details, strictly enforcing farmer ownership.
     */
    @GetMapping("/{deliveryId}")
    public ResponseEntity<ApiResponse<DeliveryResponse>> getDeliveryById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer deliveryId) {
        DeliveryResponse delivery = deliveryService.getFarmerDeliveryById(userDetails.getUserId(), deliveryId);
        return ResponseEntity.ok(ApiResponse.success("Delivery details retrieved successfully", delivery));
    }

    /**
     * Mark delivery as SHIPPED. Atomically transitions Order to SHIPPED.
     */
    @PatchMapping("/{deliveryId}/ship")
    public ResponseEntity<ApiResponse<DeliveryResponse>> shipDelivery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer deliveryId,
            @Valid @RequestBody(required = false) UpdateDeliveryStatusRequest request) {
        DeliveryResponse response = deliveryService.shipDelivery(userDetails.getUserId(), deliveryId, request);
        return ResponseEntity.ok(ApiResponse.success("Delivery and order successfully marked as SHIPPED", response));
    }

    /**
     * Mark delivery as DELIVERED. Atomically transitions Order to DELIVERED.
     */
    @PatchMapping("/{deliveryId}/deliver")
    public ResponseEntity<ApiResponse<DeliveryResponse>> completeDelivery(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer deliveryId,
            @Valid @RequestBody(required = false) UpdateDeliveryStatusRequest request) {
        DeliveryResponse response = deliveryService.markAsDelivered(userDetails.getUserId(), Role.FARMER, deliveryId, request);
        return ResponseEntity.ok(ApiResponse.success("Delivery and order successfully completed as DELIVERED", response));
    }
}
