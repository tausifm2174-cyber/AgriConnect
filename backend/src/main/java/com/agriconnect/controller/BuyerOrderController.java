package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.CreateOrderRequest;
import com.agriconnect.dto.OrderDecisionRequest;
import com.agriconnect.dto.OrderResponse;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing Order Management endpoints for authenticated Commercial Buyers (ROLE_BUYER).
 * Allows placing purchase orders against verified harvest lots, viewing own order history,
 * inspecting order details, and cancelling eligible pending orders.
 */
@RestController
@RequestMapping("/api/buyer/orders")
public class BuyerOrderController {

    private final OrderService orderService;

    public BuyerOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Place a new commercial purchase order.
     * Derives buyer identity strictly from the authenticated JWT principal.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = orderService.createOrder(userDetails.getUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Purchase order placed successfully", response));
    }

    /**
     * Retrieve all orders placed by the authenticated buyer.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<OrderResponse> orders = orderService.getBuyerOrders(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Buyer orders retrieved successfully", orders));
    }

    /**
     * Retrieve single order details, strictly enforcing buyer ownership.
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer orderId) {
        OrderResponse order = orderService.getBuyerOrderById(userDetails.getUserId(), orderId);
        return ResponseEntity.ok(ApiResponse.success("Order details retrieved successfully", order));
    }

    /**
     * Cancel an eligible PENDING order.
     * Restores reserved harvest stock atomically.
     */
    @PatchMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Integer orderId,
            @Valid @RequestBody(required = false) OrderDecisionRequest request) {
        OrderResponse response = orderService.cancelBuyerOrder(userDetails.getUserId(), orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully and harvest stock restored", response));
    }
}
