package com.agriconnect;

import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminDashboardIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    private String adminToken;
    private String farmerToken;
    private String buyerToken;

    @BeforeEach
    void setUp() {
        User admin = userRepository.findById(1).orElseThrow();
        User farmer = userRepository.findById(2).orElseThrow();
        User buyer = userRepository.findById(5).orElseThrow();

        adminToken = "Bearer " + jwtTokenProvider.generateToken(admin);
        farmerToken = "Bearer " + jwtTokenProvider.generateToken(farmer);
        buyerToken = "Bearer " + jwtTokenProvider.generateToken(buyer);
    }

    @Test
    @DisplayName("Admin: GET /api/admin/dashboard returns 200 with platform statistics")
    void testGetDashboardStatsAsAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.userStats.totalUsers").isNumber())
                .andExpect(jsonPath("$.data.orderStats.totalOrders").isNumber())
                .andExpect(jsonPath("$.data.deliveryStats.totalDeliveries").isNumber())
                .andExpect(jsonPath("$.data.paymentStats.totalPayments").isNumber())
                .andExpect(jsonPath("$.data.priceHistoryStats.totalRecords").isNumber());
    }

    @Test
    @DisplayName("Admin: GET /api/admin/dashboard/recent-activity returns 200 with activity list")
    void testGetRecentActivityAsAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/recent-activity?limit=10")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("Admin: GET /api/admin/users returns 200 and filters by role")
    void testGetUsersAsAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users?role=FARMER")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].role").value("FARMER"));
    }

    @Test
    @DisplayName("Admin: GET /api/admin/users/{id} returns 200 with user details")
    void testGetUserByIdAsAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/users/1")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.userId").value(1))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    @DisplayName("Admin: GET /api/admin/quality returns 200 with all assessments")
    void testGetQualityAssessmentsAsAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    @DisplayName("Security: Buyer role receives 403 Forbidden on /api/admin/dashboard")
    void testBuyerAccessForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", buyerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Farmer role receives 403 Forbidden on /api/admin/users")
    void testFarmerAccessForbidden() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", farmerToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security: Unauthenticated request receives 401 Unauthorized on /api/admin/dashboard")
    void testUnauthenticatedAccessUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
