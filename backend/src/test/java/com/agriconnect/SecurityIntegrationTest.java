package com.agriconnect;

import com.agriconnect.dto.HealthResponse;
import com.agriconnect.security.CustomUserDetailsService;
import com.agriconnect.security.JwtTokenProvider;
import com.agriconnect.security.TokenBlacklistService;
import com.agriconnect.service.AuthService;
import com.agriconnect.service.HealthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc // Runs with all Spring Security filters active
class SecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HealthService healthService;

    @MockBean
    private AuthService authService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("Public GET /api/health should be accessible without credentials (Phase 1 compatibility)")
    void health_Public_ReturnsOk() throws Exception {
        when(healthService.getSystemHealth()).thenReturn(new HealthResponse(
                "UP", "AgriConnect", "Phase 3", "Connected (agriconnect_db)", LocalDateTime.now()
        ));

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("Unauthenticated access to /api/farmer/test returns 401 Unauthorized")
    void farmerTest_Unauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/farmer/test"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("Unauthenticated access to /api/buyer/test returns 401 Unauthorized")
    void buyerTest_Unauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/buyer/test"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Unauthenticated access to /api/admin/test returns 401 Unauthorized")
    void adminTest_Unauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/test"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("User with ROLE_FARMER can access /api/farmer/test (200 OK)")
    @WithMockUser(username = "farmer@kisan.in", roles = {"FARMER"})
    void farmerTest_WithFarmerRole_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/farmer/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.role").value("FARMER"))
                .andExpect(jsonPath("$.data.access").value("GRANTED"));
    }

    @Test
    @DisplayName("User with ROLE_FARMER is forbidden from /api/buyer/test (403 Forbidden)")
    @WithMockUser(username = "farmer@kisan.in", roles = {"FARMER"})
    void buyerTest_WithFarmerRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/buyer/test"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("User with ROLE_FARMER is forbidden from /api/admin/test (403 Forbidden)")
    @WithMockUser(username = "farmer@kisan.in", roles = {"FARMER"})
    void adminTest_WithFarmerRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/test"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("User with ROLE_BUYER can access /api/buyer/test (200 OK)")
    @WithMockUser(username = "buyer@agro.in", roles = {"BUYER"})
    void buyerTest_WithBuyerRole_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/buyer/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.role").value("BUYER"))
                .andExpect(jsonPath("$.data.access").value("GRANTED"));
    }

    @Test
    @DisplayName("User with ROLE_BUYER is forbidden from /api/farmer/test (403 Forbidden)")
    @WithMockUser(username = "buyer@agro.in", roles = {"BUYER"})
    void farmerTest_WithBuyerRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/api/farmer/test"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("User with ROLE_ADMIN can access /api/admin/test (200 OK)")
    @WithMockUser(username = "admin@agriconnect.org", roles = {"ADMIN"})
    void adminTest_WithAdminRole_ReturnsOk() throws Exception {
        mockMvc.perform(get("/api/admin/test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.role").value("ADMIN"))
                .andExpect(jsonPath("$.data.access").value("GRANTED"));
    }
}
