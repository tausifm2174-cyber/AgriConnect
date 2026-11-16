package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.CropPriceAnalyticsResponse;
import com.agriconnect.dto.PriceHistoryResponse;
import com.agriconnect.service.PriceHistoryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller exposing Market Pricing and Analytics endpoints for authenticated Buyers (ROLE_BUYER).
 * Provides commercial market intelligence, APMC mandi rates, and crop price trends.
 */
@RestController
@RequestMapping("/api/buyer/price-history")
public class BuyerPriceHistoryController {

    private final PriceHistoryService priceHistoryService;

    public BuyerPriceHistoryController(PriceHistoryService priceHistoryService) {
        this.priceHistoryService = priceHistoryService;
    }

    /**
     * Retrieve market price history with optional crop and date range filters.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PriceHistoryResponse>>> getPriceHistory(
            @RequestParam(required = false) Integer cropId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<PriceHistoryResponse> history = priceHistoryService.getBuyerPriceHistory(cropId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Market price history retrieved successfully", history));
    }

    /**
     * Retrieve aggregated pricing analytics (AVG, MIN, MAX, Volume, Trend) for a specific crop.
     */
    @GetMapping("/analytics/{cropId}")
    public ResponseEntity<ApiResponse<CropPriceAnalyticsResponse>> getCropAnalytics(
            @PathVariable Integer cropId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        CropPriceAnalyticsResponse analytics = priceHistoryService.getCropAnalytics(cropId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Crop price analytics retrieved successfully", analytics));
    }
}
