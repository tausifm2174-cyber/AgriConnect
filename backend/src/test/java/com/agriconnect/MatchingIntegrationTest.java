package com.agriconnect;

import com.agriconnect.dto.CreateBuyerRequirementRequest;
import com.agriconnect.entity.QualityGrade;
import com.agriconnect.entity.RequirementStatus;
import com.agriconnect.entity.User;
import com.agriconnect.repository.BuyerRequirementRepository;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class MatchingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BuyerRequirementRepository requirementRepository;

    private String buyer5Token; // Vikas Gupta (owns requirement 1)
    private String buyer6Token; // Priya Nair (owns requirement 2)
    private String farmer2Token; // Rajesh Patel (owns harvest 1)
    private String adminToken; // Admin user

    @BeforeEach
    void setUp() {
        User buyer5 = userRepository.findById(5).orElseThrow();
        User buyer6 = userRepository.findById(6).orElseThrow();
        User farmer2 = userRepository.findById(2).orElseThrow();
        User admin1 = userRepository.findById(1).orElseThrow();

        buyer5Token = "Bearer " + jwtTokenProvider.generateToken(buyer5);
        buyer6Token = "Bearer " + jwtTokenProvider.generateToken(buyer6);
        farmer2Token = "Bearer " + jwtTokenProvider.generateToken(farmer2);
        adminToken = "Bearer " + jwtTokenProvider.generateToken(admin1);
    }

    @Test
    @DisplayName("Integration: Buyer successfully retrieves matching harvests for own open requirement (200 OK)")
    void testBuyerGetsMatchesForRequirement_Success() throws Exception {
        // Requirement 1: Buyer 5, Tomato, 400kg, max 27.00, Grade A, OPEN
        // Harvest 1: Farmer 2, Tomato, 550kg available, 26.00/kg, Grade A, VERIFIED

        // Ensure requirement 1 has OPEN status and a future required-by date
        // so the production expiration logic does not reject it
        requirementRepository.findById(1).ifPresent(req -> {
            req.setStatus(RequirementStatus.OPEN);
            req.setRequiredByDate(LocalDate.now().plusDays(30));
            requirementRepository.save(req);
        });

        mockMvc.perform(get("/api/buyer/requirements/1/matches")
                        .header("Authorization", buyer5Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.requirementId").value(1))
                .andExpect(jsonPath("$.data.cropName").value(containsString("Tomato")))
                .andExpect(jsonPath("$.data.totalMatches").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.matches[0].harvestId").value(1))
                .andExpect(jsonPath("$.data.matches[0].farmerName").value("Rajesh Patel"))
                .andExpect(jsonPath("$.data.matches[0].qualityGrade").value("A"))
                .andExpect(jsonPath("$.data.matches[0].qualityVerificationStatus").value("VERIFIED"))
                .andExpect(jsonPath("$.data.matches[0].matchScore").value(greaterThan(0.0)))
                .andExpect(jsonPath("$.data.matches[0].matchScore").value(lessThanOrEqualTo(100.0)))
                .andExpect(jsonPath("$.data.matches[0].priceScore").value(greaterThan(0.0)))
                .andExpect(jsonPath("$.data.matches[0].qualityScoreComponent").value(greaterThan(0.0)))
                .andExpect(jsonPath("$.data.matches[0].freshness").value(9))
                .andExpect(jsonPath("$.data.matches[0].appearance").value(9))
                .andExpect(jsonPath("$.data.matches[0].size").value(8))
                .andExpect(jsonPath("$.data.matches[0].color").value(9))
                .andExpect(jsonPath("$.data.matches[0].ripeness").value(8))
                .andExpect(jsonPath("$.data.matches[0].damagePercentage").value(3.50));
    }

    @Test
    @DisplayName("Integration: Cross-buyer access forbidden (403 Forbidden)")
    void testCrossBuyerAccess_Forbidden() throws Exception {
        // Buyer 6 attempting to view matches for Requirement 1 (owned by Buyer 5)
        mockMvc.perform(get("/api/buyer/requirements/1/matches")
                        .header("Authorization", buyer6Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Integration: Farmer role forbidden from matching endpoint (403 Forbidden)")
    void testFarmerRoleAccess_Forbidden() throws Exception {
        mockMvc.perform(get("/api/buyer/requirements/1/matches")
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Integration: Unauthenticated request rejected (401 Unauthorized)")
    void testUnauthenticated_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/buyer/requirements/1/matches")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Integration: Cancelled requirement returns 400 Bad Request")
    void testCancelledRequirement_BadRequest() throws Exception {
        // Requirement 8 is CANCELLED in database
        mockMvc.perform(get("/api/buyer/requirements/8/matches")
                        .header("Authorization", buyer5Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("CANCELLED")));
    }

    @Test
    @DisplayName("Integration: Non-existent requirement returns 404 Not Found")
    void testNonExistentRequirement_NotFound() throws Exception {
        mockMvc.perform(get("/api/buyer/requirements/99999/matches")
                        .header("Authorization", buyer5Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Integration: Requirement with no matching harvests returns 200 OK with totalMatches 0")
    void testRequirementNoMatches_Returns200WithEmptyMatches() throws Exception {
        // Requirement 9: Mango (Crop 5), Qty 950 kg, Max Price 78.00/kg, Min Grade A
        // Harvest 6: Mango, 500 kg available (< 950 kg), price 180.00/kg (> 78.00), Grade B (PENDING)
        // Hard filters will reject it -> 0 matches
        mockMvc.perform(get("/api/buyer/requirements/9/matches")
                        .header("Authorization", buyer5Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.requirementId").value(9))
                .andExpect(jsonPath("$.data.totalMatches").value(0))
                .andExpect(jsonPath("$.data.matches").isArray())
                .andExpect(jsonPath("$.data.matches").isEmpty());
    }

    @Test
    @DisplayName("Integration: Expired requirement returns 400 Bad Request and persists EXPIRED status")
    void testExpiredRequirement_BadRequest() throws Exception {
        // Update requirement 4 with a past date to test on-the-fly expiration check
        requirementRepository.findById(4).ifPresent(req -> {
            req.setRequiredByDate(LocalDate.now().minusDays(3));
            req.setStatus(RequirementStatus.OPEN);
            requirementRepository.save(req);
        });

        mockMvc.perform(get("/api/buyer/requirements/4/matches")
                        .header("Authorization", buyer5Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("EXPIRED")));
    }
}
