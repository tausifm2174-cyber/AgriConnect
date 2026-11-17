package com.agriconnect;

import com.agriconnect.dto.CreateHarvestRequest;
import com.agriconnect.dto.CreateQualityAssessmentRequest;
import com.agriconnect.dto.OrderDecisionRequest;
import com.agriconnect.dto.RegisterRequest;
import com.agriconnect.dto.UpdateBuyerRequirementRequest;
import com.agriconnect.dto.UpdateHarvestRequest;
import com.agriconnect.entity.HarvestStatus;
import com.agriconnect.entity.QualityGrade;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Phase 14: Security Hardening & Validation Refinement Regression Suite.
 * Validates authentication enforcement, token tampering defenses, RBAC authorization,
 * Insecure Direct Object Reference (IDOR) prevention, input validation, sanitized error formatting,
 * and sensitive credential exclusion across all API boundaries.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SecurityHardeningTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    private String adminToken;
    private String farmer2Token; // Rajesh Patel (owns Harvest 1)
    private String farmer3Token; // Suresh Kumar (owns Harvest 2)
    private String buyer5Token;  // Vikas Gupta (owns Requirement 1, Order 1)
    private String buyer6Token;  // Anita Rao (owns Requirement 2)

    @BeforeEach
    void setUp() {
        User admin1 = userRepository.findById(1).orElseThrow();
        User farmer2 = userRepository.findById(2).orElseThrow();
        User farmer3 = userRepository.findById(3).orElseThrow();
        User buyer5 = userRepository.findById(5).orElseThrow();
        User buyer6 = userRepository.findById(6).orElseThrow();

        adminToken = "Bearer " + jwtTokenProvider.generateToken(admin1);
        farmer2Token = "Bearer " + jwtTokenProvider.generateToken(farmer2);
        farmer3Token = "Bearer " + jwtTokenProvider.generateToken(farmer3);
        buyer5Token = "Bearer " + jwtTokenProvider.generateToken(buyer5);
        buyer6Token = "Bearer " + jwtTokenProvider.generateToken(buyer6);
    }

    @Nested
    @DisplayName("1. Authentication & JWT Hardening")
    class AuthenticationHardeningTests {

        @Test
        @DisplayName("Unauthenticated requests to protected endpoints return 401 with standard error structure")
        void unauthenticated_ReturnsStructured401() throws Exception {
            mockMvc.perform(get("/api/crops").accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.error").value("Unauthorized"))
                    .andExpect(jsonPath("$.message").isNotEmpty())
                    .andExpect(jsonPath("$.timestamp").isNotEmpty());

            mockMvc.perform(get("/api/farmer/profile").accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401));

            mockMvc.perform(get("/api/buyer/orders").accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401));

            mockMvc.perform(get("/api/admin/dashboard").accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401));
        }

        @Test
        @DisplayName("Malformed JWT token string is rejected with 401 Unauthorized")
        void malformedJwt_Returns401() throws Exception {
            mockMvc.perform(get("/api/crops")
                            .header("Authorization", "Bearer malformed.invalid.token")
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401))
                    .andExpect(jsonPath("$.error").value("Unauthorized"));
        }

        @Test
        @DisplayName("Tampered JWT signature is rejected with 401 Unauthorized")
        void tamperedJwtSignature_Returns401() throws Exception {
            String tamperedToken = farmer2Token + "tampered_signature_bits";
            mockMvc.perform(get("/api/crops")
                            .header("Authorization", tamperedToken)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.status").value(401));
        }
    }

    @Nested
    @DisplayName("2. Role-Based Access Control (RBAC)")
    class RoleBasedAccessControlTests {

        @Test
        @DisplayName("Farmer cannot access Buyer endpoints (403 Forbidden)")
        void farmer_CannotAccessBuyerEndpoints() throws Exception {
            mockMvc.perform(get("/api/buyer/orders")
                            .header("Authorization", farmer2Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.error").value("Forbidden"));

            mockMvc.perform(get("/api/buyer/requirements")
                            .header("Authorization", farmer2Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));
        }

        @Test
        @DisplayName("Farmer cannot access Admin endpoints (403 Forbidden)")
        void farmer_CannotAccessAdminEndpoints() throws Exception {
            mockMvc.perform(get("/api/admin/dashboard")
                            .header("Authorization", farmer2Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));

            mockMvc.perform(get("/api/admin/users")
                            .header("Authorization", farmer2Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));
        }

        @Test
        @DisplayName("Buyer cannot access Farmer endpoints (403 Forbidden)")
        void buyer_CannotAccessFarmerEndpoints() throws Exception {
            mockMvc.perform(get("/api/farmer/profile")
                            .header("Authorization", buyer5Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));

            mockMvc.perform(get("/api/farmer/harvests")
                            .header("Authorization", buyer5Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));
        }

        @Test
        @DisplayName("Buyer cannot access Admin endpoints (403 Forbidden)")
        void buyer_CannotAccessAdminEndpoints() throws Exception {
            mockMvc.perform(get("/api/admin/dashboard")
                            .header("Authorization", buyer5Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));

            mockMvc.perform(get("/api/admin/quality/pending")
                            .header("Authorization", buyer5Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403));
        }

        @Test
        @DisplayName("Public registration endpoint strictly forbids ADMIN role registration (400 Bad Request)")
        void publicRegistration_AdminRoleForbidden() throws Exception {
            RegisterRequest adminRegisterReq = new RegisterRequest(
                    "Malicious Admin", "fakeadmin@kisan.in", "+919988776655", "secretPassword123", Role.ADMIN
            );

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(adminRegisterReq)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message", containsString("Public registration is not permitted for the ADMIN role")));
        }
    }

    @Nested
    @DisplayName("3. Insecure Direct Object Reference (IDOR) Defenses")
    class IdorDefenseTests {

        @Test
        @DisplayName("Farmer cannot update another farmer's harvest lot (403 Forbidden)")
        void farmer_CannotUpdateOtherFarmerHarvest() throws Exception {
            // Harvest 2 is owned by Farmer 3. Farmer 2 attempts to modify it.
            UpdateHarvestRequest updateReq = new UpdateHarvestRequest(
                    new BigDecimal("1500.00"), new BigDecimal("60.00"), LocalDate.now(), "Unauthorized modification", HarvestStatus.AVAILABLE
            );

            mockMvc.perform(put("/api/farmer/harvests/2")
                            .header("Authorization", farmer2Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateReq)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.error").value("Forbidden"))
                    .andExpect(jsonPath("$.message", containsString("permission")));
        }

        @Test
        @DisplayName("Farmer cannot view quality inspection of another farmer's harvest (403 Forbidden)")
        void farmer_CannotViewOtherFarmerHarvestQuality() throws Exception {
            // Harvest 2 is owned by Farmer 3. Farmer 2 attempts to view its quality report.
            mockMvc.perform(get("/api/farmer/harvests/2/quality")
                            .header("Authorization", farmer2Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.error").value("Forbidden"));
        }

        @Test
        @DisplayName("Farmer cannot view incoming order for another farmer's harvest (403 Forbidden)")
        void farmer_CannotViewOtherFarmerOrder() throws Exception {
            // Order 1 is for Harvest 1 (owned by Farmer 2). Farmer 3 attempts to view it.
            mockMvc.perform(get("/api/farmer/orders/1")
                            .header("Authorization", farmer3Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.error").value("Forbidden"));
        }

        @Test
        @DisplayName("Buyer cannot view another buyer's order (403 Forbidden)")
        void buyer_CannotViewOtherBuyerOrder() throws Exception {
            // Order 1 is owned by Buyer 5. Buyer 6 attempts to retrieve it.
            mockMvc.perform(get("/api/buyer/orders/1")
                            .header("Authorization", buyer6Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.error").value("Forbidden"));
        }

        @Test
        @DisplayName("Buyer cannot cancel another buyer's order (403 Forbidden)")
        void buyer_CannotCancelOtherBuyerOrder() throws Exception {
            // Order 1 is owned by Buyer 5. Buyer 6 attempts to cancel it.
            OrderDecisionRequest cancelReq = new OrderDecisionRequest("Attempted unauthorized cancel");

            mockMvc.perform(patch("/api/buyer/orders/1/cancel")
                            .header("Authorization", buyer6Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(cancelReq)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.error").value("Forbidden"));
        }

        @Test
        @DisplayName("Buyer cannot update another buyer's requirement (403 Forbidden)")
        void buyer_CannotUpdateOtherBuyerRequirement() throws Exception {
            // Requirement 1 is owned by Buyer 5. Buyer 6 attempts to update it.
            UpdateBuyerRequirementRequest updateReq = new UpdateBuyerRequirementRequest(
                    1, new BigDecimal("500.00"), new BigDecimal("26.00"),
                    QualityGrade.A, "Unauthorized Location", LocalDate.now().plusDays(20)
            );

            mockMvc.perform(put("/api/buyer/requirements/1")
                            .header("Authorization", buyer6Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateReq)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.status").value(403))
                    .andExpect(jsonPath("$.error").value("Forbidden"));
        }
    }

    @Nested
    @DisplayName("4. Input Validation & Error Sanitization")
    class ValidationAndSanitizationTests {

        @Test
        @DisplayName("Registration with blank name and invalid email format returns 400 with field errors")
        void register_InvalidFields_Returns400WithErrors() throws Exception {
            RegisterRequest invalidReq = new RegisterRequest(
                    "", "not-an-email", "+919876543210", "123", Role.FARMER
            );

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidReq)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Validation Failed"))
                    .andExpect(jsonPath("$.errors.fullName").isNotEmpty())
                    .andExpect(jsonPath("$.errors.email").isNotEmpty())
                    .andExpect(jsonPath("$.errors.password").isNotEmpty());
        }

        @Test
        @DisplayName("Harvest creation with negative quantity returns 400 Bad Request")
        void createHarvest_NegativeQuantity_Returns400() throws Exception {
            CreateHarvestRequest invalidHarvest = new CreateHarvestRequest(
                    1, new BigDecimal("-50.00"), new BigDecimal("25.00"), LocalDate.now(), "Nashik"
            );

            mockMvc.perform(post("/api/farmer/harvests")
                            .header("Authorization", farmer2Token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(invalidHarvest)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Validation Failed"))
                    .andExpect(jsonPath("$.errors.quantity").isNotEmpty());
        }

        @Test
        @DisplayName("Quality assessment with out-of-range rating (> 10) returns 400 Bad Request")
        void createQuality_OutOfRangeRating_Returns400() throws Exception {
            CreateQualityAssessmentRequest outOfRangeReq = new CreateQualityAssessmentRequest(
                    1, 15, 9, 8, 9, 8, new BigDecimal("3.50"), "Out of range freshness"
            );

            mockMvc.perform(post("/api/admin/quality")
                            .header("Authorization", adminToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(outOfRangeReq)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Validation Failed"))
                    .andExpect(jsonPath("$.errors.freshness").isNotEmpty());
        }

        @Test
        @DisplayName("Malformed JSON payload returns clean 400 Bad Request without leaking internal stack traces")
        void malformedJsonPayload_ReturnsSanitized400() throws Exception {
            String malformedJson = "{ \"email\": \"farmer@kisan.in\", unclosed_key: ";

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(malformedJson))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Bad Request"))
                    .andExpect(jsonPath("$.message").value("Malformed JSON request or invalid field format."));
        }

        @Test
        @DisplayName("Type mismatch on path variable returns clean 400 Bad Request without stack traces")
        void typeMismatch_ReturnsSanitized400() throws Exception {
            mockMvc.perform(get("/api/crops/not-a-number")
                            .header("Authorization", farmer2Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status").value(400))
                    .andExpect(jsonPath("$.error").value("Bad Request"))
                    .andExpect(jsonPath("$.message", containsString("Invalid parameter value for: id")));
        }

        @Test
        @DisplayName("Unsupported HTTP method returns clean 405 Method Not Allowed")
        void unsupportedHttpMethod_ReturnsSanitized405() throws Exception {
            mockMvc.perform(delete("/api/crops")
                            .header("Authorization", farmer2Token))
                    .andExpect(status().isMethodNotAllowed())
                    .andExpect(jsonPath("$.status").value(405))
                    .andExpect(jsonPath("$.error").value("Method Not Allowed"))
                    .andExpect(jsonPath("$.message", containsString("HTTP method 'DELETE' is not supported")));
        }
    }

    @Nested
    @DisplayName("5. Sensitive Data Exclusion & Credential Protection")
    class SensitiveDataProtectionTests {

        @Test
        @DisplayName("GET /api/auth/me never exposes password or passwordHash in response body")
        void getMe_ExcludesSensitiveCredentials() throws Exception {
            mockMvc.perform(get("/api/auth/me")
                            .header("Authorization", farmer2Token)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.userId").value(2))
                    .andExpect(jsonPath("$.email").value("rajesh.patel@kisan.in"))
                    .andExpect(jsonPath("$.password").doesNotExist())
                    .andExpect(jsonPath("$.passwordHash").doesNotExist());
        }

        @Test
        @DisplayName("GET /api/admin/users/{id} never exposes password or passwordHash in response body")
        void getAdminUser_ExcludesSensitiveCredentials() throws Exception {
            mockMvc.perform(get("/api/admin/users/2")
                            .header("Authorization", adminToken)
                            .accept(MediaType.APPLICATION_JSON))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.userId").value(2))
                    .andExpect(jsonPath("$.data.fullName").value("Rajesh Patel"))
                    .andExpect(jsonPath("$.data.password").doesNotExist())
                    .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
        }
    }
}
