package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.CropPriceAnalyticsResponse;
import com.agriconnect.dto.MarketplacePriceSummaryResponse;
import com.agriconnect.dto.PriceHistoryResponse;
import com.agriconnect.service.PriceHistoryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Universal Price History & Analytics REST Controller accessible to all authenticated roles.
 */
@RestController
@RequestMapping("/api/price-history")
public class PriceHistoryController {

    private final PriceHistoryService priceHistoryService;

    public PriceHistoryController(PriceHistoryService priceHistoryService) {
        this.priceHistoryService = priceHistoryService;
    }

    /**
     * Retrieve pricing history records for a specific crop.
     */
    @GetMapping("/crop/{cropId}")
    public ResponseEntity<ApiResponse<List<PriceHistoryResponse>>> getCropPriceHistory(
            @PathVariable Integer cropId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<PriceHistoryResponse> records = priceHistoryService.getCropPriceHistory(cropId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Crop price history retrieved successfully", records));
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

    /**
     * Retrieve marketplace-wide price metrics and multi-crop breakdown.
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<MarketplacePriceSummaryResponse>> getMarketplaceSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        MarketplacePriceSummaryResponse summary = priceHistoryService.getMarketplaceSummary(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Marketplace price summary retrieved successfully", summary));
    }
}
