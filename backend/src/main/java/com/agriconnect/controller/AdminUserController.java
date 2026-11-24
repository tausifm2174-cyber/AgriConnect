package com.agriconnect.controller;

import com.agriconnect.dto.AdminUserResponse;
import com.agriconnect.dto.ApiResponse;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.UserStatus;
import com.agriconnect.service.AdminUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller providing user management and inspection capabilities for administrators (Phase 12).
 * Protected by Spring Security: Accessible only by users holding the ADMIN role.
 * Sanitized: Never exposes password hashes or security credentials.
 */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    /**
     * Search and list platform users with optional filters.
     * GET /api/admin/users?role=FARMER&status=ACTIVE&search=John
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminUserResponse>>> getUsers(
            @RequestParam(name = "role", required = false) Role role,
            @RequestParam(name = "status", required = false) UserStatus status,
            @RequestParam(name = "search", required = false) String search) {
        List<AdminUserResponse> users = adminUserService.getUsers(role, status, search);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    /**
     * Get detailed user information including profile specialization by ID.
     * GET /api/admin/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getUserById(@PathVariable("id") Integer id) {
        AdminUserResponse user = adminUserService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User details retrieved successfully", user));
    }

    /**
     * Update user account status (e.g. ACTIVE -> INACTIVE or SUSPENDED).
     * PATCH /api/admin/users/{id}/status?status=INACTIVE
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable("id") Integer id,
            @RequestParam(name = "status") UserStatus status) {
        AdminUserResponse response = adminUserService.updateUserStatus(id, status);
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", response));
    }
}
