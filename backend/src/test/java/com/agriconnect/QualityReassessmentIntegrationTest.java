package com.agriconnect;

import com.agriconnect.dto.PerformReassessmentRequest;
import com.agriconnect.dto.RequestReassessmentRequest;
import com.agriconnect.dto.SubmitBuyerFeedbackRequest;
import com.agriconnect.entity.*;
import com.agriconnect.repository.*;
import com.agriconnect.security.JwtTokenProvider;
import com.agriconnect.service.MatchingService;
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
class QualityReassessmentIntegrationTest {

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
    private OrderRepository orderRepository;

    @Autowired
    private QualityAssessmentRepository qualityAssessmentRepository;

    @Autowired
    private BuyerQualityFeedbackRepository buyerQualityFeedbackRepository;

    @Autowired
    private QualityReassessmentRepository qualityReassessmentRepository;

    @Autowired
    private BuyerRequirementRepository requirementRepository;

    @Autowired
    private MatchingService matchingService;

    private String adminToken;
    private String buyer5Token; // Vikas Gupta (owns order 1 & 2)
    private String buyer6Token; // Priya Nair (other buyer)
    private String farmer2Token;

    private User admin;
    private User buyer5;
    private User buyer6;
    private User farmer2;

    @BeforeEach
    void setUp() {
        admin = userRepository.findById(1).orElseThrow();
        farmer2 = userRepository.findById(2).orElseThrow();
        buyer5 = userRepository.findById(5).orElseThrow();
        buyer6 = userRepository.findById(6).orElseThrow();

        adminToken = "Bearer " + jwtTokenProvider.generateToken(admin);
        buyer5Token = "Bearer " + jwtTokenProvider.generateToken(buyer5);
        buyer6Token = "Bearer " + jwtTokenProvider.generateToken(buyer6);
        farmer2Token = "Bearer " + jwtTokenProvider.generateToken(farmer2);
    }

