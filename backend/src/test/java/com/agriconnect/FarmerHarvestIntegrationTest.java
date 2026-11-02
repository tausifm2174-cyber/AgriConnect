package com.agriconnect;

import com.agriconnect.dto.CreateHarvestRequest;
import com.agriconnect.dto.UpdateHarvestRequest;
import com.agriconnect.entity.HarvestStatus;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.HarvestRepository;
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
class FarmerHarvestIntegrationTest {

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
    private HarvestRepository harvestRepository;

    private String farmer2Token;
    private String farmer3Token;
    private String buyer5Token;

    @BeforeEach
    void setUp() {
        // Sample DB users:
        // User 2: Rajesh Patel (FARMER)
        // User 3: Suresh Kumar (FARMER)
        // User 5: Vikas Gupta (BUYER)
        User farmer2 = userRepository.findById(2).orElseThrow();
        User farmer3 = userRepository.findById(3).orElseThrow();
        User buyer5 = userRepository.findById(5).orElseThrow();

        farmer2Token = "Bearer " + jwtTokenProvider.generateToken(farmer2);
        farmer3Token = "Bearer " + jwtTokenProvider.generateToken(farmer3);
        buyer5Token = "Bearer " + jwtTokenProvider.generateToken(buyer5);
    }

    @Test
    @DisplayName("Crop Catalog: GET /api/crops with authenticated token returns crops list (200 OK)")
    void testGetCropsAuthenticated() throws Exception {
        mockMvc.perform(get("/api/crops")
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(6))))
                .andExpect(jsonPath("$.data[0].cropName").isNotEmpty())
                .andExpect(jsonPath("$.data[0].category").isNotEmpty());
    }

    @Test
    @DisplayName("Crop Catalog: GET /api/crops without token returns 401 Unauthorized")
    void testGetCropsUnauthenticatedFails() throws Exception {
        mockMvc.perform(get("/api/crops")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Farmer Profile: GET /api/farmer/profile returns profile details & stats (200 OK)")
    void testGetFarmerProfile() throws Exception {
        mockMvc.perform(get("/api/farmer/profile")
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.data.farmerId").value(2))
                .andExpect(jsonPath("$.data.fullName").value("Rajesh Patel"))
                .andExpect(jsonPath("$.data.farmLocation").value("Nashik, Maharashtra"))
                .andExpect(jsonPath("$.data.totalHarvestsCount").value(greaterThanOrEqualTo(2)));
    }

    @Test
    @DisplayName("Farmer Harvest Creation: POST /api/farmer/harvests creates lot linked to token identity (201 Created)")
    void testCreateHarvestSuccess() throws Exception {
        CreateHarvestRequest request = new CreateHarvestRequest(
                1, // Tomato (Hybrid Red)
                new BigDecimal("1500.00"),
                new BigDecimal("26.50"),
                LocalDate.now().minusDays(1),
                "Nashik Farm Sector 4"
        );

        mockMvc.perform(post("/api/farmer/harvests")
                        .header("Authorization", farmer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.data.harvestId").isNumber())
                .andExpect(jsonPath("$.data.farmerId").value(2))
                .andExpect(jsonPath("$.data.farmerName").value("Rajesh Patel"))
                .andExpect(jsonPath("$.data.cropId").value(1))
                .andExpect(jsonPath("$.data.cropName").value("Tomato (Hybrid Red)"))
                .andExpect(jsonPath("$.data.initialQuantity").value(1500.00))
                .andExpect(jsonPath("$.data.availableQuantity").value(1500.00))
                .andExpect(jsonPath("$.data.pricePerKg").value(26.50))
                .andExpect(jsonPath("$.data.status").value("AVAILABLE"));
    }

    @Test
    @DisplayName("Security RBAC: BUYER role attempting POST /api/farmer/harvests returns 403 Forbidden")
    void testBuyerCannotCreateHarvest() throws Exception {
        CreateHarvestRequest request = new CreateHarvestRequest(
                1,
                new BigDecimal("1000.00"),
                new BigDecimal("25.00"),
                LocalDate.now(),
                "Pune"
        );

        mockMvc.perform(post("/api/farmer/harvests")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Security: Unauthenticated request to /api/farmer/harvests returns 401 Unauthorized")
    void testUnauthenticatedCannotCreateHarvest() throws Exception {
        CreateHarvestRequest request = new CreateHarvestRequest(
                1,
                new BigDecimal("1000.00"),
                new BigDecimal("25.00"),
                LocalDate.now(),
                "Pune"
        );

        mockMvc.perform(post("/api/farmer/harvests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Validation: POST /api/farmer/harvests with non-positive quantity returns 400 Bad Request")
    void testCreateHarvestZeroQuantityFails() throws Exception {
        CreateHarvestRequest request = new CreateHarvestRequest(
                1,
                BigDecimal.ZERO,
                new BigDecimal("25.00"),
                LocalDate.now(),
                "Nashik"
        );

        mockMvc.perform(post("/api/farmer/harvests")
                        .header("Authorization", farmer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.quantity").isNotEmpty());
    }

    @Test
    @DisplayName("Validation: POST /api/farmer/harvests with non-positive price returns 400 Bad Request")
    void testCreateHarvestNegativePriceFails() throws Exception {
        CreateHarvestRequest request = new CreateHarvestRequest(
                1,
                new BigDecimal("500.00"),
                new BigDecimal("-10.00"),
                LocalDate.now(),
                "Nashik"
        );

        mockMvc.perform(post("/api/farmer/harvests")
                        .header("Authorization", farmer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.pricePerKg").isNotEmpty());
    }

    @Test
    @DisplayName("Validation: POST /api/farmer/harvests with non-existent crop ID returns 404 Not Found")
    void testCreateHarvestNonExistentCropFails() throws Exception {
        CreateHarvestRequest request = new CreateHarvestRequest(
                9999,
                new BigDecimal("500.00"),
                new BigDecimal("25.00"),
                LocalDate.now(),
                "Nashik"
        );

        mockMvc.perform(post("/api/farmer/harvests")
                        .header("Authorization", farmer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("List Farmer Harvests: GET /api/farmer/harvests returns only the authenticated farmer's lots (200 OK)")
    void testGetMyHarvestsIsolation() throws Exception {
        mockMvc.perform(get("/api/farmer/harvests")
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$.data[*].farmerId", everyItem(is(2))));
    }

    @Test
    @DisplayName("View Harvest: Farmer viewing own harvest returns 200 OK")
    void testGetOwnHarvestSuccess() throws Exception {
        // Harvest 1 is owned by Farmer 2 (Rajesh Patel)
        mockMvc.perform(get("/api/farmer/harvests/1")
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.harvestId").value(1))
                .andExpect(jsonPath("$.data.farmerId").value(2));
    }

    @Test
    @DisplayName("Horizontal Privilege Escalation Prevention: Farmer 3 viewing Farmer 2's harvest returns 403 Forbidden")
    void testAccessAnotherFarmersHarvestForbidden() throws Exception {
        // Harvest 1 is owned by Farmer 2; Farmer 3 attempts access
        mockMvc.perform(get("/api/farmer/harvests/1")
                        .header("Authorization", farmer3Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value(containsString("Access denied")));
    }

    @Test
    @DisplayName("Update Harvest: Farmer updating own harvest with valid price & quantity returns 200 OK")
    void testUpdateOwnHarvestSuccess() throws Exception {
        // Harvest 5 is owned by Farmer 2 (Red Onion)
        UpdateHarvestRequest request = new UpdateHarvestRequest();
        request.setPricePerKg(new BigDecimal("32.50"));
        request.setLocation("Lasalgaon Market Yard");

        mockMvc.perform(put("/api/farmer/harvests/5")
                        .header("Authorization", farmer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.data.pricePerKg").value(32.50))
                .andExpect(jsonPath("$.data.location").value("Lasalgaon Market Yard"));
    }

    @Test
    @DisplayName("Horizontal Privilege Escalation Prevention: Farmer 3 updating Farmer 2's harvest returns 403 Forbidden")
    void testUpdateAnotherFarmersHarvestForbidden() throws Exception {
        UpdateHarvestRequest request = new UpdateHarvestRequest();
        request.setPricePerKg(new BigDecimal("50.00"));

        mockMvc.perform(put("/api/farmer/harvests/5")
                        .header("Authorization", farmer3Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Relational Integrity: Deleting harvest referenced by existing orders returns 400 Bad Request")
    void testDeleteHarvestWithOrdersBlocked() throws Exception {
        // Harvest 1 is linked to Order 1 in sample data
        mockMvc.perform(delete("/api/farmer/harvests/1")
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(containsString("associated with it")));
    }

    @Test
    @DisplayName("Safe Deletion: Deleting an unreferenced harvest succeeds and removes entity from database (200 OK)")
    void testDeleteUnreferencedHarvestSuccess() throws Exception {
        // 1. Create a fresh harvest lot for Farmer 2
        CreateHarvestRequest request = new CreateHarvestRequest(
                3, // Wheat
                new BigDecimal("600.00"),
                new BigDecimal("22.00"),
                LocalDate.now(),
                "Nashik Farm Area"
        );

        String createJson = mockMvc.perform(post("/api/farmer/harvests")
                        .header("Authorization", farmer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Integer createdHarvestId = objectMapper.readTree(createJson).get("data").get("harvestId").asInt();
        assertThat(harvestRepository.findById(createdHarvestId)).isPresent();

        // 2. Delete the created harvest
        mockMvc.perform(delete("/api/farmer/harvests/" + createdHarvestId)
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty());

        // 3. Verify it is gone from the database
        assertThat(harvestRepository.findById(createdHarvestId)).isEmpty();
    }
}
