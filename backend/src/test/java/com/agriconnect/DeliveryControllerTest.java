package com.agriconnect;

import com.agriconnect.controller.AdminDeliveryController;
import com.agriconnect.controller.BuyerDeliveryController;
import com.agriconnect.controller.FarmerDeliveryController;
import com.agriconnect.dto.CreateDeliveryRequest;
import com.agriconnect.dto.DeliveryResponse;
import com.agriconnect.dto.UpdateDeliveryStatusRequest;
import com.agriconnect.entity.DeliveryStatus;
import com.agriconnect.entity.OrderStatus;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.entity.UserStatus;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.GlobalExceptionHandler;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.security.JwtAuthenticationFilter;
import com.agriconnect.security.JwtTokenProvider;
import com.agriconnect.service.DeliveryService;
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

@WebMvcTest(controllers = {BuyerDeliveryController.class, FarmerDeliveryController.class, AdminDeliveryController.class})
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class DeliveryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DeliveryService deliveryService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private CustomUserDetails buyerPrincipal;
    private CustomUserDetails farmerPrincipal;
    private CustomUserDetails adminPrincipal;
    private DeliveryResponse sampleResponse;

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

        sampleResponse = new DeliveryResponse();
        sampleResponse.setDeliveryId(101);
        sampleResponse.setOrderId(501);
        sampleResponse.setDeliveryStatus(DeliveryStatus.PENDING);
        sampleResponse.setTrackingNumber("TRK-20261116-ORD501-8888");
        sampleResponse.setDeliveryAddress("APMC Market Yard, Pune");
        sampleResponse.setOrderStatus(OrderStatus.CONFIRMED);
        sampleResponse.setQuantity(new BigDecimal("100.00"));
        sampleResponse.setTotalAmount(new BigDecimal("2500.00"));
        sampleResponse.setCropName("Tomato (Hybrid Red)");
        sampleResponse.setBuyerName("Buyer One");
        sampleResponse.setFarmerName("Farmer One");
        sampleResponse.setCreatedAt(LocalDateTime.now());
    }

    private void authenticateAs(CustomUserDetails userDetails) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("Buyer: Create delivery returns 201 Created")
    void testBuyerCreateDelivery_ReturnsCreated() throws Exception {
        authenticateAs(buyerPrincipal);

        CreateDeliveryRequest request = new CreateDeliveryRequest(501, "APMC Market Yard, Pune", "MH-12-1234", null, "Handle carefully");
        when(deliveryService.createDelivery(eq(10), eq(Role.BUYER), any(CreateDeliveryRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/buyer/deliveries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.deliveryId").value(101))
                .andExpect(jsonPath("$.data.orderId").value(501))
                .andExpect(jsonPath("$.data.deliveryStatus").value("PENDING"));
    }

    @Test
    @DisplayName("Buyer: Missing delivery address returns 400 Bad Request")
    void testBuyerCreateDelivery_MissingAddress_ReturnsBadRequest() throws Exception {
        authenticateAs(buyerPrincipal);

        CreateDeliveryRequest request = new CreateDeliveryRequest(501, "", null, null, null);

        mockMvc.perform(post("/api/buyer/deliveries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Buyer: Get own deliveries returns 200 OK")
    void testBuyerGetDeliveries_ReturnsOk() throws Exception {
        authenticateAs(buyerPrincipal);

        when(deliveryService.getBuyerDeliveries(10)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/buyer/deliveries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].deliveryId").value(101));
    }

    @Test
    @DisplayName("Buyer: Get foreign delivery returns 403 Forbidden")
    void testBuyerGetForeignDelivery_ReturnsForbidden() throws Exception {
        authenticateAs(buyerPrincipal);

        when(deliveryService.getBuyerDeliveryById(10, 999))
                .thenThrow(new AccessDeniedException("Access denied: You do not have permission to view delivery #999"));

        mockMvc.perform(get("/api/buyer/deliveries/999"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("Farmer: Ship delivery returns 200 OK and SHIPPED status")
    void testFarmerShipDelivery_ReturnsOk() throws Exception {
        authenticateAs(farmerPrincipal);

        sampleResponse.setDeliveryStatus(DeliveryStatus.SHIPPED);
        sampleResponse.setOrderStatus(OrderStatus.SHIPPED);
        sampleResponse.setDispatchedAt(LocalDateTime.now());

        UpdateDeliveryStatusRequest request = new UpdateDeliveryStatusRequest("TRK-NEW", "MH-12-9999", "Shipped");
        when(deliveryService.shipDelivery(eq(20), eq(101), any(UpdateDeliveryStatusRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/farmer/deliveries/101/ship")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deliveryStatus").value("SHIPPED"))
                .andExpect(jsonPath("$.data.orderStatus").value("SHIPPED"));
    }

    @Test
    @DisplayName("Farmer: Invalid status transition returns 400 Bad Request")
    void testFarmerShipDelivery_InvalidTransition_ReturnsBadRequest() throws Exception {
        authenticateAs(farmerPrincipal);

        when(deliveryService.shipDelivery(eq(20), eq(101), any()))
                .thenThrow(new BadRequestException("Delivery #101 cannot transition from DELIVERED to SHIPPED."));

        mockMvc.perform(patch("/api/farmer/deliveries/101/ship"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("cannot transition")));
    }

    @Test
    @DisplayName("Farmer: Complete delivery returns 200 OK and DELIVERED status")
    void testFarmerDeliver_ReturnsOk() throws Exception {
        authenticateAs(farmerPrincipal);

        sampleResponse.setDeliveryStatus(DeliveryStatus.DELIVERED);
        sampleResponse.setOrderStatus(OrderStatus.DELIVERED);
        sampleResponse.setDeliveredAt(LocalDateTime.now());

        when(deliveryService.markAsDelivered(eq(20), eq(Role.FARMER), eq(101), any()))
                .thenReturn(sampleResponse);

        mockMvc.perform(patch("/api/farmer/deliveries/101/deliver"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deliveryStatus").value("DELIVERED"))
                .andExpect(jsonPath("$.data.orderStatus").value("DELIVERED"));
    }

    @Test
    @DisplayName("Admin: Get all deliveries returns 200 OK")
    void testAdminGetAllDeliveries_ReturnsOk() throws Exception {
        authenticateAs(adminPrincipal);

        when(deliveryService.getAllDeliveries(null)).thenReturn(List.of(sampleResponse));

        mockMvc.perform(get("/api/admin/deliveries"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].deliveryId").value(101));
    }
}
