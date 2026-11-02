package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.OrderDecisionRequest;
import com.agriconnect.dto.OrderResponse;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing Order Management endpoints for authenticated Farmers (ROLE_FARMER).
 * Allows viewing incoming purchase orders for own harvests, inspecting order specifications,
 * accepting eligible pending orders, and rejecting orders with stock restoration.
 */
@RestController
@RequestMapping("/api/farmer/orders")
public class FarmerOrderController {

    private final OrderService orderService;

    public FarmerOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Retrieve all orders for harvests produced by the authenticated farmer.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyIncomingOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<OrderResponse> orders = orderService.getFarmerOrders(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Farmer incoming orders retrieved successfully", orders));
    }

    /**
     * Retrieve single order details, strictly enforcing farmer ownership of the harvest.
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer orderId) {
        OrderResponse order = orderService.getFarmerOrderById(userDetails.getUserId(), orderId);
        return ResponseEntity.ok(ApiResponse.success("Order details retrieved successfully", order));
    }

    /**
     * Accept an incoming PENDING order.
     */
    @PatchMapping("/{orderId}/accept")
    public ResponseEntity<ApiResponse<OrderResponse>> acceptOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer orderId) {
        OrderResponse response = orderService.acceptFarmerOrder(userDetails.getUserId(), orderId);
        return ResponseEntity.ok(ApiResponse.success("Order accepted successfully", response));
    }

    /**
     * Reject an incoming PENDING order.
     * Restores reserved harvest stock atomically.
     */
    @PatchMapping("/{orderId}/reject")
    public ResponseEntity<ApiResponse<OrderResponse>> rejectOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer orderId,
            @Valid @RequestBody(required = false) OrderDecisionRequest request) {
        OrderResponse response = orderService.rejectFarmerOrder(userDetails.getUserId(), orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order rejected successfully and harvest stock restored", response));
    }
}
