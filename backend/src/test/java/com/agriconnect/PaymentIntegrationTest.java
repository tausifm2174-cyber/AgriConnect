package com.agriconnect;

import com.agriconnect.dto.CreateOrderRequest;
import com.agriconnect.dto.CreatePaymentRequest;
import com.agriconnect.dto.UpdatePaymentStatusRequest;
import com.agriconnect.entity.OrderStatus;
import com.agriconnect.entity.PaymentMethod;
import com.agriconnect.entity.PaymentStatus;
import com.agriconnect.entity.RequirementStatus;
import com.agriconnect.entity.User;
import com.agriconnect.repository.BuyerRequirementRepository;
import com.agriconnect.repository.OrderRepository;
import com.agriconnect.repository.PaymentRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PaymentIntegrationTest {

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
    private PaymentRepository paymentRepository;

    private String buyer5Token;
    private String buyer6Token;
    private String farmer2Token;
    private String farmer3Token;
    private String adminToken;

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

        requirementRepository.findById(1).ifPresent(req -> {
            req.setStatus(RequirementStatus.OPEN);
            req.setRequiredByDate(LocalDate.now().plusDays(30));
            requirementRepository.save(req);
        });
    }

    private Integer createAndAcceptOrder() throws Exception {
        CreateOrderRequest orderReq = new CreateOrderRequest(
                1, new BigDecimal("100.00"), new BigDecimal("25.00"), 1, "Order for payment test"
        );
        MvcResult res = mockMvc.perform(post("/api/buyer/orders")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(orderReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode root = objectMapper.readTree(res.getResponse().getContentAsString());
        Integer orderId = root.path("data").path("orderId").asInt();

        // Farmer 2 accepts the order
        mockMvc.perform(patch("/api/farmer/orders/" + orderId + "/accept")
                        .header("Authorization", farmer2Token))
                .andExpect(status().isOk());

        return orderId;
    }

    @Test
    @DisplayName("Integration: Buyer creates payment for accepted order, transitions Order to CONFIRMED")
    void testBuyerCreatePayment_Success() throws Exception {
        Integer orderId = createAndAcceptOrder();

        CreatePaymentRequest paymentReq = new CreatePaymentRequest(
                orderId, new BigDecimal("1000.00"), PaymentMethod.UPI, null, "Advance payment"
        );

        MvcResult result = mockMvc.perform(post("/api/buyer/payments")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.orderId").value(orderId))
                .andExpect(jsonPath("$.data.amount").value(1000.00))
                .andExpect(jsonPath("$.data.paymentStatus").value("COMPLETED"))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        Integer paymentId = root.path("data").path("paymentId").asInt();

        assertThat(paymentRepository.findById(paymentId)).isPresent();
        assertThat(orderRepository.findById(orderId).orElseThrow().getOrderStatus()).isEqualTo(OrderStatus.CONFIRMED);
    }

    @Test
    @DisplayName("Integration: Multi-stage payments and balance tracking")
    void testMultiStagePaymentsAndBalance() throws Exception {
        Integer orderId = createAndAcceptOrder(); // Total amount = 2500.00

        // 1. First partial payment (₹1000)
        CreatePaymentRequest pay1 = new CreatePaymentRequest(
                orderId, new BigDecimal("1000.00"), PaymentMethod.BANK_TRANSFER, null, "Deposit"
        );
        mockMvc.perform(post("/api/buyer/payments")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pay1)))
                .andExpect(status().isCreated());

        // Check summary: remaining = 1500
        mockMvc.perform(get("/api/buyer/payments/order/" + orderId)
                        .header("Authorization", buyer5Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalPaid").value(1000.00))
                .andExpect(jsonPath("$.data.remainingBalance").value(1500.00))
                .andExpect(jsonPath("$.data.fullyPaid").value(false));

        // 2. Final settlement (₹1500)
        CreatePaymentRequest pay2 = new CreatePaymentRequest(
                orderId, new BigDecimal("1500.00"), PaymentMethod.UPI, null, "Final payment"
        );
        mockMvc.perform(post("/api/buyer/payments")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(pay2)))
                .andExpect(status().isCreated());

        // Check summary: remaining = 0, fullyPaid = true
        mockMvc.perform(get("/api/buyer/payments/order/" + orderId)
                        .header("Authorization", buyer5Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalPaid").value(2500.00))
                .andExpect(jsonPath("$.data.remainingBalance").value(0.00))
                .andExpect(jsonPath("$.data.fullyPaid").value(true));

        // 3. Attempting extra payment when fully paid fails with 400
        CreatePaymentRequest payExtra = new CreatePaymentRequest(
                orderId, new BigDecimal("100.00"), PaymentMethod.CASH, null, "Extra"
        );
        mockMvc.perform(post("/api/buyer/payments")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payExtra)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("is already fully paid")));
    }

    @Test
    @DisplayName("Integration: Overpayment is strictly rejected with 400 Bad Request")
    void testOverpaymentRejection() throws Exception {
        Integer orderId = createAndAcceptOrder(); // Total amount = 2500.00

        CreatePaymentRequest excessPayment = new CreatePaymentRequest(
                orderId, new BigDecimal("3000.00"), PaymentMethod.UPI, null, "Too much"
        );

        mockMvc.perform(post("/api/buyer/payments")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(excessPayment)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("exceeds remaining balance")));
    }

    @Test
    @DisplayName("Integration: Security - Other buyer cannot pay for or view buyer's order payments (403 Forbidden)")
    void testBuyerTenantIsolation() throws Exception {
        Integer orderId = createAndAcceptOrder(); // Owned by Buyer 5

        CreatePaymentRequest hijackPayment = new CreatePaymentRequest(
                orderId, new BigDecimal("500.00"), PaymentMethod.UPI, null, "Hijack"
        );

        // Buyer 6 tries to pay for Buyer 5's order
        mockMvc.perform(post("/api/buyer/payments")
                        .header("Authorization", buyer6Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(hijackPayment)))
                .andExpect(status().isForbidden());

        // Make valid payment first
        CreatePaymentRequest validPay = new CreatePaymentRequest(
                orderId, new BigDecimal("500.00"), PaymentMethod.UPI, null, "Legit"
        );
        MvcResult res = mockMvc.perform(post("/api/buyer/payments")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validPay)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer paymentId = objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("paymentId").asInt();

        // Buyer 6 tries to view payment
        mockMvc.perform(get("/api/buyer/payments/" + paymentId)
                        .header("Authorization", buyer6Token))
                .andExpect(status().isForbidden());

        // Farmer 3 (unrelated farmer) tries to view payment
        mockMvc.perform(get("/api/farmer/payments/" + paymentId)
                        .header("Authorization", farmer3Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Integration: Farmer can view received payments for own harvest order")
    void testFarmerCanViewReceivedPayments() throws Exception {
        Integer orderId = createAndAcceptOrder(); // Farmer 2 is the seller

        CreatePaymentRequest paymentReq = new CreatePaymentRequest(
                orderId, new BigDecimal("500.00"), PaymentMethod.BANK_TRANSFER, null, "Advance"
        );
        MvcResult res = mockMvc.perform(post("/api/buyer/payments")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer paymentId = objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("paymentId").asInt();

        // Farmer 2 views payment
        mockMvc.perform(get("/api/farmer/payments/" + paymentId)
                        .header("Authorization", farmer2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentId").value(paymentId))
                .andExpect(jsonPath("$.data.amount").value(500.00));
    }

    @Test
    @DisplayName("Integration: Admin can view all payments and update status to REFUNDED")
    void testAdminPaymentAuditAndRefund() throws Exception {
        Integer orderId = createAndAcceptOrder();

        CreatePaymentRequest paymentReq = new CreatePaymentRequest(
                orderId, new BigDecimal("1000.00"), PaymentMethod.UPI, null, "To refund"
        );
        MvcResult res = mockMvc.perform(post("/api/buyer/payments")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(paymentReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer paymentId = objectMapper.readTree(res.getResponse().getContentAsString())
                .path("data").path("paymentId").asInt();

        // Admin views all payments
        mockMvc.perform(get("/api/admin/payments")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));

        // Admin updates status to REFUNDED
        UpdatePaymentStatusRequest refundReq = new UpdatePaymentStatusRequest(PaymentStatus.REFUNDED, "Buyer requested refund");
        mockMvc.perform(patch("/api/admin/payments/" + paymentId + "/status")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refundReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.paymentStatus").value("REFUNDED"));

        // Refunding frees up balance; check order summary
        mockMvc.perform(get("/api/buyer/payments/order/" + orderId)
                        .header("Authorization", buyer5Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalPaid").value(0.00))
                .andExpect(jsonPath("$.data.remainingBalance").value(2500.00));
    }
}
