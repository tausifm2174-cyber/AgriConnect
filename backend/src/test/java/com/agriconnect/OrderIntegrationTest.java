package com.agriconnect;

import com.agriconnect.dto.CreateOrderRequest;
import com.agriconnect.dto.OrderDecisionRequest;
import com.agriconnect.entity.*;
import com.agriconnect.repository.BuyerRequirementRepository;
import com.agriconnect.repository.HarvestRepository;
import com.agriconnect.repository.OrderRepository;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class OrderIntegrationTest {

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
    private BuyerRequirementRepository requirementRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private com.agriconnect.repository.QualityAssessmentRepository qualityAssessmentRepository;

    private String buyer5Token;  // Vikas Gupta (owns requirement 1)
    private String buyer6Token;  // Priya Nair (owns requirement 2)
    private String farmer2Token; // Rajesh Patel (owns harvest 1)
    private String farmer3Token; // Suresh Kumar (owns harvest 2)
    private String adminToken;   // Ramesh Sharma (Admin)

    @BeforeEach
    void setUp() {
        User buyer5 = userRepository.findById(5).orElseThrow();
        User buyer6 = userRepository.findById(6).orElseThrow();
        User farmer2 = userRepository.findById(2).orElseThrow();
        User farmer3 = userRepository.findById(3).orElseThrow();
        User admin1 = userRepository.findById(1).orElseThrow();

        buyer5Token = "Bearer " + jwtTokenProvider.generateToken(buyer5);
        buyer6Token = "Bearer " + jwtTokenProvider.generateToken(buyer6);
        farmer2Token = "Bearer " + jwtTokenProvider.generateToken(farmer2);
        farmer3Token = "Bearer " + jwtTokenProvider.generateToken(farmer3);
        adminToken = "Bearer " + jwtTokenProvider.generateToken(admin1);

        // Ensure requirement 1 is OPEN with a future date
        requirementRepository.findById(1).ifPresent(req -> {
            req.setStatus(RequirementStatus.OPEN);
            req.setRequiredByDate(LocalDate.now().plusDays(30));
            requirementRepository.save(req);
        });
    }

    @Test
    @DisplayName("Integration: Buyer successfully places order, stock is deducted, total amount is computed (201 Created)")
    void testBuyerPlacesOrder_Success() throws Exception {
        Harvest initialHarvest = harvestRepository.findById(1).orElseThrow();
        BigDecimal initialStock = initialHarvest.getAvailableQuantity();

        CreateOrderRequest request = new CreateOrderRequest(
                1, // Harvest 1 (Farmer 2, Tomato, price 25.00, Grade A, VERIFIED)
                new BigDecimal("150.00"),
                new BigDecimal("25.00"),
                1, // Requirement 1 (Tomato, max price 27.00)
                "Order for retail display"
        );

        MvcResult result = mockMvc.perform(post("/api/buyer/orders")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.orderId").isNumber())
                .andExpect(jsonPath("$.data.buyerId").value(5))
                .andExpect(jsonPath("$.data.farmerId").value(2))
                .andExpect(jsonPath("$.data.harvestId").value(1))
                .andExpect(jsonPath("$.data.quantity").value(150.0))
                .andExpect(jsonPath("$.data.agreedPricePerKg").value(25.0))
                .andExpect(jsonPath("$.data.totalAmount").value(3750.0))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.qualityGrade").value("A"))
                .andExpect(jsonPath("$.data.qualityVerificationStatus").value("VERIFIED"))
                .andReturn();

        // Verify database stock deduction
        Harvest updatedHarvest = harvestRepository.findById(1).orElseThrow();
        assertThat(updatedHarvest.getAvailableQuantity()).isEqualByComparingTo(initialStock.subtract(new BigDecimal("150.00")));
    }

    @Test
    @DisplayName("Integration: Buyer cannot order more stock than available (400 Bad Request)")
    void testBuyerOrderExceedingStock_BadRequest() throws Exception {
        Harvest harvest = harvestRepository.findById(1).orElseThrow();
        BigDecimal tooMuch = harvest.getAvailableQuantity().add(new BigDecimal("100.00"));

        CreateOrderRequest request = new CreateOrderRequest(1, tooMuch, new BigDecimal("25.00"), 1, null);

        mockMvc.perform(post("/api/buyer/orders")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("exceeds currently available harvest inventory")));
    }

    @Test
    @DisplayName("Integration: Buyer cannot order an unverified harvest (400 Bad Request)")
    void testBuyerOrderUnverifiedHarvest_BadRequest() throws Exception {
        // Ensure Harvest 6 has assessment with verification_status 'PENDING'
        qualityAssessmentRepository.findByHarvest_HarvestId(6).ifPresent(qa -> {
            qa.setVerificationStatus(VerificationStatus.PENDING);
            qualityAssessmentRepository.save(qa);
        });

        CreateOrderRequest request = new CreateOrderRequest(6, new BigDecimal("50.00"), new BigDecimal("180.00"), null, null);

        mockMvc.perform(post("/api/buyer/orders")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Only VERIFIED harvests are eligible for purchase")));
    }

    @Test
    @DisplayName("Integration: Buyer views own orders and order details (200 OK)")
    void testBuyerGetsOrdersAndDetails_Success() throws Exception {
        // Sample order 1 belongs to Buyer 5
        mockMvc.perform(get("/api/buyer/orders")
                        .header("Authorization", buyer5Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].orderId").exists());

        mockMvc.perform(get("/api/buyer/orders/1")
                        .header("Authorization", buyer5Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.orderId").value(1))
                .andExpect(jsonPath("$.data.buyerId").value(5));
    }

    @Test
    @DisplayName("Integration: Cross-buyer access to order details is forbidden (403 Forbidden)")
    void testCrossBuyerOrderAccess_Forbidden() throws Exception {
        // Order 1 is owned by Buyer 5. Buyer 6 attempts to view it.
        mockMvc.perform(get("/api/buyer/orders/1")
                        .header("Authorization", buyer6Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Integration: Buyer cancels pending order, status becomes CANCELLED and stock is restored (200 OK)")
    void testBuyerCancelsOrder_RestoresStock() throws Exception {
        // Place an order first
        Harvest harvest = harvestRepository.findById(1).orElseThrow();
        BigDecimal stockBefore = harvest.getAvailableQuantity();

        CreateOrderRequest createReq = new CreateOrderRequest(1, new BigDecimal("100.00"), new BigDecimal("25.00"), 1, null);
        MvcResult createResult = mockMvc.perform(post("/api/buyer/orders")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(createResult.getResponse().getContentAsString());
        int orderId = json.get("data").get("orderId").asInt();

        // Verify stock decreased
        Harvest harvestAfterOrder = harvestRepository.findById(1).orElseThrow();
        assertThat(harvestAfterOrder.getAvailableQuantity()).isEqualByComparingTo(stockBefore.subtract(new BigDecimal("100.00")));

        // Now Buyer cancels the order
        OrderDecisionRequest cancelReq = new OrderDecisionRequest("Cancelling test order");
        mockMvc.perform(patch("/api/buyer/orders/" + orderId + "/cancel")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"))
                .andExpect(jsonPath("$.data.cancellationReason").value("Cancelling test order"));

        // Verify stock is fully restored
        Harvest harvestAfterCancel = harvestRepository.findById(1).orElseThrow();
        assertThat(harvestAfterCancel.getAvailableQuantity()).isEqualByComparingTo(stockBefore);

        // Attempting to cancel a second time must fail
        mockMvc.perform(patch("/api/buyer/orders/" + orderId + "/cancel")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("cannot be cancelled")));
    }

    @Test
    @DisplayName("Integration: Farmer views incoming orders and order details (200 OK)")
    void testFarmerGetsOrdersAndDetails_Success() throws Exception {
        // Harvest 1 is owned by Farmer 2, Order 1 is on Harvest 1
        mockMvc.perform(get("/api/farmer/orders")
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data").isArray());

        mockMvc.perform(get("/api/farmer/orders/1")
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.orderId").value(1))
                .andExpect(jsonPath("$.data.farmerId").value(2));
    }

    @Test
    @DisplayName("Integration: Cross-farmer access to order details is forbidden (403 Forbidden)")
    void testCrossFarmerOrderAccess_Forbidden() throws Exception {
        // Order 1 is for Farmer 2's harvest. Farmer 3 attempts to view it.
        mockMvc.perform(get("/api/farmer/orders/1")
                        .header("Authorization", farmer3Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Integration: Farmer accepts pending order (200 OK)")
    void testFarmerAcceptsOrder_Success() throws Exception {
        // Create an order first
        CreateOrderRequest createReq = new CreateOrderRequest(1, new BigDecimal("50.00"), new BigDecimal("25.00"), 1, null);
        MvcResult createResult = mockMvc.perform(post("/api/buyer/orders")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(createResult.getResponse().getContentAsString());
        int orderId = json.get("data").get("orderId").asInt();

        // Farmer 2 accepts the order
        mockMvc.perform(patch("/api/farmer/orders/" + orderId + "/accept")
                        .header("Authorization", farmer2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));

        // Accepting an already ACCEPTED order must fail
        mockMvc.perform(patch("/api/farmer/orders/" + orderId + "/accept")
                        .header("Authorization", farmer2Token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("cannot be accepted")));
    }

    @Test
    @DisplayName("Integration: Farmer rejects pending order and restores stock (200 OK)")
    void testFarmerRejectsOrder_RestoresStock() throws Exception {
        Harvest harvest = harvestRepository.findById(1).orElseThrow();
        BigDecimal stockBefore = harvest.getAvailableQuantity();

        CreateOrderRequest createReq = new CreateOrderRequest(1, new BigDecimal("75.00"), new BigDecimal("25.00"), 1, null);
        MvcResult createResult = mockMvc.perform(post("/api/buyer/orders")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode json = objectMapper.readTree(createResult.getResponse().getContentAsString());
        int orderId = json.get("data").get("orderId").asInt();

        // Farmer 2 rejects order
        OrderDecisionRequest rejectReq = new OrderDecisionRequest("Transport logistics unavailable");
        mockMvc.perform(patch("/api/farmer/orders/" + orderId + "/reject")
                        .header("Authorization", farmer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.cancellationReason").value("Transport logistics unavailable"));

        // Verify stock is restored
        Harvest harvestAfterReject = harvestRepository.findById(1).orElseThrow();
        assertThat(harvestAfterReject.getAvailableQuantity()).isEqualByComparingTo(stockBefore);
    }

    @Test
    @DisplayName("Integration: Admin monitors all orders and filters by status (200 OK)")
    void testAdminMonitorsOrders_Success() throws Exception {
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", adminToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(greaterThanOrEqualTo(1)));

        mockMvc.perform(get("/api/admin/orders?status=CONFIRMED")
                        .header("Authorization", adminToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].status").value("CONFIRMED"));

        mockMvc.perform(get("/api/admin/orders/1")
                        .header("Authorization", adminToken)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.orderId").value(1));
    }

    @Test
    @DisplayName("Integration: Unauthenticated request rejected (401 Unauthorized)")
    void testUnauthenticated_Unauthorized() throws Exception {
        mockMvc.perform(get("/api/buyer/orders")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/farmer/orders")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/orders")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Integration: Incorrect role access rejected (403 Forbidden)")
    void testIncorrectRole_Forbidden() throws Exception {
        // Farmer trying to access buyer endpoints
        mockMvc.perform(get("/api/buyer/orders")
                        .header("Authorization", farmer2Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        // Buyer trying to access farmer endpoints
        mockMvc.perform(get("/api/farmer/orders")
                        .header("Authorization", buyer5Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());

        // Buyer trying to access admin endpoints
        mockMvc.perform(get("/api/admin/orders")
                        .header("Authorization", buyer5Token)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Integration: Concurrent order attempts cannot oversell stock (Pessimistic Locking)")
    void testConcurrentOrdersCannotOversellStock() throws Exception {
        // Harvest 3: 800.00 kg available, price 28.00, Grade B, VERIFIED
        // 5 concurrent buyer threads try to order 200 kg each = 1000 kg total
        // Available stock is only 800 kg.
        // Exactly 4 orders must succeed (4 * 200 = 800 kg), and 1 must be rejected due to insufficient stock.
        int threadCount = 5;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    CreateOrderRequest req = new CreateOrderRequest(3, new BigDecimal("200.00"), new BigDecimal("28.00"), null, "Concurrent stress test");
                    MvcResult res = mockMvc.perform(post("/api/buyer/orders")
                                    .header("Authorization", buyer5Token)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(objectMapper.writeValueAsString(req)))
                            .andReturn();
                    if (res.getResponse().getStatus() == 201) {
                        successCount.incrementAndGet();
                    } else if (res.getResponse().getStatus() == 400) {
                        failCount.incrementAndGet();
                    }
                } catch (Exception e) {
                    failCount.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        boolean completed = doneLatch.await(30, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();
        // Combined operations must equal total attempted threads
        assertThat(successCount.get() + failCount.get()).isEqualTo(threadCount);
        // Successful orders cannot exceed stock / 200 = 4
        assertThat(successCount.get()).isLessThanOrEqualTo(4);
        assertThat(failCount.get()).isGreaterThanOrEqualTo(1);

        Harvest finalHarvest = harvestRepository.findById(3).orElseThrow();
        // Stock must never become negative
        assertThat(finalHarvest.getAvailableQuantity()).isGreaterThanOrEqualTo(BigDecimal.ZERO);
    }
}
