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
 * Role-protected test endpoint verifying BUYER role authorization.
 * Accessible only by authenticated users with ROLE_BUYER.
 */
@RestController
@RequestMapping("/api/buyer")
public class BuyerTestController {

    @GetMapping("/test")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getBuyerTest(@AuthenticationPrincipal UserDetails userDetails) {
        Map<String, Object> details = new HashMap<>();
        details.put("user", userDetails != null ? userDetails.getUsername() : "anonymous");
        details.put("role", "BUYER");
        details.put("access", "GRANTED");
        details.put("note", "Phase 3 role authorization verified. Buyer features will be built in Phase 6.");

        return ResponseEntity.ok(ApiResponse.success("Buyer endpoint accessed successfully.", details));
    }
}
