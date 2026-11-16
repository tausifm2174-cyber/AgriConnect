package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.MarketplacePriceSummaryResponse;
import com.agriconnect.dto.PriceHistoryResponse;
import com.agriconnect.entity.PriceSourceType;
import com.agriconnect.service.PriceHistoryService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST Controller exposing Platform-wide Price History & Macro Analytics for Administrators (ROLE_ADMIN).
 */
@RestController
@RequestMapping("/api/admin/price-history")
public class AdminPriceHistoryController {

    private final PriceHistoryService priceHistoryService;

    public AdminPriceHistoryController(PriceHistoryService priceHistoryService) {
        this.priceHistoryService = priceHistoryService;
    }

    /**
     * Retrieve all historical price records with comprehensive filters (crop, source type, date range).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PriceHistoryResponse>>> getAllPriceHistory(
            @RequestParam(required = false) Integer cropId,
            @RequestParam(required = false) PriceSourceType sourceType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<PriceHistoryResponse> history = priceHistoryService.getAllPriceHistory(cropId, sourceType, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("All price history records retrieved successfully", history));
    }

    /**
     * Retrieve overall marketplace pricing summary and per-crop performance metrics.
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<MarketplacePriceSummaryResponse>> getMarketplaceSummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        MarketplacePriceSummaryResponse summary = priceHistoryService.getMarketplaceSummary(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Marketplace price summary retrieved successfully", summary));
    }
}
