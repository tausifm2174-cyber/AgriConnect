package com.agriconnect;

import com.agriconnect.controller.AdminPaymentController;
import com.agriconnect.controller.BuyerPaymentController;
import com.agriconnect.controller.FarmerPaymentController;
import com.agriconnect.dto.CreatePaymentRequest;
import com.agriconnect.dto.PaymentResponse;
import com.agriconnect.dto.PaymentSummaryDto;
import com.agriconnect.dto.UpdatePaymentStatusRequest;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.GlobalExceptionHandler;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.security.JwtAuthenticationFilter;
import com.agriconnect.security.JwtTokenProvider;
import com.agriconnect.service.PaymentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {BuyerPaymentController.class, FarmerPaymentController.class, AdminPaymentController.class})
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private CustomUserDetails buyerPrincipal;
    private CustomUserDetails farmerPrincipal;
    private CustomUserDetails adminPrincipal;
    private PaymentResponse sampleResponse;

    @BeforeEach
    void setUp() {
        User buyerUser = new User();
        buyerUser.setUserId(10);
        buyerUser.setEmail("buyer@freshmart.com");
        buyerUser.setFullName("Buyer One");
        buyerUser.setRole(Role.BUYER);
        buyerUser.setStatus(UserStatus.ACTIVE);
        buyerPrincipal = new CustomUserDetails(buyerUser);

        User farmerUser = new User();
        farmerUser.setUserId(20);
        farmerUser.setEmail("farmer@kisan.com");
        farmerUser.setFullName("Farmer One");
        farmerUser.setRole(Role.FARMER);
        farmerUser.setStatus(UserStatus.ACTIVE);
        farmerPrincipal = new CustomUserDetails(farmerUser);

        User adminUser = new User();
        adminUser.setUserId(1);
        adminUser.setEmail("admin@agriconnect.com");
        adminUser.setFullName("Admin One");
        adminUser.setRole(Role.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminPrincipal = new CustomUserDetails(adminUser);

        sampleResponse = new PaymentResponse();
        sampleResponse.setPaymentId(501);
        sampleResponse.setOrderId(100);
        sampleResponse.setAmount(new BigDecimal("2500.00"));
        sampleResponse.setPaymentMethod(PaymentMethod.UPI);
        sampleResponse.setPaymentStatus(PaymentStatus.COMPLETED);
        sampleResponse.setTransactionReference("TXN-20261116-ORD100-5555");
        sampleResponse.setRemarks("Full payment");
        sampleResponse.setOrderStatus(OrderStatus.CONFIRMED);
        sampleResponse.setOrderTotalAmount(new BigDecimal("2500.00"));
        sampleResponse.setCropName("Tomato (Hybrid Red)");
        sampleResponse.setBuyerName("Buyer One");
        sampleResponse.setFarmerName("Farmer One");
        sampleResponse.setPaymentDate(LocalDateTime.now());
    }

    private void authenticateAs(CustomUserDetails userDetails) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Buyer: Create payment returns 201 Created")
    void testBuyerCreatePayment_ReturnsCreated() throws Exception {
        authenticateAs(buyerPrincipal);

        CreatePaymentRequest request = new CreatePaymentRequest(100, new BigDecimal("2500.00"),
                PaymentMethod.UPI, "TXN-20261116-ORD100-5555", "Full payment");

        when(paymentService.createPayment(eq(10), eq(Role.BUYER), any(CreatePaymentRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/buyer/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.paymentId").value(501))
                .andExpect(jsonPath("$.data.amount").value(2500.00))
                .andExpect(jsonPath("$.data.paymentStatus").value("COMPLETED"));
    }

    @Test
    @DisplayName("Buyer: Create payment fails validation with 400 when amount is missing")
    void testBuyerCreatePayment_ValidationError() throws Exception {
        authenticateAs(buyerPrincipal);

        CreatePaymentRequest request = new CreatePaymentRequest();
        request.setOrderId(100);
        // amount is null

        mockMvc.perform(post("/api/buyer/payments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Buyer: Get my payments returns 200 OK")
    void testBuyerGetMyPayments_ReturnsOk() throws Exception {
        authenticateAs(buyerPrincipal);

        when(paymentService.getBuyerPayments(10)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/buyer/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].paymentId").value(501));
    }

    @Test
    @DisplayName("Buyer: Get payment by ID throws 403 on IDOR")
    void testBuyerGetPaymentById_AccessDenied() throws Exception {
        authenticateAs(buyerPrincipal);

        when(paymentService.getBuyerPaymentById(10, 999))
                .thenThrow(new AccessDeniedException("Access denied: You do not have permission to view payment #999"));

        mockMvc.perform(get("/api/buyer/payments/999"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Farmer: Get my payments returns 200 OK")
    void testFarmerGetMyPayments_ReturnsOk() throws Exception {
        authenticateAs(farmerPrincipal);

        when(paymentService.getFarmerPayments(20)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/farmer/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].paymentId").value(501));
    }

    @Test
    @DisplayName("Admin: Get all payments returns 200 OK")
    void testAdminGetAllPayments_ReturnsOk() throws Exception {
        authenticateAs(adminPrincipal);

        when(paymentService.getAllPayments(null, null)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/admin/payments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].paymentId").value(501));
    }

    @Test
    @DisplayName("Admin: Update payment status to REFUNDED returns 200 OK")
    void testAdminUpdatePaymentStatus_ReturnsOk() throws Exception {
        authenticateAs(adminPrincipal);

        sampleResponse.setPaymentStatus(PaymentStatus.REFUNDED);
        UpdatePaymentStatusRequest request = new UpdatePaymentStatusRequest(PaymentStatus.REFUNDED, "Quality dispute");

        when(paymentService.updatePaymentStatus(eq(1), eq(Role.ADMIN), eq(501), any(UpdatePaymentStatusRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/admin/payments/501/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.paymentStatus").value("REFUNDED"));
    }

    @Test
    @DisplayName("Buyer: Get order payment summary returns 200 OK")
    void testBuyerGetOrderPaymentSummary_ReturnsOk() throws Exception {
        authenticateAs(buyerPrincipal);

        PaymentSummaryDto summary = new PaymentSummaryDto(100, new BigDecimal("2500.00"),
                new BigDecimal("2500.00"), BigDecimal.ZERO, true, List.of(sampleResponse));

        when(paymentService.getOrderPaymentSummary(10, Role.BUYER, 100)).thenReturn(summary);

        mockMvc.perform(get("/api/buyer/payments/order/100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.orderId").value(100))
                .andExpect(jsonPath("$.data.fullyPaid").value(true));
    }
}