    @Test
    @DisplayName("Feedback: Buyer successfully submits quality feedback on delivered order (201 Created)")
    void testBuyerSubmitsQualityFeedback_Success() throws Exception {
        // Order 1 is delivered or can be set to DELIVERED
        Order order = orderRepository.findById(1).orElseThrow();
        order.setOrderStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        SubmitBuyerFeedbackRequest req = new SubmitBuyerFeedbackRequest(
                3,
                FeedbackIssueType.FRESHNESS_ISSUE,
                "Produce was delivered with slight dehydration and moisture loss."
        );

        mockMvc.perform(post("/api/buyer/orders/1/feedback")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(201))
                .andExpect(jsonPath("$.data.orderId").value(1))
                .andExpect(jsonPath("$.data.buyerName").value(buyer5.getFullName()))
                .andExpect(jsonPath("$.data.rating").value(3))
                .andExpect(jsonPath("$.data.issueType").value("FRESHNESS_ISSUE"))
                .andExpect(jsonPath("$.data.reviewStatus").value("PENDING_REVIEW"));

        // Verify retrieval
        mockMvc.perform(get("/api/buyer/orders/1/feedback")
                        .header("Authorization", buyer5Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.rating").value(3));
    }

    @Test
    @DisplayName("Feedback: Unauthorized buyer cannot submit feedback on another buyer's order (403 Forbidden)")
    void testBuyerSubmitsQualityFeedback_Unauthorized_Forbidden() throws Exception {
        Order order = orderRepository.findById(1).orElseThrow();
        order.setOrderStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        SubmitBuyerFeedbackRequest req = new SubmitBuyerFeedbackRequest(
                2,
                FeedbackIssueType.QUALITY_LOWER_THAN_CERTIFIED,
                "Attempted unauthorized submission."
        );

        // Buyer 6 does not own Order 1 (owned by Buyer 5)
        mockMvc.perform(post("/api/buyer/orders/1/feedback")
                        .header("Authorization", buyer6Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Feedback: Duplicate feedback for same order is rejected (409 Conflict)")
    void testBuyerSubmitsQualityFeedback_Duplicate_Conflict() throws Exception {
        Order order = orderRepository.findById(1).orElseThrow();
        order.setOrderStatus(OrderStatus.DELIVERED);
        orderRepository.save(order);

        SubmitBuyerFeedbackRequest req = new SubmitBuyerFeedbackRequest(
                4,
                FeedbackIssueType.APPEARANCE_ISSUE,
                "First feedback submission."
        );

        mockMvc.perform(post("/api/buyer/orders/1/feedback")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Duplicate submission attempt
        mockMvc.perform(post("/api/buyer/orders/1/feedback")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Feedback: Invalid rating below 1 or above 5 rejected (400 Bad Request)")
    void testBuyerSubmitsQualityFeedback_InvalidRating_BadRequest() throws Exception {
        SubmitBuyerFeedbackRequest req = new SubmitBuyerFeedbackRequest(
                6, // Invalid rating > 5
                FeedbackIssueType.OTHER,
                "Invalid rating test."
        );

        mockMvc.perform(post("/api/buyer/orders/1/feedback")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Reassessment: Admin requests quality reassessment (200 OK)")
    void testAdminRequestsReassessment_Success() throws Exception {
        QualityAssessment qa = qualityAssessmentRepository.findById(1).orElseThrow();
        qa.setVerificationStatus(VerificationStatus.VERIFIED);
        qualityAssessmentRepository.save(qa);

        RequestReassessmentRequest req = new RequestReassessmentRequest(
                "Buyer quality complaint reported",
                null,
                "Visual verification required at distribution warehouse."
        );

        mockMvc.perform(post("/api/admin/quality/1/request-reassessment")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.verificationStatus").value("REASSESSMENT_REQUIRED"));

        QualityAssessment updated = qualityAssessmentRepository.findById(1).orElseThrow();
        assertThat(updated.getVerificationStatus()).isEqualTo(VerificationStatus.REASSESSMENT_REQUIRED);
    }

    @Test
    @DisplayName("Reassessment: Non-admin role receives 403 Forbidden")
    void testNonAdminRequestsReassessment_Forbidden() throws Exception {
        RequestReassessmentRequest req = new RequestReassessmentRequest("Unauthorized", null, null);

        mockMvc.perform(post("/api/admin/quality/1/request-reassessment")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/admin/quality/1/request-reassessment")
                        .header("Authorization", farmer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Reassessment: Admin performs reinspection with RE_VERIFIED decision (200 OK)")
    void testAdminPerformsReassessment_ReVerify_Success() throws Exception {
        QualityAssessment qa = qualityAssessmentRepository.findById(1).orElseThrow();
        qa.setVerificationStatus(VerificationStatus.REASSESSMENT_REQUIRED);
        qualityAssessmentRepository.save(qa);

        PerformReassessmentRequest req = new PerformReassessmentRequest();
        req.setFreshness(8);
        req.setAppearance(8);
        req.setSize(8);
        req.setColor(8);
        req.setRipeness(8);
        req.setDamagePercentage(new BigDecimal("2.50"));
        req.setDecision(ReassessmentDecision.RE_VERIFIED);
        req.setReason("Buyer complaint reinspected");
        req.setInspectionRemarks("Produce lot inspected at depot. Meets Grade A standard.");

        mockMvc.perform(post("/api/admin/quality/1/reassess")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.decision").value("RE_VERIFIED"))
                .andExpect(jsonPath("$.data.recalculatedScore").value(80.00))
                .andExpect(jsonPath("$.data.recalculatedGrade").value("A"));

        QualityAssessment updated = qualityAssessmentRepository.findById(1).orElseThrow();
        assertThat(updated.getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
        assertThat(updated.getQualityScore()).isEqualByComparingTo(new BigDecimal("80.00"));
        assertThat(updated.getQualityGrade()).isEqualTo(QualityGrade.A);
    }

    @Test
    @DisplayName("Reassessment: Admin performs reinspection with REJECTED decision (200 OK)")
    void testAdminPerformsReassessment_Reject_Success() throws Exception {
        QualityAssessment qa = qualityAssessmentRepository.findById(1).orElseThrow();
        qa.setVerificationStatus(VerificationStatus.REASSESSMENT_REQUIRED);
        qualityAssessmentRepository.save(qa);

        PerformReassessmentRequest req = new PerformReassessmentRequest();
        req.setFreshness(4);
        req.setAppearance(4);
        req.setSize(4);
        req.setColor(4);
        req.setRipeness(4);
        req.setDamagePercentage(new BigDecimal("18.00"));
        req.setDecision(ReassessmentDecision.REJECTED);
        req.setReason("Severe transit decay confirmed");
        req.setInspectionRemarks("Excessive mold and rot detected during depot reinspection. Disqualified.");

        mockMvc.perform(post("/api/admin/quality/1/reassess")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.decision").value("REJECTED"))
                .andExpect(jsonPath("$.data.recalculatedScore").value(40.00))
                .andExpect(jsonPath("$.data.recalculatedGrade").value("C"));

        QualityAssessment updated = qualityAssessmentRepository.findById(1).orElseThrow();
        assertThat(updated.getVerificationStatus()).isEqualTo(VerificationStatus.REJECTED);
    }

    @Test
    @DisplayName("Reassessment: Audit history preserves original assessment and subsequent actions (200 OK)")
    void testAuditHistory_Preserved() throws Exception {
        QualityAssessment qa = qualityAssessmentRepository.findById(1).orElseThrow();
        qa.setVerificationStatus(VerificationStatus.VERIFIED);
        qualityAssessmentRepository.save(qa);

        // Perform a reassessment
        PerformReassessmentRequest req = new PerformReassessmentRequest();
        req.setFreshness(9);
        req.setAppearance(9);
        req.setSize(9);
        req.setColor(9);
        req.setRipeness(9);
        req.setDamagePercentage(new BigDecimal("1.00"));
        req.setDecision(ReassessmentDecision.RE_VERIFIED);
        req.setReason("Audit verification");
        req.setInspectionRemarks("Quality verified with high marks.");

        mockMvc.perform(post("/api/admin/quality/1/reassess")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        // Get audit history
        mockMvc.perform(get("/api/admin/quality/1/audit-history")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.data[?(@.eventType == 'INITIAL_ASSESSMENT')]").exists())
                .andExpect(jsonPath("$.data[?(@.eventType == 'RE_VERIFIED')]").exists());
    }

    @Test
    @DisplayName("Matching Engine: Excludes harvest lots with REASSESSMENT_REQUIRED or REJECTED status")
    void testMatchingEngine_ExcludesReassessmentAndRejected() throws Exception {
        // Ensure requirement 1 is open
        BuyerRequirement req = requirementRepository.findById(1).orElseThrow();
        req.setStatus(RequirementStatus.OPEN);
        req.setRequiredByDate(LocalDate.now().plusDays(30));
        requirementRepository.save(req);

        QualityAssessment qa = qualityAssessmentRepository.findById(1).orElseThrow();

        // 1. When VERIFIED: Harvest 1 matches
        qa.setVerificationStatus(VerificationStatus.VERIFIED);
        qualityAssessmentRepository.save(qa);
        var matchesVerified = matchingService.findMatchesForRequirement(5, 1, "best");
        assertThat(matchesVerified.getMatches().stream().anyMatch(m -> m.getHarvestId().equals(1))).isTrue();

        // 2. When REASSESSMENT_REQUIRED: Harvest 1 is excluded
        qa.setVerificationStatus(VerificationStatus.REASSESSMENT_REQUIRED);
        qualityAssessmentRepository.save(qa);
        var matchesUnderReview = matchingService.findMatchesForRequirement(5, 1, "best");
        assertThat(matchesUnderReview.getMatches().stream().noneMatch(m -> m.getHarvestId().equals(1))).isTrue();

        // 3. When REJECTED: Harvest 1 is excluded
        qa.setVerificationStatus(VerificationStatus.REJECTED);
        qualityAssessmentRepository.save(qa);
        var matchesRejected = matchingService.findMatchesForRequirement(5, 1, "best");
        assertThat(matchesRejected.getMatches().stream().noneMatch(m -> m.getHarvestId().equals(1))).isTrue();
    }
}
