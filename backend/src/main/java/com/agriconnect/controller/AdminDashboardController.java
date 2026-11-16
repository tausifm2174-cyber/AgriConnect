package com.agriconnect.controller;

import com.agriconnect.dto.AdminDashboardResponse;
import com.agriconnect.dto.ApiResponse;
import com.agriconnect.dto.RecentActivityResponse;
import com.agriconnect.service.AdminDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller providing platform-level metrics, analytical summaries,
 * and recent marketplace activities for administrators (Phase 12).
 * Protected by Spring Security: Accessible only by users holding the ADMIN role.
 */
@RestController
@RequestMapping("/api/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    /**
     * Get platform-wide statistical aggregates and KPIs.
     * GET /api/admin/dashboard
     */
    @GetMapping
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getDashboardStats() {
        AdminDashboardResponse stats = adminDashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Admin dashboard statistics retrieved successfully", stats));
    }

    /**
     * Get recent marketplace activity feed across all entities.
     * GET /api/admin/dashboard/recent-activity?limit=15
     */
    @GetMapping("/recent-activity")
    public ResponseEntity<ApiResponse<List<RecentActivityResponse>>> getRecentActivity(
            @RequestParam(name = "limit", defaultValue = "15") int limit) {
        List<RecentActivityResponse> activities = adminDashboardService.getRecentActivities(limit);
        return ResponseEntity.ok(ApiResponse.success("Recent marketplace activities retrieved successfully", activities));
    }
}
