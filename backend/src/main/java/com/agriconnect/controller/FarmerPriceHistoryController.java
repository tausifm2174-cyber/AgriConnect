package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.PriceHistoryResponse;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.service.PriceHistoryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller exposing Price History endpoints for authenticated Farmers (ROLE_FARMER).
 * Allows viewing historical sales realizations and pricing trends for produce sold by the farmer.
 */
@RestController
@RequestMapping("/api/farmer/price-history")
public class FarmerPriceHistoryController {

    private final PriceHistoryService priceHistoryService;

    public FarmerPriceHistoryController(PriceHistoryService priceHistoryService) {
        this.priceHistoryService = priceHistoryService;
    }

    /**
     * Retrieve historical sales records for the authenticated farmer with optional crop and date filtering.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PriceHistoryResponse>>> getMyPriceHistory(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer cropId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<PriceHistoryResponse> history = priceHistoryService.getFarmerPriceHistory(
                userDetails.getUserId(), cropId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Farmer price history retrieved successfully", history));
    }
}
