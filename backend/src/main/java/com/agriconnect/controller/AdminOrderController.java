package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.OrderResponse;
import com.agriconnect.entity.OrderStatus;
import com.agriconnect.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing Order Monitoring endpoints for Administrators (ROLE_ADMIN).
 * Allows viewing marketplace orders, filtering by order lifecycle status,
 * and inspecting audit details.
 */
@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    /**
     * Retrieve all orders across the marketplace, with optional status filtering.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders(
            @RequestParam(value = "status", required = false) OrderStatus status) {
        List<OrderResponse> orders = orderService.getAllOrders(status);
        return ResponseEntity.ok(ApiResponse.success("Marketplace orders retrieved successfully", orders));
    }

    /**
     * Retrieve detailed order record by ID.
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Integer orderId) {
        OrderResponse order = orderService.getAdminOrderById(orderId);
        return ResponseEntity.ok(ApiResponse.success("Order audit record retrieved successfully", order));
    }
}
