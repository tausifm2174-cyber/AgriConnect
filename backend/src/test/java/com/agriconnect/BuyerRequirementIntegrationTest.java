package com.agriconnect;

import com.agriconnect.dto.CreateBuyerRequirementRequest;
import com.agriconnect.dto.UpdateBuyerRequirementRequest;
import com.agriconnect.entity.QualityGrade;
import com.agriconnect.entity.RequirementStatus;
import com.agriconnect.entity.User;
import com.agriconnect.repository.BuyerRequirementRepository;
import com.agriconnect.repository.CropRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BuyerRequirementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private BuyerRequirementRepository requirementRepository;

    private String buyer5Token; // Vikas Gupta
    private String buyer6Token; // Priya Sharma
    private String farmer2Token; // Rajesh Patel

    @BeforeEach
    void setUp() {
        User buyer5 = userRepository.findById(5).orElseThrow();
        User buyer6 = userRepository.findById(6).orElseThrow();
        User farmer2 = userRepository.findById(2).orElseThrow();

        buyer5Token = "Bearer " + jwtTokenProvider.generateToken(buyer5);
        buyer6Token = "Bearer " + jwtTokenProvider.generateToken(buyer6);
        farmer2Token = "Bearer " + jwtTokenProvider.generateToken(farmer2);
    }

    @Test
    @DisplayName("Buyer: Successfully create crop requirement (201 Created)")
    void testBuyerCreatesRequirement_Success() throws Exception {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                1, // Tomato
                new BigDecimal("500.00"),
                new BigDecimal("28.50"),
                QualityGrade.A,
                "Nashik Mandi, Maharashtra",
                LocalDate.now().plusDays(14)
        );

        mockMvc.perform(post("/api/buyer/requirements")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is(200)))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.data.cropId", is(1)))
                .andExpect(jsonPath("$.data.cropName", is("Tomato (Hybrid Red)")))
                .andExpect(jsonPath("$.data.requiredQuantity", is(500.0)))
                .andExpect(jsonPath("$.data.maxPricePerKg", is(28.50)))
                .andExpect(jsonPath("$.data.minQualityGrade", is("A")))
                .andExpect(jsonPath("$.data.status", is("OPEN")))
                .andExpect(jsonPath("$.data.buyerId", is(5)));
    }

    @Test
    @DisplayName("Buyer: Retrieve own requirements list (200 OK)")
    void testGetMyRequirements_Success() throws Exception {
        mockMvc.perform(get("/api/buyer/requirements")
                        .header("Authorization", buyer5Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is(200)))
                .andExpect(jsonPath("$.data", not(empty())))
                .andExpect(jsonPath("$.data[0].buyerId", is(5)));
    }

    @Test
    @DisplayName("Buyer: Retrieve single owned requirement by ID (200 OK)")
    void testGetSingleRequirement_Success() throws Exception {
        // Requirement 1 in sample data belongs to buyer 5
        mockMvc.perform(get("/api/buyer/requirements/1")
                        .header("Authorization", buyer5Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is(200)))
                .andExpect(jsonPath("$.data.requirementId", is(1)))
                .andExpect(jsonPath("$.data.buyerId", is(5)))
                .andExpect(jsonPath("$.data.cropName", notNullValue()));
    }

    @Test
    @DisplayName("Buyer: Update owned requirement (200 OK)")
    void testUpdateRequirement_Success() throws Exception {
        UpdateBuyerRequirementRequest request = new UpdateBuyerRequirementRequest(
                1,
                new BigDecimal("600.00"),
                new BigDecimal("29.00"),
                QualityGrade.B,
                "Pune Market Yard",
                LocalDate.now().plusDays(20)
        );

        mockMvc.perform(put("/api/buyer/requirements/1")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is(200)))
                .andExpect(jsonPath("$.data.requiredQuantity", is(600.0)))
                .andExpect(jsonPath("$.data.maxPricePerKg", is(29.00)))
                .andExpect(jsonPath("$.data.minQualityGrade", is("B")))
                .andExpect(jsonPath("$.data.preferredLocation", is("Pune Market Yard")));
    }

    @Test
    @DisplayName("Buyer: Cancel open requirement (200 OK)")
    void testCancelRequirement_Success() throws Exception {
        mockMvc.perform(put("/api/buyer/requirements/1/cancel")
                        .header("Authorization", buyer5Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is(200)))
                .andExpect(jsonPath("$.data.status", is("CANCELLED")));
    }

    @Test
    @DisplayName("Buyer: Get dashboard summary metrics (200 OK)")
    void testGetMetrics_Success() throws Exception {
        mockMvc.perform(get("/api/buyer/requirements/metrics")
                        .header("Authorization", buyer5Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is(200)))
                .andExpect(jsonPath("$.data.totalRequirements", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.openRequirements", greaterThanOrEqualTo(0)));
    }

    @Test
    @DisplayName("Cross-Owner Security: Buyer 6 cannot access Buyer 5's requirement (403 Forbidden)")
    void testCrossOwner_Get_ThrowsForbidden() throws Exception {
        // Requirement 1 belongs to buyer 5. Buyer 6 attempts to access it.
        mockMvc.perform(get("/api/buyer/requirements/1")
                        .header("Authorization", buyer6Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", containsString("Access denied")));
    }

    @Test
    @DisplayName("Cross-Owner Security: Buyer 6 cannot update Buyer 5's requirement (403 Forbidden)")
    void testCrossOwner_Update_ThrowsForbidden() throws Exception {
        UpdateBuyerRequirementRequest request = new UpdateBuyerRequirementRequest(
                1, new BigDecimal("600.00"), new BigDecimal("29.00"),
                QualityGrade.B, "Pune", LocalDate.now().plusDays(20)
        );

        mockMvc.perform(put("/api/buyer/requirements/1")
                        .header("Authorization", buyer6Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", containsString("Access denied")));
    }

    @Test
    @DisplayName("Cross-Owner Security: Buyer 6 cannot cancel Buyer 5's requirement (403 Forbidden)")
    void testCrossOwner_Cancel_ThrowsForbidden() throws Exception {
        mockMvc.perform(put("/api/buyer/requirements/1/cancel")
                        .header("Authorization", buyer6Token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.message", containsString("Access denied")));
    }

    @Test
    @DisplayName("RBAC: Farmer cannot access buyer requirements list (403 Forbidden)")
    void testFarmerAccess_Get_ThrowsForbidden() throws Exception {
        mockMvc.perform(get("/api/buyer/requirements")
                        .header("Authorization", farmer2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("RBAC: Farmer cannot create buyer requirement (403 Forbidden)")
    void testFarmerAccess_Create_ThrowsForbidden() throws Exception {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                1, new BigDecimal("500.00"), new BigDecimal("28.50"),
                QualityGrade.A, "Nashik", LocalDate.now().plusDays(14)
        );

        mockMvc.perform(post("/api/buyer/requirements")
                        .header("Authorization", farmer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Auth: Unauthenticated request to list requirements (401 Unauthorized)")
    void testUnauthenticated_Get_ThrowsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/buyer/requirements"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Auth: Unauthenticated request to create requirement (401 Unauthorized)")
    void testUnauthenticated_Post_ThrowsUnauthorized() throws Exception {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                1, new BigDecimal("500.00"), new BigDecimal("28.50"),
                QualityGrade.A, "Nashik", LocalDate.now().plusDays(14)
        );

        mockMvc.perform(post("/api/buyer/requirements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Validation: Zero quantity rejected (400 Bad Request)")
    void testValidation_ZeroQuantity_ThrowsBadRequest() throws Exception {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                1, BigDecimal.ZERO, new BigDecimal("28.50"),
                QualityGrade.A, "Nashik", LocalDate.now().plusDays(14)
        );

        mockMvc.perform(post("/api/buyer/requirements")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    @DisplayName("Validation: Negative price rejected (400 Bad Request)")
    void testValidation_NegativePrice_ThrowsBadRequest() throws Exception {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                1, new BigDecimal("100.00"), new BigDecimal("-10.00"),
                QualityGrade.A, "Nashik", LocalDate.now().plusDays(14)
        );

        mockMvc.perform(post("/api/buyer/requirements")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)));
    }

    @Test
    @DisplayName("Validation: Non-existent crop returns 404 Not Found")
    void testValidation_InvalidCrop_ThrowsNotFound() throws Exception {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                9999, new BigDecimal("100.00"), new BigDecimal("25.00"),
                QualityGrade.A, "Nashik", LocalDate.now().plusDays(14)
        );

        mockMvc.perform(post("/api/buyer/requirements")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)));
    }

    @Test
    @DisplayName("Validation: Past required-by date rejected (400 Bad Request)")
    void testValidation_PastDate_ThrowsBadRequest() throws Exception {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                1, new BigDecimal("100.00"), new BigDecimal("25.00"),
                QualityGrade.A, "Nashik", LocalDate.now().minusDays(2)
        );

        mockMvc.perform(post("/api/buyer/requirements")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("past")));
    }

    @Test
    @DisplayName("Lifecycle: Updating a cancelled requirement rejected (400 Bad Request)")
    void testUpdateCancelledRequirement_ThrowsBadRequest() throws Exception {
        // Cancel requirement 1 first
        mockMvc.perform(put("/api/buyer/requirements/1/cancel")
                        .header("Authorization", buyer5Token))
                .andExpect(status().isOk());

        // Now attempt to update it
        UpdateBuyerRequirementRequest request = new UpdateBuyerRequirementRequest(
                1, new BigDecimal("600.00"), new BigDecimal("30.00"),
                QualityGrade.A, "Nashik", LocalDate.now().plusDays(20)
        );

        mockMvc.perform(put("/api/buyer/requirements/1")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("CANCELLED")));
    }
}
