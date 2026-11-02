package com.agriconnect.controller;

import com.agriconnect.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Role-protected test endpoint verifying FARMER role authorization.
 * Accessible only by authenticated users with ROLE_FARMER.
 */
@RestController
@RequestMapping("/api/farmer")
public class FarmerTestController {

    @GetMapping("/test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFarmerTest(@AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> details = new HashMap<>();
        details.put("user", userDetails != null ? userDetails.getUsername() : "anonymous");
        details.put("role", "FARMER");
        details.put("access", "GRANTED");
        details.put("note", "Phase 3 role authorization verified. Farmer features will be built in Phase 4.");

        return ResponseEntity.ok(ApiResponse.success("Farmer endpoint accessed successfully.", details));
    }
}
