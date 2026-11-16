package com.agriconnect.service;

import com.agriconnect.dto.AdminDashboardResponse;
import com.agriconnect.dto.RecentActivityResponse;
import com.agriconnect.entity.*;
import com.agriconnect.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Service managing centralized Admin Dashboard KPIs, analytics aggregations,
 * and the cross-marketplace activity feed.
 */
@Service
public class AdminDashboardService {

    private final UserRepository userRepository;
    private final CropRepository cropRepository;
    private final HarvestRepository harvestRepository;
    private final QualityAssessmentRepository qualityAssessmentRepository;
    private final BuyerRequirementRepository buyerRequirementRepository;
    private final OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;
    private final PaymentRepository paymentRepository;
    private final PriceHistoryRepository priceHistoryRepository;

    public AdminDashboardService(UserRepository userRepository,
                                 CropRepository cropRepository,
                                 HarvestRepository harvestRepository,
                                 QualityAssessmentRepository qualityAssessmentRepository,
                                 BuyerRequirementRepository buyerRequirementRepository,
                                 OrderRepository orderRepository,
                                 DeliveryRepository deliveryRepository,
                                 PaymentRepository paymentRepository,
                                 PriceHistoryRepository priceHistoryRepository) {
        this.userRepository = userRepository;
        this.cropRepository = cropRepository;
        this.harvestRepository = harvestRepository;
        this.qualityAssessmentRepository = qualityAssessmentRepository;
        this.buyerRequirementRepository = buyerRequirementRepository;
        this.orderRepository = orderRepository;
        this.deliveryRepository = deliveryRepository;
        this.paymentRepository = paymentRepository;
        this.priceHistoryRepository = priceHistoryRepository;
    }

