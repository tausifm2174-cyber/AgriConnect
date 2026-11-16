package com.agriconnect;

import com.agriconnect.dto.AdminDashboardResponse;
import com.agriconnect.dto.RecentActivityResponse;
import com.agriconnect.entity.*;
import com.agriconnect.repository.*;
import com.agriconnect.service.AdminDashboardService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private CropRepository cropRepository;
    @Mock
    private HarvestRepository harvestRepository;
    @Mock
    private QualityAssessmentRepository qualityAssessmentRepository;
    @Mock
    private BuyerRequirementRepository buyerRequirementRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private DeliveryRepository deliveryRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PriceHistoryRepository priceHistoryRepository;

    @InjectMocks
    private AdminDashboardService adminDashboardService;

    private User sampleFarmer;
    private User sampleBuyer;
    private Crop sampleCrop;

    @BeforeEach
    void setUp() {
        sampleFarmer = new User("Ramesh Farmer", "ramesh@example.com", "9876543210", "hash", Role.FARMER, UserStatus.ACTIVE);
        sampleFarmer.setUserId(1);

        sampleBuyer = new User("Priya Buyer", "priya@example.com", "9876543211", "hash", Role.BUYER, UserStatus.ACTIVE);
        sampleBuyer.setUserId(2);

        sampleCrop = new Crop("Wheat", CropCategory.VEGETABLE, CropSeason.ALL_SEASON, "High yield");
        sampleCrop.setCropId(10);
    }

    @Test
    @DisplayName("getDashboardStats: Successfully aggregates platform-wide KPIs")
    void testGetDashboardStats() {
        when(userRepository.count()).thenReturn(15L);
        when(userRepository.countByRole(Role.FARMER)).thenReturn(8L);
        when(userRepository.countByRole(Role.BUYER)).thenReturn(5L);
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(2L);
        when(userRepository.countByStatus(UserStatus.ACTIVE)).thenReturn(14L);
        when(userRepository.countByStatus(UserStatus.INACTIVE)).thenReturn(1L);
        when(userRepository.countByStatus(UserStatus.SUSPENDED)).thenReturn(0L);

        when(cropRepository.count()).thenReturn(12L);

        when(harvestRepository.count()).thenReturn(25L);
        when(harvestRepository.countByStatus(HarvestStatus.AVAILABLE)).thenReturn(18L);
        when(harvestRepository.countByStatus(HarvestStatus.SOLD_OUT)).thenReturn(7L);

        when(qualityAssessmentRepository.count()).thenReturn(20L);
        when(qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.PENDING)).thenReturn(5L);
        when(qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.VERIFIED)).thenReturn(14L);
        when(qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.REJECTED)).thenReturn(1L);
        when(qualityAssessmentRepository.countByQualityGrade(QualityGrade.A)).thenReturn(10L);
        when(qualityAssessmentRepository.countByQualityGrade(QualityGrade.B)).thenReturn(8L);
        when(qualityAssessmentRepository.countByQualityGrade(QualityGrade.C)).thenReturn(2L);

        when(buyerRequirementRepository.count()).thenReturn(30L);
        when(buyerRequirementRepository.countByStatus(RequirementStatus.OPEN)).thenReturn(15L);
        when(buyerRequirementRepository.countByStatus(RequirementStatus.FULFILLED)).thenReturn(12L);
        when(buyerRequirementRepository.countByStatus(RequirementStatus.CANCELLED)).thenReturn(3L);

        when(orderRepository.count()).thenReturn(40L);
        when(orderRepository.countByOrderStatus(OrderStatus.PENDING)).thenReturn(6L);
        when(orderRepository.countByOrderStatus(OrderStatus.CONFIRMED)).thenReturn(10L);
        when(orderRepository.countByOrderStatus(OrderStatus.SHIPPED)).thenReturn(4L);
        when(orderRepository.countByOrderStatus(OrderStatus.DELIVERED)).thenReturn(18L);
        when(orderRepository.countByOrderStatus(OrderStatus.CANCELLED)).thenReturn(2L);
        when(orderRepository.sumOverallOrderAmount()).thenReturn(new BigDecimal("150000.00"));
        when(orderRepository.sumTotalAmountByOrderStatus(OrderStatus.DELIVERED)).thenReturn(new BigDecimal("95000.00"));

        when(deliveryRepository.count()).thenReturn(32L);
        when(deliveryRepository.countByDeliveryStatus(DeliveryStatus.PENDING)).thenReturn(8L);
        when(deliveryRepository.countByDeliveryStatus(DeliveryStatus.IN_TRANSIT)).thenReturn(4L);
        when(deliveryRepository.countByDeliveryStatus(DeliveryStatus.DELIVERED)).thenReturn(18L);
        when(deliveryRepository.countByDeliveryStatus(DeliveryStatus.FAILED)).thenReturn(2L);

        when(paymentRepository.count()).thenReturn(28L);
        when(paymentRepository.countByPaymentStatus(PaymentStatus.PENDING)).thenReturn(4L);
        when(paymentRepository.countByPaymentStatus(PaymentStatus.PAID)).thenReturn(5L);
        when(paymentRepository.countByPaymentStatus(PaymentStatus.COMPLETED)).thenReturn(18L);
        when(paymentRepository.countByPaymentStatus(PaymentStatus.FAILED)).thenReturn(1L);
        when(paymentRepository.countByPaymentStatus(PaymentStatus.REFUNDED)).thenReturn(0L);
        when(paymentRepository.sumOverallCompletedPaymentValue()).thenReturn(new BigDecimal("95000.00"));

        when(priceHistoryRepository.count()).thenReturn(50L);
        when(priceHistoryRepository.countBySourceType(PriceSourceType.TRANSACTION_SALE)).thenReturn(35L);
        when(priceHistoryRepository.countBySourceType(PriceSourceType.MARKET_MANDI)).thenReturn(15L);
        when(priceHistoryRepository.findOverallAveragePrice()).thenReturn(new BigDecimal("42.50"));
        when(priceHistoryRepository.findOverallTotalQuantity()).thenReturn(new BigDecimal("12500.00"));

        AdminDashboardResponse response = adminDashboardService.getDashboardStats();

        assertThat(response).isNotNull();
        assertThat(response.getUserStats().getTotalUsers()).isEqualTo(15L);
        assertThat(response.getUserStats().getTotalFarmers()).isEqualTo(8L);
        assertThat(response.getUserStats().getActiveUsers()).isEqualTo(14L);

        assertThat(response.getCropStats().getTotalCrops()).isEqualTo(12L);
        assertThat(response.getHarvestStats().getAvailableHarvests()).isEqualTo(18L);
        assertThat(response.getQualityStats().getGradeACount()).isEqualTo(10L);
        assertThat(response.getRequirementStats().getActiveRequirements()).isEqualTo(15L);
        assertThat(response.getOrderStats().getTotalOrders()).isEqualTo(40L);
        assertThat(response.getOrderStats().getTotalOrderAmount()).isEqualByComparingTo("150000.00");
        assertThat(response.getDeliveryStats().getDeliveredDeliveries()).isEqualTo(18L);
        assertThat(response.getPaymentStats().getTotalSettledAmount()).isEqualByComparingTo("95000.00");
        assertThat(response.getPriceHistoryStats().getOrderSourceRecords()).isEqualTo(35L);
        assertThat(response.getPriceHistoryStats().getOverallAveragePrice()).isEqualByComparingTo("42.50");
    }

    @Test
    @DisplayName("getRecentActivities: Aggregates across multiple entities and orders descending by timestamp")
    void testGetRecentActivities() {
        Harvest harvest = new Harvest();
        harvest.setHarvestId(101);
        harvest.setFarmer(sampleFarmer);
        harvest.setCrop(sampleCrop);
        harvest.setAvailableQuantity(new BigDecimal("800.00"));
        harvest.setStatus(HarvestStatus.AVAILABLE);

        Order order = new Order();
        order.setOrderId(201);
        order.setBuyer(sampleBuyer);
        order.setHarvest(harvest);
        order.setQuantity(new BigDecimal("200.00"));
        order.setAgreedPricePerKg(new BigDecimal("25.00"));
        order.setTotalAmount(new BigDecimal("5000.00"));
        order.setOrderStatus(OrderStatus.CONFIRMED);

        Delivery delivery = new Delivery();
        delivery.setDeliveryId(301);
        delivery.setOrder(order);
        delivery.setDeliveryAddress("123 Market Road");
        delivery.setDeliveryStatus(DeliveryStatus.IN_TRANSIT);

        Payment payment = new Payment();
        payment.setPaymentId(401);
        payment.setOrder(order);
        payment.setAmount(new BigDecimal("5000.00"));
        payment.setPaymentMethod(PaymentMethod.UPI);
        payment.setPaymentStatus(PaymentStatus.PAID);

        when(orderRepository.findAllByOrderByOrderDateDesc()).thenReturn(List.of(order));
        when(deliveryRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(delivery));
        when(paymentRepository.findAllByOrderByPaymentDateDesc()).thenReturn(List.of(payment));
        when(qualityAssessmentRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of());
        when(harvestRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(harvest));
        when(priceHistoryRepository.findAllByOrderByRecordedDateDesc()).thenReturn(List.of());

        List<RecentActivityResponse> activities = adminDashboardService.getRecentActivities(10);

        assertThat(activities).isNotEmpty();
        assertThat(activities).hasSize(4);
        assertThat(activities.stream().map(RecentActivityResponse::getActivityType))
                .contains("ORDER", "DELIVERY", "PAYMENT", "HARVEST");
    }
}
