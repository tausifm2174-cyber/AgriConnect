package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.DeliveryResponse;
import com.agriconnect.dto.UpdateDeliveryStatusRequest;
import com.agriconnect.entity.DeliveryStatus;
import com.agriconnect.service.DeliveryService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing Delivery Monitoring endpoints for Administrators (ROLE_ADMIN).
 * Allows global visibility of deliveries, lifecycle monitoring, and status management.
 */
@RestController
@RequestMapping("/api/admin/deliveries")
public class AdminDeliveryController {

    private final DeliveryService deliveryService;

    public AdminDeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    /**
     * Retrieve all deliveries across the marketplace, with optional status filtering.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DeliveryResponse>>> getAllDeliveries(
            @RequestParam(value = "status", required = false) DeliveryStatus status) {
        List<DeliveryResponse> deliveries = deliveryService.getAllDeliveries(status);
        return ResponseEntity.ok(ApiResponse.success("Marketplace deliveries retrieved successfully", deliveries));
    }

    /**
     * Retrieve single delivery audit record by ID.
     */
    @GetMapping("/{deliveryId}")
    public ResponseEntity<ApiResponse<DeliveryResponse>> getDeliveryById(@PathVariable Integer deliveryId) {
        DeliveryResponse delivery = deliveryService.getAdminDeliveryById(deliveryId);
        return ResponseEntity.ok(ApiResponse.success("Delivery audit record retrieved successfully", delivery));
    }

    /**
     * Administrative status update with synchronized order status.
     */
    @PatchMapping("/{deliveryId}/status")
    public ResponseEntity<ApiResponse<DeliveryResponse>> updateStatus(
            @PathVariable Integer deliveryId,
            @RequestParam(value = "status") DeliveryStatus status,
            @Valid @RequestBody(required = false) UpdateDeliveryStatusRequest request) {
        DeliveryResponse response = deliveryService.updateDeliveryStatusByAdmin(deliveryId, status, request);
        return ResponseEntity.ok(ApiResponse.success("Delivery status updated successfully", response));
    }
}
