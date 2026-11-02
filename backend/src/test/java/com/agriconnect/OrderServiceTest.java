package com.agriconnect;

import com.agriconnect.dto.CreateOrderRequest;
import com.agriconnect.dto.OrderDecisionRequest;
import com.agriconnect.dto.OrderResponse;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.*;
import com.agriconnect.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private HarvestRepository harvestRepository;

    @Mock
    private BuyerRequirementRepository requirementRepository;

    @Mock
    private QualityAssessmentRepository qualityAssessmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BuyerProfileRepository buyerProfileRepository;

    @Mock
    private FarmerProfileRepository farmerProfileRepository;

    @InjectMocks
    private OrderService orderService;

    private User buyer;
    private User farmer;
    private Crop crop;
    private Harvest harvest;
    private QualityAssessment qualityAssessment;
    private BuyerRequirement requirement;

    @BeforeEach
    void setUp() {
        buyer = new User("Vikas Gupta", "vikas.gupta@freshmarts.com", "+919844455566", "hashedpass", Role.BUYER, UserStatus.ACTIVE);
        buyer.setUserId(5);

        farmer = new User("Rajesh Patel", "rajesh.patel@kisan.in", "+919811122233", "hashedpass", Role.FARMER, UserStatus.ACTIVE);
        farmer.setUserId(2);

        crop = new Crop("Tomato (Hybrid Red)", CropCategory.VEGETABLE, CropSeason.ALL_SEASON, "Firm tomatoes");
        crop.setCropId(1);

        harvest = new Harvest(farmer, crop, new BigDecimal("1000.00"), new BigDecimal("600.00"),
                new BigDecimal("25.00"), LocalDate.now().minusDays(5), "Nashik, Maharashtra", HarvestStatus.AVAILABLE);
        harvest.setHarvestId(10);

        User admin = new User("Ramesh Sharma (Admin)", "admin@agriconnect.org", "+919876543210", "hashedpass", Role.ADMIN, UserStatus.ACTIVE);
        admin.setUserId(1);

        qualityAssessment = new QualityAssessment(harvest, admin, 9, 9, 8, 9, 8,
                new BigDecimal("3.50"), new BigDecimal("92.50"), QualityGrade.A,
                VerificationStatus.VERIFIED, LocalDate.now().minusDays(4), "Certified Grade A");
        qualityAssessment.setAssessmentId(1);

        requirement = new BuyerRequirement(buyer, crop, new BigDecimal("400.00"), new BigDecimal("27.00"),
                QualityGrade.A, "Western India / Maharashtra", LocalDate.now().plusDays(10), RequirementStatus.OPEN);
        requirement.setRequirementId(100);
    }

    @Test
    @DisplayName("Unit: Buyer successfully places order, deducts stock and calculates total amount correctly")
    void testCreateOrder_Success() {
        CreateOrderRequest request = new CreateOrderRequest(10, new BigDecimal("400.00"), new BigDecimal("25.00"), 100, "Urgent supply");

        when(userRepository.findById(5)).thenReturn(Optional.of(buyer));
        when(harvestRepository.findByIdForUpdate(10)).thenReturn(Optional.of(harvest));
        when(qualityAssessmentRepository.findByHarvest_HarvestId(10)).thenReturn(Optional.of(qualityAssessment));
        when(requirementRepository.findById(100)).thenReturn(Optional.of(requirement));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order o = invocation.getArgument(0);
            o.setOrderId(501);
            return o;
        });

        OrderResponse response = orderService.createOrder(5, request);

        assertThat(response).isNotNull();
        assertThat(response.getOrderId()).isEqualTo(501);
        assertThat(response.getQuantity()).isEqualByComparingTo("400.00");
        assertThat(response.getAgreedPricePerKg()).isEqualByComparingTo("25.00");
        assertThat(response.getTotalAmount()).isEqualByComparingTo("10000.00");
        assertThat(response.getStatus()).isEqualTo(OrderStatus.PENDING);

        // Verify harvest available stock deducted: 600 - 400 = 200 kg
        assertThat(harvest.getAvailableQuantity()).isEqualByComparingTo("200.00");
        assertThat(harvest.getStatus()).isEqualTo(HarvestStatus.PARTIALLY_SOLD);
        verify(harvestRepository).save(harvest);
        verify(orderRepository).save(any(Order.class));
    }

    @Test
    @DisplayName("Unit: Placing order for exact remaining stock transitions harvest to SOLD_OUT")
    void testCreateOrder_ExactStockTransitionsToSoldOut() {
        CreateOrderRequest request = new CreateOrderRequest(10, new BigDecimal("600.00"), null, null, null);

        when(userRepository.findById(5)).thenReturn(Optional.of(buyer));
        when(harvestRepository.findByIdForUpdate(10)).thenReturn(Optional.of(harvest));
        when(qualityAssessmentRepository.findByHarvest_HarvestId(10)).thenReturn(Optional.of(qualityAssessment));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderResponse response = orderService.createOrder(5, request);

        assertThat(response).isNotNull();
        assertThat(harvest.getAvailableQuantity()).isEqualByComparingTo("0.00");
        assertThat(harvest.getStatus()).isEqualTo(HarvestStatus.SOLD_OUT);
    }

    @Test
    @DisplayName("Unit: Rejects order when requested quantity exceeds available stock")
    void testCreateOrder_ExceedsStock_Fails() {
        CreateOrderRequest request = new CreateOrderRequest(10, new BigDecimal("650.00"), null, null, null);

        when(userRepository.findById(5)).thenReturn(Optional.of(buyer));
        when(harvestRepository.findByIdForUpdate(10)).thenReturn(Optional.of(harvest));
        when(qualityAssessmentRepository.findByHarvest_HarvestId(10)).thenReturn(Optional.of(qualityAssessment));

        assertThatThrownBy(() -> orderService.createOrder(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("exceeds currently available harvest inventory");

        // Verify no stock deduction happened
        assertThat(harvest.getAvailableQuantity()).isEqualByComparingTo("600.00");
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Unit: Rejects order with zero or negative quantity")
    void testCreateOrder_NegativeOrZeroQuantity_Fails() {
        CreateOrderRequest request = new CreateOrderRequest(10, new BigDecimal("0.00"), null, null, null);
        when(userRepository.findById(5)).thenReturn(Optional.of(buyer));

        assertThatThrownBy(() -> orderService.createOrder(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Order quantity must be positive");

        verify(harvestRepository, never()).findByIdForUpdate(any());
    }

    @Test
    @DisplayName("Unit: Rejects order when harvest quality is PENDING or REJECTED")
    void testCreateOrder_UnverifiedHarvest_Fails() {
        qualityAssessment.setVerificationStatus(VerificationStatus.PENDING);
        CreateOrderRequest request = new CreateOrderRequest(10, new BigDecimal("100.00"), null, null, null);

        when(userRepository.findById(5)).thenReturn(Optional.of(buyer));
        when(harvestRepository.findByIdForUpdate(10)).thenReturn(Optional.of(harvest));
        when(qualityAssessmentRepository.findByHarvest_HarvestId(10)).thenReturn(Optional.of(qualityAssessment));

        assertThatThrownBy(() -> orderService.createOrder(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Only VERIFIED harvests are eligible for purchase");
    }

    @Test
    @DisplayName("Unit: Rejects order when buyer attempts to buy their own harvest")
    void testCreateOrder_SelfPurchase_Fails() {
        harvest.setFarmer(buyer); // Same user
        CreateOrderRequest request = new CreateOrderRequest(10, new BigDecimal("100.00"), null, null, null);

        when(userRepository.findById(5)).thenReturn(Optional.of(buyer));
        when(harvestRepository.findByIdForUpdate(10)).thenReturn(Optional.of(harvest));

        assertThatThrownBy(() -> orderService.createOrder(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Buyers cannot place orders for their own harvested lots");
    }

    @Test
    @DisplayName("Unit: Rejects order when agreed price exceeds requirement max price")
    void testCreateOrder_PriceExceedsRequirementMax_Fails() {
        requirement.setMaxPricePerKg(new BigDecimal("24.00")); // Requirement ceiling 24.00
        // Harvest price is 25.00
        CreateOrderRequest request = new CreateOrderRequest(10, new BigDecimal("100.00"), null, 100, null);

        when(userRepository.findById(5)).thenReturn(Optional.of(buyer));
        when(harvestRepository.findByIdForUpdate(10)).thenReturn(Optional.of(harvest));
        when(qualityAssessmentRepository.findByHarvest_HarvestId(10)).thenReturn(Optional.of(qualityAssessment));
        when(requirementRepository.findById(100)).thenReturn(Optional.of(requirement));

        assertThatThrownBy(() -> orderService.createOrder(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("exceeds requirement maximum ceiling price");
    }

    @Test
    @DisplayName("Unit: Farmer accepts PENDING order successfully")
    void testFarmerAcceptsOrder_Success() {
        Order order = new Order(buyer, harvest, requirement, new BigDecimal("200.00"), new BigDecimal("25.00"),
                new BigDecimal("5000.00"), OrderStatus.PENDING, null);
        order.setOrderId(1);

        when(orderRepository.findByIdForUpdate(1)).thenReturn(Optional.of(order));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = orderService.acceptFarmerOrder(2, 1);

        assertThat(response.getStatus()).isEqualTo(OrderStatus.ACCEPTED);
        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.ACCEPTED);
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("Unit: Farmer rejects PENDING order and restores reserved stock exactly once")
    void testFarmerRejectsOrder_RestoresStock() {
        // Harvest currently has 400 kg available (600 - 200 was reserved)
        harvest.setAvailableQuantity(new BigDecimal("400.00"));

        Order order = new Order(buyer, harvest, requirement, new BigDecimal("200.00"), new BigDecimal("25.00"),
                new BigDecimal("5000.00"), OrderStatus.PENDING, null);
        order.setOrderId(1);

        when(orderRepository.findByIdForUpdate(1)).thenReturn(Optional.of(order));
        when(harvestRepository.findByIdForUpdate(10)).thenReturn(Optional.of(harvest));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = orderService.rejectFarmerOrder(2, 1, new OrderDecisionRequest("Quality dispute"));

        assertThat(response.getStatus()).isEqualTo(OrderStatus.REJECTED);
        assertThat(order.getCancellationReason()).isEqualTo("Quality dispute");
        // Stock restored: 400 + 200 = 600 kg
        assertThat(harvest.getAvailableQuantity()).isEqualByComparingTo("600.00");
        verify(harvestRepository).save(harvest);
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("Unit: Buyer cancels PENDING order and restores reserved stock exactly once")
    void testBuyerCancelsOrder_RestoresStock() {
        harvest.setAvailableQuantity(new BigDecimal("350.00"));

        Order order = new Order(buyer, harvest, requirement, new BigDecimal("250.00"), new BigDecimal("25.00"),
                new BigDecimal("6250.00"), OrderStatus.PENDING, null);
        order.setOrderId(2);

        when(orderRepository.findByIdForUpdate(2)).thenReturn(Optional.of(order));
        when(harvestRepository.findByIdForUpdate(10)).thenReturn(Optional.of(harvest));
        when(orderRepository.save(order)).thenReturn(order);

        OrderResponse response = orderService.cancelBuyerOrder(5, 2, new OrderDecisionRequest("Found alternate supplier"));

        assertThat(response.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.getCancellationReason()).isEqualTo("Found alternate supplier");
        // Stock restored: 350 + 250 = 600 kg
        assertThat(harvest.getAvailableQuantity()).isEqualByComparingTo("600.00");
        verify(harvestRepository).save(harvest);
    }

    @Test
    @DisplayName("Unit: Attempting to cancel an already CANCELLED or ACCEPTED order fails and does not restore stock twice")
    void testDoubleCancellation_Rejected() {
        Order order = new Order(buyer, harvest, requirement, new BigDecimal("200.00"), new BigDecimal("25.00"),
                new BigDecimal("5000.00"), OrderStatus.CANCELLED, null);
        order.setOrderId(3);

        when(orderRepository.findByIdForUpdate(3)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.cancelBuyerOrder(5, 3, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot be cancelled because its current status is CANCELLED");

        verify(harvestRepository, never()).findByIdForUpdate(any());
        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("Unit: Cross-buyer access to another buyer's order is forbidden (AccessDeniedException)")
    void testCrossBuyerAccess_Forbidden() {
        Order order = new Order(buyer, harvest, requirement, new BigDecimal("200.00"), new BigDecimal("25.00"),
                new BigDecimal("5000.00"), OrderStatus.PENDING, null);
        order.setOrderId(4);

        when(orderRepository.findById(4)).thenReturn(Optional.of(order));

        // Buyer 6 (Priya) attempts to access order owned by Buyer 5 (Vikas)
        assertThatThrownBy(() -> orderService.getBuyerOrderById(6, 4))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You do not have permission to view order");
    }

    @Test
    @DisplayName("Unit: Cross-farmer access to another farmer's order is forbidden (AccessDeniedException)")
    void testCrossFarmerAccess_Forbidden() {
        Order order = new Order(buyer, harvest, requirement, new BigDecimal("200.00"), new BigDecimal("25.00"),
                new BigDecimal("5000.00"), OrderStatus.PENDING, null);
        order.setOrderId(5);

        when(orderRepository.findById(5)).thenReturn(Optional.of(order));

        // Farmer 3 (Suresh) attempts to access order for harvest owned by Farmer 2 (Rajesh)
        assertThatThrownBy(() -> orderService.getFarmerOrderById(3, 5))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You do not have permission to view order");
    }
}
