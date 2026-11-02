package com.agriconnect;

import com.agriconnect.dto.CreateQualityAssessmentRequest;
import com.agriconnect.dto.UpdateQualityAssessmentRequest;
import com.agriconnect.entity.*;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.HarvestRepository;
import com.agriconnect.repository.QualityAssessmentRepository;
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
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Full Spring Security & Database Integration Tests for Phase 5 Quality Management.
 * Validates RBAC permissions, admin workflows, farmer ownership protection,
 * duplicate handling, input validation, and score calculation.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class QualityAssessmentIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HarvestRepository harvestRepository;

    @Autowired
    private CropRepository cropRepository;

    @Autowired
    private QualityAssessmentRepository qualityAssessmentRepository;

    private String adminToken;
    private String farmer2Token;
    private String farmer3Token;
    private String buyerToken;

    private User adminUser;
    private User farmer2User;
    private User farmer3User;
    private Harvest testHarvestForFarmer2;
    private Harvest testHarvestForFarmer3;

    @BeforeEach
    void setUp() {
        adminUser = userRepository.findById(1).orElseThrow();
        farmer2User = userRepository.findById(2).orElseThrow();
        farmer3User = userRepository.findById(3).orElseThrow();
        User buyerUser = userRepository.findById(5).orElseThrow();

        adminToken = "Bearer " + jwtTokenProvider.generateToken(adminUser);
        farmer2Token = "Bearer " + jwtTokenProvider.generateToken(farmer2User);
        farmer3Token = "Bearer " + jwtTokenProvider.generateToken(farmer3User);
        buyerToken = "Bearer " + jwtTokenProvider.generateToken(buyerUser);

        Crop crop = cropRepository.findById(1).orElseThrow();

        // Create a dedicated harvest for Farmer 2 without an assessment
        testHarvestForFarmer2 = new Harvest(
                farmer2User,
                crop,
                new BigDecimal("1200.00"),
                new BigDecimal("1200.00"),
                new BigDecimal("32.00"),
                LocalDate.now().minusDays(1),
                "Nashik Mandi Yard 2",
                HarvestStatus.AVAILABLE
        );
        testHarvestForFarmer2 = harvestRepository.save(testHarvestForFarmer2);

        // Create a dedicated harvest for Farmer 3 without an assessment
        testHarvestForFarmer3 = new Harvest(
                farmer3User,
                crop,
                new BigDecimal("2000.00"),
                new BigDecimal("2000.00"),
                new BigDecimal("35.00"),
                LocalDate.now().minusDays(1),
                "Karnal Grain Hub",
                HarvestStatus.AVAILABLE
        );
        testHarvestForFarmer3 = harvestRepository.save(testHarvestForFarmer3);
    }

    // ===================================================================
    // 1. Admin Quality Assessment Creation & Score Verification
    // ===================================================================

    @Test
    @DisplayName("ADMIN: Create quality assessment -> 201 Created with computed score 86.00 and Grade A")
    void testAdminCreateQualityAssessment() throws Exception {
        CreateQualityAssessmentRequest request = new CreateQualityAssessmentRequest(
                testHarvestForFarmer2.getHarvestId(),
                9, 8, 9, 8, 9,
                new BigDecimal("4.00"),
                "High quality lot certified for processing"
        );

        mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.harvestId").value(testHarvestForFarmer2.getHarvestId()))
                .andExpect(jsonPath("$.data.qualityScore").value(86.00))
                .andExpect(jsonPath("$.data.qualityGrade").value("A"))
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.adminId").value(adminUser.getUserId()));
    }

    @Test
    @DisplayName("ADMIN: Create duplicate assessment on same harvest -> 409 Conflict")
    void testAdminCreateDuplicateAssessmentFails() throws Exception {
        CreateQualityAssessmentRequest request = new CreateQualityAssessmentRequest(
                testHarvestForFarmer2.getHarvestId(),
                8, 8, 8, 8, 8,
                new BigDecimal("5.00"),
                "First inspection"
        );

        // First creation succeeds
        mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // Duplicate creation attempt returns 409 Conflict
        mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message", containsString("already exists for harvest")));
    }

    // ===================================================================
    // 2. Admin Inspection & Pending Queues
    // ===================================================================

    @Test
    @DisplayName("ADMIN: GET /api/admin/quality/pending returns pending harvest queue (200 OK)")
    void testGetPendingHarvestsQueue() throws Exception {
        mockMvc.perform(get("/api/admin/quality/pending")
                        .header("Authorization", adminToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$.data[0].harvestId").isNumber())
                .andExpect(jsonPath("$.data[0].cropName").isNotEmpty())
                .andExpect(jsonPath("$.data[0].farmerName").isNotEmpty());
    }

    @Test
    @DisplayName("ADMIN: GET /api/admin/quality/harvests/{harvestId} returns inspection details (200 OK)")
    void testGetHarvestDetailsForAssessment() throws Exception {
        mockMvc.perform(get("/api/admin/quality/harvests/" + testHarvestForFarmer2.getHarvestId())
                        .header("Authorization", adminToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.harvest.harvestId").value(testHarvestForFarmer2.getHarvestId()))
                .andExpect(jsonPath("$.data.assessment").value(nullValue()));
    }

    // ===================================================================
    // 3. Admin Update, Verify, Reject Lifecycle
    // ===================================================================

    @Test
    @DisplayName("ADMIN: Update assessment recalculates score/grade and resets to PENDING (200 OK)")
    void testAdminUpdateAssessment() throws Exception {
        // Create initial assessment
        CreateQualityAssessmentRequest createReq = new CreateQualityAssessmentRequest(
                testHarvestForFarmer2.getHarvestId(),
                9, 9, 9, 9, 9,
                new BigDecimal("2.00"),
                "Initial top grade"
        );

        String createRes = mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer assessmentId = objectMapper.readTree(createRes).path("data").path("assessmentId").asInt();

        // Update with lower ratings -> average 6.6, score 66.00, Grade B
        UpdateQualityAssessmentRequest updateReq = new UpdateQualityAssessmentRequest(
                7, 7, 6, 7, 6,
                new BigDecimal("6.00"),
                "Downgraded after lab re-testing"
        );

        mockMvc.perform(put("/api/admin/quality/" + assessmentId)
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.qualityScore").value(66.00))
                .andExpect(jsonPath("$.data.qualityGrade").value("B"))
                .andExpect(jsonPath("$.data.verificationStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.inspectorNotes").value("Downgraded after lab re-testing"));
    }

    @Test
    @DisplayName("ADMIN: Verify assessment -> sets status to VERIFIED (200 OK)")
    void testAdminVerifyAssessment() throws Exception {
        CreateQualityAssessmentRequest createReq = new CreateQualityAssessmentRequest(
                testHarvestForFarmer2.getHarvestId(),
                9, 8, 9, 8, 9,
                new BigDecimal("3.00"),
                "Ready for verification"
        );

        String createRes = mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer assessmentId = objectMapper.readTree(createRes).path("data").path("assessmentId").asInt();

        // Admin verifies
        mockMvc.perform(put("/api/admin/quality/" + assessmentId + "/verify")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("VERIFIED"));
    }

    @Test
    @DisplayName("ADMIN: Reject assessment -> sets status to REJECTED (200 OK)")
    void testAdminRejectAssessment() throws Exception {
        CreateQualityAssessmentRequest createReq = new CreateQualityAssessmentRequest(
                testHarvestForFarmer2.getHarvestId(),
                5, 5, 5, 5, 5,
                new BigDecimal("25.00"),
                "Suspicious discoloration"
        );

        String createRes = mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer assessmentId = objectMapper.readTree(createRes).path("data").path("assessmentId").asInt();

        // Admin rejects
        mockMvc.perform(put("/api/admin/quality/" + assessmentId + "/reject")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("notes", "Rejected due to high pest infestation"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.verificationStatus").value("REJECTED"))
                .andExpect(jsonPath("$.data.inspectorNotes").value("Rejected due to high pest infestation"));
    }

    // ===================================================================
    // 4. Farmer Quality Inspection & Ownership Protection
    // ===================================================================

    @Test
    @DisplayName("FARMER: View own harvest quality -> 200 OK")
    void testFarmerViewOwnQuality() throws Exception {
        // Harvest 1 in sample data belongs to Farmer 2 (Rajesh Patel) and has sample assessment #1
        mockMvc.perform(get("/api/farmer/harvests/1/quality")
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.harvestId").value(1))
                .andExpect(jsonPath("$.data.farmerId").value(2))
                .andExpect(jsonPath("$.data.qualityGrade").value("A"))
                .andExpect(jsonPath("$.data.verificationStatus").value("VERIFIED"));
    }

    @Test
    @DisplayName("FARMER: View unassessed own harvest -> 200 OK with message 'Quality assessment not available yet.'")
    void testFarmerViewUnassessedQuality() throws Exception {
        mockMvc.perform(get("/api/farmer/harvests/" + testHarvestForFarmer2.getHarvestId() + "/quality")
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Quality assessment not available yet."))
                .andExpect(jsonPath("$.data").value(nullValue()));
    }

    @Test
    @DisplayName("OWNERSHIP SECURITY: Farmer 3 cannot view Farmer 2's harvest quality -> 403 Forbidden")
    void testFarmerCannotAccessOtherFarmerQuality() throws Exception {
        // Harvest 1 belongs to Farmer 2. Farmer 3 attempts access:
        mockMvc.perform(get("/api/farmer/harvests/1/quality")
                        .header("Authorization", farmer3Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    // ===================================================================
    // 5. Role-Based Access Control (RBAC) Protection Tests
    // ===================================================================

    @Test
    @DisplayName("RBAC: Farmer cannot create quality assessment -> 403 Forbidden")
    void testFarmerCannotCreateAssessment() throws Exception {
        CreateQualityAssessmentRequest request = new CreateQualityAssessmentRequest(
                testHarvestForFarmer2.getHarvestId(), 9, 9, 9, 9, 9, BigDecimal.ZERO, "Notes"
        );

        mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", farmer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("RBAC: Buyer cannot create quality assessment -> 403 Forbidden")
    void testBuyerCannotCreateAssessment() throws Exception {
        CreateQualityAssessmentRequest request = new CreateQualityAssessmentRequest(
                testHarvestForFarmer2.getHarvestId(), 9, 9, 9, 9, 9, BigDecimal.ZERO, "Notes"
        );

        mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("RBAC: Farmer cannot verify quality assessment -> 403 Forbidden")
    void testFarmerCannotVerifyAssessment() throws Exception {
        mockMvc.perform(put("/api/admin/quality/1/verify")
                        .header("Authorization", farmer2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("RBAC: Buyer cannot verify quality assessment -> 403 Forbidden")
    void testBuyerCannotVerifyAssessment() throws Exception {
        mockMvc.perform(put("/api/admin/quality/1/verify")
                        .header("Authorization", buyerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SECURITY: Unauthenticated request to /api/admin/quality -> 401 Unauthorized")
    void testUnauthenticatedAccessFails() throws Exception {
        mockMvc.perform(get("/api/admin/quality/pending"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));

        mockMvc.perform(get("/api/farmer/harvests/1/quality"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    // ===================================================================
    // 6. Input Validation Tests
    // ===================================================================

    @Test
    @DisplayName("VALIDATION: Freshness < 1 (0) -> 400 Bad Request")
    void testValidationFreshnessTooLow() throws Exception {
        CreateQualityAssessmentRequest req = new CreateQualityAssessmentRequest(
                testHarvestForFarmer2.getHarvestId(), 0, 8, 8, 8, 8, BigDecimal.ZERO, "Notes"
        );

        mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.freshness").isNotEmpty());
    }

    @Test
    @DisplayName("VALIDATION: Freshness > 10 (11) -> 400 Bad Request")
    void testValidationFreshnessTooHigh() throws Exception {
        CreateQualityAssessmentRequest req = new CreateQualityAssessmentRequest(
                testHarvestForFarmer2.getHarvestId(), 11, 8, 8, 8, 8, BigDecimal.ZERO, "Notes"
        );

        mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.freshness").isNotEmpty());
    }

    @Test
    @DisplayName("VALIDATION: Damage percentage negative (-1) -> 400 Bad Request")
    void testValidationDamageNegative() throws Exception {
        CreateQualityAssessmentRequest req = new CreateQualityAssessmentRequest(
                testHarvestForFarmer2.getHarvestId(), 8, 8, 8, 8, 8, new BigDecimal("-1.00"), "Notes"
        );

        mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.damagePercentage").isNotEmpty());
    }

    @Test
    @DisplayName("VALIDATION: Damage percentage > 100 (101) -> 400 Bad Request")
    void testValidationDamageOver100() throws Exception {
        CreateQualityAssessmentRequest req = new CreateQualityAssessmentRequest(
                testHarvestForFarmer2.getHarvestId(), 8, 8, 8, 8, 8, new BigDecimal("101.00"), "Notes"
        );

        mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.damagePercentage").isNotEmpty());
    }

    @Test
    @DisplayName("VALIDATION: Missing harvest ID -> 400 Bad Request")
    void testValidationMissingHarvestId() throws Exception {
        CreateQualityAssessmentRequest req = new CreateQualityAssessmentRequest(
                null, 8, 8, 8, 8, 8, BigDecimal.ZERO, "Notes"
        );

        mockMvc.perform(post("/api/admin/quality")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.harvestId").isNotEmpty());
    }
}
