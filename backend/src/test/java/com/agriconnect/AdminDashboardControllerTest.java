package com.agriconnect;

import com.agriconnect.controller.AdminDashboardController;
import com.agriconnect.controller.AdminQualityController;
import com.agriconnect.dto.AdminDashboardResponse;
import com.agriconnect.dto.QualityAssessmentResponse;
import com.agriconnect.dto.RecentActivityResponse;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.entity.UserStatus;
import com.agriconnect.exception.GlobalExceptionHandler;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.security.JwtTokenProvider;
import com.agriconnect.service.AdminDashboardService;
import com.agriconnect.service.QualityAssessmentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AdminDashboardController.class, AdminQualityController.class})
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AdminDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminDashboardService adminDashboardService;

    @MockBean
    private QualityAssessmentService qualityAssessmentService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.agriconnect.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    private User adminUser;

    @BeforeEach
    void setUp() {
        adminUser = new User("System Admin", "admin@agriconnect.com", "9999999999", "secret", Role.ADMIN, UserStatus.ACTIVE);
        adminUser.setUserId(1);

        CustomUserDetails userDetails = new CustomUserDetails(adminUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("GET /api/admin/dashboard: Returns 200 with aggregated dashboard metrics")
    void testGetDashboardStats() throws Exception {
        AdminDashboardResponse response = new AdminDashboardResponse();
        AdminDashboardResponse.UserStats uStats = new AdminDashboardResponse.UserStats();
        uStats.setTotalUsers(25L);
        response.setUserStats(uStats);

        AdminDashboardResponse.OrderStats oStats = new AdminDashboardResponse.OrderStats();
        oStats.setTotalOrders(50L);
        oStats.setTotalOrderAmount(new BigDecimal("250000.00"));
        response.setOrderStats(oStats);

        when(adminDashboardService.getDashboardStats()).thenReturn(response);

        mockMvc.perform(get("/api/admin/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.userStats.totalUsers").value(25))
                .andExpect(jsonPath("$.data.orderStats.totalOrders").value(50));
    }

    @Test
    @DisplayName("GET /api/admin/dashboard/recent-activity: Returns 200 with recent activities")
    void testGetRecentActivity() throws Exception {
        RecentActivityResponse activity = new RecentActivityResponse("ORDER", "Order #1 placed", 1, "Alice", LocalDateTime.now(), "CONFIRMED");
        when(adminDashboardService.getRecentActivities(anyInt())).thenReturn(List.of(activity));

        mockMvc.perform(get("/api/admin/dashboard/recent-activity?limit=10")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].activityType").value("ORDER"))
                .andExpect(jsonPath("$.data[0].actorName").value("Alice"));
    }

    @Test
    @DisplayName("GET /api/admin/quality: Returns 200 with all quality assessments")
    void testGetAllQualityAssessments() throws Exception {
        when(qualityAssessmentService.getAllAssessments()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/quality")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }
}
