package com.agriconnect.controller;

import com.agriconnect.dto.HealthResponse;
import com.agriconnect.service.HealthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller exposing system health and readiness endpoints.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    /**
     * Endpoint to check backend and database health.
     * Accessible at: GET http://localhost:8080/api/health
     *
     * @return JSON response containing status, application name, phase, and DB status
     */
    @GetMapping("/health")
    public ResponseEntity<HealthResponse> getHealth() {
        HealthResponse response = healthService.getSystemHealth();
        return ResponseEntity.ok(response);
    }
}
