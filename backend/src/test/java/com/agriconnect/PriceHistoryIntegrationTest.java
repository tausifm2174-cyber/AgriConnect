package com.agriconnect;

import com.agriconnect.dto.CreateOrderRequest;
import com.agriconnect.dto.CreatePaymentRequest;
import com.agriconnect.entity.*;
import com.agriconnect.repository.*;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PriceHistoryIntegrationTest {

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

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PriceHistoryRepository priceHistoryRepository;

    private String buyerToken;
    private String farmerToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        User buyer = userRepository.findById(5).orElseThrow();
        User farmer = userRepository.findById(2).orElseThrow();
        User admin = userRepository.findById(1).orElseThrow();

        buyerToken = "Bearer " + jwtTokenProvider.generateToken(buyer);
        farmerToken = "Bearer " + jwtTokenProvider.generateToken(farmer);
        adminToken = "Bearer " + jwtTokenProvider.generateToken(admin);

        requirementRepository.findById(1).ifPresent(req -> {
            req.setStatus(RequirementStatus.OPEN);
            req.setRequiredByDate(LocalDate.now().plusDays(30));
            requirementRepository.save(req);
        });
    }

    private Integer createAndAcceptOrder() throws Exception {
        CreateOrderRequest orderReq = new CreateOrderRequest(
                1, new BigDecimal("100.00"), new BigDecimal("25.00"), 1, "Order for price history test"
        );
        MvcResult res = mockMvc.perform(post("/api/buyer/orders")
                        .header("Authorization", buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        Integer orderId = root.path("data").path("orderId").asInt();

        // Farmer 2 accepts the order
        mockMvc.perform(patch("/api/farmer/orders/" + orderId + "/accept")
                        .header("Authorization", farmerToken))
                .andExpect(status().isOk());

        return orderId;
    }

    @Test
    @DisplayName("End-to-End: Payment completion triggers PriceHistory recording and reflects in Analytics")
    void paymentTriggersPriceHistoryAndAnalytics() throws Exception {
        Integer orderId = createAndAcceptOrder();
        Order completedOrder = orderRepository.findById(orderId).orElseThrow();

        // 1. Submit payment for order
        CreatePaymentRequest paymentRequest = new CreatePaymentRequest();
        paymentRequest.setOrderId(orderId);
        paymentRequest.setAmount(completedOrder.getTotalAmount());
        paymentRequest.setPaymentMethod(PaymentMethod.UPI);
        paymentRequest.setPaymentStatus(PaymentStatus.COMPLETED);
        paymentRequest.setTransactionReference("UPI-PHASE11-TEST-" + System.currentTimeMillis());

        mockMvc.perform(post("/api/buyer/payments")
                        .header("Authorization", buyerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(200));

        // 2. Verify PriceHistory table now has the transaction sale record
        assertThat(priceHistoryRepository.existsByOrder_OrderId(orderId)).isTrue();
        PriceHistory ph = priceHistoryRepository.findByOrder_OrderId(orderId).orElseThrow();
        assertThat(ph.getSourceType()).isEqualTo(PriceSourceType.TRANSACTION_SALE);
        assertThat(ph.getUnitPrice()).isEqualByComparingTo("25.00");
        assertThat(ph.getQuantity()).isEqualByComparingTo("100.00");

        // 3. Farmer views sales price history
        mockMvc.perform(get("/api/farmer/price-history")
                        .header("Authorization", farmerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[?(@.orderId == " + orderId + ")].unitPrice").value(25.0));

        // 4. Buyer queries crop analytics
        mockMvc.perform(get("/api/buyer/price-history/analytics/" + ph.getCrop().getCropId())
                        .header("Authorization", buyerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.averagePrice").isNumber());

        // 5. Admin queries marketplace summary
        mockMvc.perform(get("/api/admin/price-history/summary")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.overallTransactionCount").isNumber());
    }

    @Test
    @DisplayName("RBAC: Farmers and Buyers cannot access Admin price history endpoint")
    void roleBasedAccessControl_enforced() throws Exception {
        // Buyer accessing admin endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/admin/price-history")
                        .header("Authorization", buyerToken))
                .andExpect(status().isForbidden());

        // Farmer accessing admin endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/admin/price-history")
                        .header("Authorization", farmerToken))
                .andExpect(status().isForbidden());

        // Buyer accessing farmer endpoint -> 403 Forbidden
        mockMvc.perform(get("/api/farmer/price-history")
                        .header("Authorization", buyerToken))
                .andExpect(status().isForbidden());
    }
}