    /**
     * Compute comprehensive platform-wide statistics for administrators.
     * Uses database-side count and aggregate queries for optimal performance.
     */
    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboardStats() {
        AdminDashboardResponse response = new AdminDashboardResponse();

        // 1. Users
        AdminDashboardResponse.UserStats userStats = new AdminDashboardResponse.UserStats();
        userStats.setTotalUsers(userRepository.count());
        userStats.setTotalFarmers(userRepository.countByRole(Role.FARMER));
        userStats.setTotalBuyers(userRepository.countByRole(Role.BUYER));
        userStats.setTotalAdmins(userRepository.countByRole(Role.ADMIN));
        userStats.setActiveUsers(userRepository.countByStatus(UserStatus.ACTIVE));
        userStats.setInactiveUsers(userRepository.countByStatus(UserStatus.INACTIVE));
        userStats.setSuspendedUsers(userRepository.countByStatus(UserStatus.SUSPENDED));
        response.setUserStats(userStats);

        // 2. Crops
        AdminDashboardResponse.CropStats cropStats = new AdminDashboardResponse.CropStats();
        cropStats.setTotalCrops(cropRepository.count());
        response.setCropStats(cropStats);

        // 3. Harvests
        AdminDashboardResponse.HarvestStats harvestStats = new AdminDashboardResponse.HarvestStats();
        harvestStats.setTotalHarvests(harvestRepository.count());
        harvestStats.setAvailableHarvests(harvestRepository.countByStatus(HarvestStatus.AVAILABLE));
        harvestStats.setSoldOutHarvests(harvestRepository.countByStatus(HarvestStatus.SOLD_OUT));
        response.setHarvestStats(harvestStats);

        // 4. Quality Assessments
        AdminDashboardResponse.QualityStats qualityStats = new AdminDashboardResponse.QualityStats();
        qualityStats.setTotalAssessments(qualityAssessmentRepository.count());
        qualityStats.setPendingAssessments(qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.PENDING));
        qualityStats.setVerifiedAssessments(qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.VERIFIED));
        qualityStats.setRejectedAssessments(qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.REJECTED));
        qualityStats.setGradeACount(qualityAssessmentRepository.countByQualityGrade(QualityGrade.A));
        qualityStats.setGradeBCount(qualityAssessmentRepository.countByQualityGrade(QualityGrade.B));
        qualityStats.setGradeCCount(qualityAssessmentRepository.countByQualityGrade(QualityGrade.C));
        response.setQualityStats(qualityStats);

        // 5. Buyer Requirements
        AdminDashboardResponse.RequirementStats reqStats = new AdminDashboardResponse.RequirementStats();
        reqStats.setTotalRequirements(buyerRequirementRepository.count());
        reqStats.setActiveRequirements(buyerRequirementRepository.countByStatus(RequirementStatus.OPEN));
        reqStats.setFulfilledRequirements(buyerRequirementRepository.countByStatus(RequirementStatus.FULFILLED));
        reqStats.setCancelledRequirements(buyerRequirementRepository.countByStatus(RequirementStatus.CANCELLED));
        response.setRequirementStats(reqStats);

        // 6. Orders
        AdminDashboardResponse.OrderStats orderStats = new AdminDashboardResponse.OrderStats();
        orderStats.setTotalOrders(orderRepository.count());
        orderStats.setPendingOrders(orderRepository.countByOrderStatus(OrderStatus.PENDING));
        orderStats.setConfirmedOrders(orderRepository.countByOrderStatus(OrderStatus.CONFIRMED));
        orderStats.setShippedOrders(orderRepository.countByOrderStatus(OrderStatus.SHIPPED));
        orderStats.setDeliveredOrders(orderRepository.countByOrderStatus(OrderStatus.DELIVERED));
        orderStats.setCancelledOrders(orderRepository.countByOrderStatus(OrderStatus.CANCELLED));
        orderStats.setTotalOrderAmount(orderRepository.sumOverallOrderAmount());
        orderStats.setCompletedOrderAmount(orderRepository.sumTotalAmountByOrderStatus(OrderStatus.DELIVERED));
        response.setOrderStats(orderStats);

        // 7. Deliveries
        AdminDashboardResponse.DeliveryStats deliveryStats = new AdminDashboardResponse.DeliveryStats();
        deliveryStats.setTotalDeliveries(deliveryRepository.count());
        deliveryStats.setPendingDeliveries(deliveryRepository.countByDeliveryStatus(DeliveryStatus.PENDING));
        deliveryStats.setInTransitDeliveries(deliveryRepository.countByDeliveryStatus(DeliveryStatus.IN_TRANSIT));
        deliveryStats.setDeliveredDeliveries(deliveryRepository.countByDeliveryStatus(DeliveryStatus.DELIVERED));
        deliveryStats.setFailedDeliveries(deliveryRepository.countByDeliveryStatus(DeliveryStatus.FAILED));
        response.setDeliveryStats(deliveryStats);

        // 8. Payments
        AdminDashboardResponse.PaymentStats paymentStats = new AdminDashboardResponse.PaymentStats();
        paymentStats.setTotalPayments(paymentRepository.count());
        paymentStats.setPendingPayments(paymentRepository.countByPaymentStatus(PaymentStatus.PENDING));
        paymentStats.setPaidPayments(paymentRepository.countByPaymentStatus(PaymentStatus.PAID));
        paymentStats.setCompletedPayments(paymentRepository.countByPaymentStatus(PaymentStatus.COMPLETED));
        paymentStats.setFailedPayments(paymentRepository.countByPaymentStatus(PaymentStatus.FAILED));
        paymentStats.setRefundedPayments(paymentRepository.countByPaymentStatus(PaymentStatus.REFUNDED));
        paymentStats.setTotalSettledAmount(paymentRepository.sumOverallCompletedPaymentValue());
        response.setPaymentStats(paymentStats);

        // 9. Price History
        AdminDashboardResponse.PriceHistoryStats priceStats = new AdminDashboardResponse.PriceHistoryStats();
        priceStats.setTotalRecords(priceHistoryRepository.count());
        priceStats.setOrderSourceRecords(priceHistoryRepository.countBySourceType(PriceSourceType.TRANSACTION_SALE));
        priceStats.setManualSourceRecords(0L);
        priceStats.setMandiSourceRecords(priceHistoryRepository.countBySourceType(PriceSourceType.MARKET_MANDI));
        priceStats.setOverallAveragePrice(priceHistoryRepository.findOverallAveragePrice());
        priceStats.setOverallTotalVolume(priceHistoryRepository.findOverallTotalQuantity());
        response.setPriceHistoryStats(priceStats);

        return response;
    }

    /**
     * Aggregates recent marketplace activities from across orders, deliveries, payments,
     * quality assessments, harvests, and price records into a single timeline.
     */
    @Transactional(readOnly = true)
    public List<RecentActivityResponse> getRecentActivities(int limit) {
        int maxItems = (limit <= 0) ? 15 : limit;
        List<RecentActivityResponse> activities = new ArrayList<>();

        // Recent Orders
        orderRepository.findAllByOrderByOrderDateDesc().stream().limit(maxItems).forEach(o -> {
            String cropName = (o.getHarvest() != null && o.getHarvest().getCrop() != null)
                    ? o.getHarvest().getCrop().getCropName() : "Crop";
            String buyerName = (o.getBuyer() != null) ? o.getBuyer().getFullName() : "Buyer";
            String desc = "Order #" + o.getOrderId() + " (" + o.getQuantity() + " kg " + cropName + ") placed by " + buyerName;
            activities.add(new RecentActivityResponse("ORDER", desc, o.getOrderId(), buyerName, o.getOrderDate(), o.getOrderStatus().name()));
        });

        // Recent Deliveries
        deliveryRepository.findAllByOrderByCreatedAtDesc().stream().limit(maxItems).forEach(d -> {
            String buyerName = (d.getOrder() != null && d.getOrder().getBuyer() != null)
                    ? d.getOrder().getBuyer().getFullName() : "Buyer";
            Integer orderId = (d.getOrder() != null) ? d.getOrder().getOrderId() : null;
            String desc = "Delivery #" + d.getDeliveryId() + " for Order #" + orderId + " (" + d.getDeliveryStatus() + ")";
            LocalDateTime ts = d.getCreatedAt() != null ? d.getCreatedAt() : LocalDateTime.now();
            activities.add(new RecentActivityResponse("DELIVERY", desc, d.getDeliveryId(), buyerName, ts, d.getDeliveryStatus().name()));
        });

        // Recent Payments
        paymentRepository.findAllByOrderByPaymentDateDesc().stream().limit(maxItems).forEach(p -> {
            String buyerName = (p.getOrder() != null && p.getOrder().getBuyer() != null)
                    ? p.getOrder().getBuyer().getFullName() : "Buyer";
            String desc = "Payment #" + p.getPaymentId() + " (" + p.getAmount() + " INR) " + p.getPaymentStatus() + " via " + p.getPaymentMethod();
            activities.add(new RecentActivityResponse("PAYMENT", desc, p.getPaymentId(), buyerName, p.getPaymentDate(), p.getPaymentStatus().name()));
        });

        // Recent Quality Assessments
        qualityAssessmentRepository.findAllByOrderByCreatedAtDesc().stream().limit(maxItems).forEach(qa -> {
            Integer harvestId = (qa.getHarvest() != null) ? qa.getHarvest().getHarvestId() : null;
            String adminName = (qa.getAdmin() != null) ? qa.getAdmin().getFullName() : "Admin";
            String desc = "Quality Assessment #" + qa.getAssessmentId() + " for Harvest #" + harvestId + " (" + qa.getQualityGrade() + ", " + qa.getVerificationStatus() + ")";
            LocalDateTime ts = qa.getCreatedAt() != null ? qa.getCreatedAt()
                    : (qa.getAssessmentDate() != null ? qa.getAssessmentDate().atStartOfDay() : LocalDateTime.now());
            activities.add(new RecentActivityResponse("QUALITY", desc, qa.getAssessmentId(), adminName, ts, qa.getVerificationStatus().name()));
        });

        // Recent Harvests
        harvestRepository.findAllByOrderByCreatedAtDesc().stream().limit(maxItems).forEach(h -> {
            String cropName = (h.getCrop() != null) ? h.getCrop().getCropName() : "Crop";
            String farmerName = (h.getFarmer() != null) ? h.getFarmer().getFullName() : "Farmer";
            String desc = "Harvest #" + h.getHarvestId() + " (" + h.getAvailableQuantity() + " kg " + cropName + ") listed by " + farmerName;
            LocalDateTime ts = h.getCreatedAt() != null ? h.getCreatedAt() : LocalDateTime.now();
            activities.add(new RecentActivityResponse("HARVEST", desc, h.getHarvestId(), farmerName, ts, h.getStatus().name()));
        });

        // Recent Price History records
        priceHistoryRepository.findAllByOrderByRecordedDateDesc().stream().limit(maxItems).forEach(ph -> {
            String cropName = (ph.getCrop() != null) ? ph.getCrop().getCropName() : "Crop";
            String actorName = (ph.getFarmer() != null) ? ph.getFarmer().getFullName() : "Market Price Monitor";
            BigDecimal rate = ph.getUnitPrice() != null ? ph.getUnitPrice() : ph.getModalPricePerKg();
            String desc = "Price record #" + ph.getPriceId() + " for " + cropName + " (" + rate + " INR/kg) [" + ph.getSourceType() + "]";
            LocalDateTime ts = ph.getCreatedAt() != null ? ph.getCreatedAt()
                    : (ph.getRecordedDate() != null ? ph.getRecordedDate().atStartOfDay() : LocalDateTime.now());
            activities.add(new RecentActivityResponse("PRICE_RECORD", desc, ph.getPriceId(), actorName, ts, ph.getSourceType().name()));
        });

        // Sort descending by timestamp, null-safe
        activities.sort(Comparator.comparing(RecentActivityResponse::getTimestamp,
                Comparator.nullsLast(Comparator.reverseOrder())));

        return activities.stream().limit(maxItems).toList();
    }
}
