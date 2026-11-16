package com.agriconnect;

import com.agriconnect.dto.CreateDeliveryRequest;
import com.agriconnect.dto.CreateOrderRequest;
import com.agriconnect.dto.UpdateDeliveryStatusRequest;
import com.agriconnect.entity.OrderStatus;
import com.agriconnect.entity.RequirementStatus;
import com.agriconnect.entity.User;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class DeliveryIntegrationTest {

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
    private DeliveryRepository deliveryRepository;

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
                1, new BigDecimal("100.00"), new BigDecimal("25.00"), 1, "Order for delivery test"
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
    @DisplayName("Integration: Buyer creates delivery for accepted order, transitions Order to CONFIRMED (201 Created)")
    void testBuyerCreatesDelivery_Success() throws Exception {
        Integer orderId = createAndAcceptOrder();

        CreateDeliveryRequest deliveryReq = new CreateDeliveryRequest(
                orderId, "Godown 4, APMC Market, Vashi, Navi Mumbai", "MH-04-DE-1234", null, "Urgent delivery"
        );

        MvcResult result = mockMvc.perform(post("/api/buyer/deliveries")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deliveryReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.deliveryId").isNumber())
                .andExpect(jsonPath("$.data.orderId").value(orderId))
                .andExpect(jsonPath("$.data.deliveryStatus").value("PENDING"))
                .andExpect(jsonPath("$.data.deliveryAddress").value("Godown 4, APMC Market, Vashi, Navi Mumbai"))
                .andExpect(jsonPath("$.data.trackingNumber").isNotEmpty())
                .andReturn();

        JsonNode node = objectMapper.readTree(result.getResponse().getContentAsString());
        Integer deliveryId = node.path("data").path("deliveryId").asInt();

        // Verify Order is now CONFIRMED
        com.agriconnect.entity.Order updatedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(updatedOrder.getOrderStatus()).isEqualTo(OrderStatus.CONFIRMED);

        // Buyer can view own delivery
        mockMvc.perform(get("/api/buyer/deliveries/" + deliveryId)
                        .header("Authorization", buyer5Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deliveryId").value(deliveryId));
    }

    @Test
    @DisplayName("Integration: Duplicate delivery creation for same order is rejected (400 Bad Request)")
    void testDuplicateDeliveryCreation_Rejected() throws Exception {
        Integer orderId = createAndAcceptOrder();

        CreateDeliveryRequest req1 = new CreateDeliveryRequest(
                orderId, "Address 1", null, null, null
        );
        mockMvc.perform(post("/api/buyer/deliveries")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        // Second delivery creation for same order must fail
        CreateDeliveryRequest req2 = new CreateDeliveryRequest(
                orderId, "Address 2", null, null, null
        );
        mockMvc.perform(post("/api/buyer/deliveries")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("already exists")));
    }

    @Test
    @DisplayName("Integration: Nonexistent order returns 404 Not Found")
    void testDeliveryNonexistentOrder_NotFound() throws Exception {
        CreateDeliveryRequest req = new CreateDeliveryRequest(
                99999, "Address", null, null, null
        );
        mockMvc.perform(post("/api/buyer/deliveries")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Integration: Cross-buyer IDOR protection returns 403 Forbidden")
    void testCrossBuyerAccess_Forbidden() throws Exception {
        Integer orderId = createAndAcceptOrder();

        CreateDeliveryRequest deliveryReq = new CreateDeliveryRequest(
                orderId, "Buyer 5 Address", null, null, null
        );
        MvcResult res = mockMvc.perform(post("/api/buyer/deliveries")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deliveryReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer deliveryId = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("deliveryId").asInt();

        // Buyer 6 (foreign buyer) attempts to view delivery of Buyer 5
        mockMvc.perform(get("/api/buyer/deliveries/" + deliveryId)
                        .header("Authorization", buyer6Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Integration: Farmer ships delivery and order atomically transitions to SHIPPED")
    void testFarmerShipsDelivery_Success() throws Exception {
        Integer orderId = createAndAcceptOrder();

        CreateDeliveryRequest deliveryReq = new CreateDeliveryRequest(
                orderId, "Delivery Address Pune", "MH-12-PQ-9999", null, null
        );
        MvcResult res = mockMvc.perform(post("/api/buyer/deliveries")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deliveryReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer deliveryId = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("deliveryId").asInt();

        // Farmer 2 ships delivery
        UpdateDeliveryStatusRequest shipReq = new UpdateDeliveryStatusRequest(
                "TRK-CUSTOM-SHIP-01", "MH-12-PQ-9999", "Produce dispatched via temperature controlled van"
        );

        mockMvc.perform(patch("/api/farmer/deliveries/" + deliveryId + "/ship")
                        .header("Authorization", farmer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(shipReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deliveryStatus").value("SHIPPED"))
                .andExpect(jsonPath("$.data.trackingNumber").value("TRK-CUSTOM-SHIP-01"))
                .andExpect(jsonPath("$.data.dispatchedAt").isNotEmpty());

        // Verify Order status is SHIPPED
        com.agriconnect.entity.Order updatedOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(updatedOrder.getOrderStatus()).isEqualTo(OrderStatus.SHIPPED);
    }

    @Test
    @DisplayName("Integration: Foreign farmer cannot ship delivery (403 Forbidden)")
    void testForeignFarmerCannotShip_Forbidden() throws Exception {
        Integer orderId = createAndAcceptOrder();

        CreateDeliveryRequest deliveryReq = new CreateDeliveryRequest(
                orderId, "Delivery Address", null, null, null
        );
        MvcResult res = mockMvc.perform(post("/api/buyer/deliveries")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deliveryReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer deliveryId = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("deliveryId").asInt();

        // Farmer 3 (foreign farmer) attempts to ship delivery belonging to Farmer 2
        mockMvc.perform(patch("/api/farmer/deliveries/" + deliveryId + "/ship")
                        .header("Authorization", farmer3Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Integration: Complete delivery lifecycle (SHIPPED -> DELIVERED) and order synchronization")
    void testCompleteDeliveryLifecycle_Success() throws Exception {
        Integer orderId = createAndAcceptOrder();

        CreateDeliveryRequest deliveryReq = new CreateDeliveryRequest(
                orderId, "Pune Distribution Center", null, null, null
        );
        MvcResult res = mockMvc.perform(post("/api/buyer/deliveries")
                        .header("Authorization", buyer5Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(deliveryReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer deliveryId = objectMapper.readTree(res.getResponse().getContentAsString()).path("data").path("deliveryId").asInt();

        // 1. Ship
        mockMvc.perform(patch("/api/farmer/deliveries/" + deliveryId + "/ship")
                        .header("Authorization", farmer2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deliveryStatus").value("SHIPPED"));

        // 2. Deliver
        mockMvc.perform(patch("/api/farmer/deliveries/" + deliveryId + "/deliver")
                        .header("Authorization", farmer2Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deliveryStatus").value("DELIVERED"))
                .andExpect(jsonPath("$.data.deliveredAt").isNotEmpty());

        // Verify Order is DELIVERED
        com.agriconnect.entity.Order finalOrder = orderRepository.findById(orderId).orElseThrow();
        assertThat(finalOrder.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);

        // 3. Invalid backward transition: DELIVERED -> SHIPPED must be rejected (400)
        mockMvc.perform(patch("/api/farmer/deliveries/" + deliveryId + "/ship")
                        .header("Authorization", farmer2Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Integration: Security - Unauthenticated requests return 401 Unauthorized")
    void testSecurity_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(get("/api/buyer/deliveries"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/farmer/deliveries"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/deliveries"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Integration: Security - Wrong role returns 403 Forbidden")
    void testSecurity_WrongRole_Returns403() throws Exception {
        // Buyer accessing farmer deliveries endpoint
        mockMvc.perform(get("/api/farmer/deliveries")
                        .header("Authorization", buyer5Token))
                .andExpect(status().isForbidden());

        // Farmer accessing admin deliveries endpoint
        mockMvc.perform(get("/api/admin/deliveries")
                        .header("Authorization", farmer2Token))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Integration: Admin can view all deliveries across marketplace (200 OK)")
    void testAdminViewDeliveries_Success() throws Exception {
        mockMvc.perform(get("/api/admin/deliveries")
                        .header("Authorization", adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200));
    }
}
