package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.CropResponse;
import com.agriconnect.service.CropService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller exposing standard agricultural crop catalog endpoints.
 */
@RestController
@RequestMapping("/api/crops")
public class CropController {

    private final CropService cropService;

    public CropController(CropService cropService) {
        this.cropService = cropService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CropResponse>>> getAllCrops() {
        List<CropResponse> crops = cropService.getAllCrops();
        return ResponseEntity.ok(ApiResponse.success("Crops retrieved successfully", crops));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CropResponse>> getCropById(@PathVariable Integer id) {
        CropResponse crop = cropService.getCropById(id);
        return ResponseEntity.ok(ApiResponse.success("Crop retrieved successfully", crop));
    }
}
