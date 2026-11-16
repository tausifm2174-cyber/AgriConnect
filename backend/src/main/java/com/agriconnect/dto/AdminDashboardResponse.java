package com.agriconnect.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * High-level marketplace statistical summary and aggregate KPIs for administrators.
 */
public class AdminDashboardResponse {

    private UserStats userStats;
    private CropStats cropStats;
    private HarvestStats harvestStats;
    private QualityStats qualityStats;
    private RequirementStats requirementStats;
    private OrderStats orderStats;
    private DeliveryStats deliveryStats;
    private PaymentStats paymentStats;
    private PriceHistoryStats priceHistoryStats;
    private LocalDateTime generatedAt;

    public AdminDashboardResponse() {
        this.generatedAt = LocalDateTime.now();
    }

    public UserStats getUserStats() {
        return userStats;
    }

    public void setUserStats(UserStats userStats) {
        this.userStats = userStats;
    }

    public CropStats getCropStats() {
        return cropStats;
    }

    public void setCropStats(CropStats cropStats) {
        this.cropStats = cropStats;
    }

    public HarvestStats getHarvestStats() {
        return harvestStats;
    }

    public void setHarvestStats(HarvestStats harvestStats) {
        this.harvestStats = harvestStats;
    }

    public QualityStats getQualityStats() {
        return qualityStats;
    }

    public void setQualityStats(QualityStats qualityStats) {
        this.qualityStats = qualityStats;
    }

    public RequirementStats getRequirementStats() {
        return requirementStats;
    }

    public void setRequirementStats(RequirementStats requirementStats) {
        this.requirementStats = requirementStats;
    }

    public OrderStats getOrderStats() {
        return orderStats;
    }

    public void setOrderStats(OrderStats orderStats) {
        this.orderStats = orderStats;
    }

    public DeliveryStats getDeliveryStats() {
        return deliveryStats;
    }

    public void setDeliveryStats(DeliveryStats deliveryStats) {
        this.deliveryStats = deliveryStats;
    }

    public PaymentStats getPaymentStats() {
        return paymentStats;
    }

    public void setPaymentStats(PaymentStats paymentStats) {
        this.paymentStats = paymentStats;
    }

    public PriceHistoryStats getPriceHistoryStats() {
        return priceHistoryStats;
    }

    public void setPriceHistoryStats(PriceHistoryStats priceHistoryStats) {
        this.priceHistoryStats = priceHistoryStats;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    // --- Sub-stat classes ---

    public static class UserStats {
        private long totalUsers;
        private long totalFarmers;
        private long totalBuyers;
        private long totalAdmins;
        private long activeUsers;
        private long inactiveUsers;
        private long suspendedUsers;

        public UserStats() {}

        public long getTotalUsers() { return totalUsers; }
        public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }

        public long getTotalFarmers() { return totalFarmers; }
        public void setTotalFarmers(long totalFarmers) { this.totalFarmers = totalFarmers; }

        public long getTotalBuyers() { return totalBuyers; }
        public void setTotalBuyers(long totalBuyers) { this.totalBuyers = totalBuyers; }

        public long getTotalAdmins() { return totalAdmins; }
        public void setTotalAdmins(long totalAdmins) { this.totalAdmins = totalAdmins; }

        public long getActiveUsers() { return activeUsers; }
        public void setActiveUsers(long activeUsers) { this.activeUsers = activeUsers; }

        public long getInactiveUsers() { return inactiveUsers; }
        public void setInactiveUsers(long inactiveUsers) { this.inactiveUsers = inactiveUsers; }

        public long getPendingUsers() { return inactiveUsers; }
        public void setPendingUsers(long pendingUsers) { this.inactiveUsers = pendingUsers; }

        public long getSuspendedUsers() { return suspendedUsers; }
        public void setSuspendedUsers(long suspendedUsers) { this.suspendedUsers = suspendedUsers; }
    }

    public static class CropStats {
        private long totalCrops;

        public CropStats() {}

        public long getTotalCrops() { return totalCrops; }
        public void setTotalCrops(long totalCrops) { this.totalCrops = totalCrops; }
    }

    public static class HarvestStats {
        private long totalHarvests;
        private long availableHarvests;
        private long soldOutHarvests;

        public HarvestStats() {}

        public long getTotalHarvests() { return totalHarvests; }
        public void setTotalHarvests(long totalHarvests) { this.totalHarvests = totalHarvests; }

        public long getAvailableHarvests() { return availableHarvests; }
        public void setAvailableHarvests(long availableHarvests) { this.availableHarvests = availableHarvests; }

        public long getSoldOutHarvests() { return soldOutHarvests; }
        public void setSoldOutHarvests(long soldOutHarvests) { this.soldOutHarvests = soldOutHarvests; }
    }

    public static class QualityStats {
        private long totalAssessments;
        private long pendingAssessments;
        private long verifiedAssessments;
        private long rejectedAssessments;
        private long gradeACount;
        private long gradeBCount;
        private long gradeCCount;

        public QualityStats() {}

        public long getTotalAssessments() { return totalAssessments; }
        public void setTotalAssessments(long totalAssessments) { this.totalAssessments = totalAssessments; }

        public long getPendingAssessments() { return pendingAssessments; }
        public void setPendingAssessments(long pendingAssessments) { this.pendingAssessments = pendingAssessments; }

        public long getVerifiedAssessments() { return verifiedAssessments; }
        public void setVerifiedAssessments(long verifiedAssessments) { this.verifiedAssessments = verifiedAssessments; }

        public long getRejectedAssessments() { return rejectedAssessments; }
        public void setRejectedAssessments(long rejectedAssessments) { this.rejectedAssessments = rejectedAssessments; }

        public long getGradeACount() { return gradeACount; }
        public void setGradeACount(long gradeACount) { this.gradeACount = gradeACount; }

        public long getGradeBCount() { return gradeBCount; }
        public void setGradeBCount(long gradeBCount) { this.gradeBCount = gradeBCount; }

        public long getGradeCCount() { return gradeCCount; }
        public void setGradeCCount(long gradeCCount) { this.gradeCCount = gradeCCount; }
    }

    public static class RequirementStats {
        private long totalRequirements;
        private long activeRequirements;
        private long fulfilledRequirements;
        private long cancelledRequirements;

        public RequirementStats() {}

        public long getTotalRequirements() { return totalRequirements; }
        public void setTotalRequirements(long totalRequirements) { this.totalRequirements = totalRequirements; }

        public long getActiveRequirements() { return activeRequirements; }
        public void setActiveRequirements(long activeRequirements) { this.activeRequirements = activeRequirements; }

        public long getFulfilledRequirements() { return fulfilledRequirements; }
        public void setFulfilledRequirements(long fulfilledRequirements) { this.fulfilledRequirements = fulfilledRequirements; }

        public long getCancelledRequirements() { return cancelledRequirements; }
        public void setCancelledRequirements(long cancelledRequirements) { this.cancelledRequirements = cancelledRequirements; }
    }

    public static class OrderStats {
        private long totalOrders;
        private long pendingOrders;
        private long confirmedOrders;
        private long shippedOrders;
        private long deliveredOrders;
        private long cancelledOrders;
        private BigDecimal totalOrderAmount;
        private BigDecimal completedOrderAmount;

        public OrderStats() {}

        public long getTotalOrders() { return totalOrders; }
        public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }

        public long getPendingOrders() { return pendingOrders; }
        public void setPendingOrders(long pendingOrders) { this.pendingOrders = pendingOrders; }

        public long getConfirmedOrders() { return confirmedOrders; }
        public void setConfirmedOrders(long confirmedOrders) { this.confirmedOrders = confirmedOrders; }

        public long getShippedOrders() { return shippedOrders; }
        public void setShippedOrders(long shippedOrders) { this.shippedOrders = shippedOrders; }

        public long getDeliveredOrders() { return deliveredOrders; }
        public void setDeliveredOrders(long deliveredOrders) { this.deliveredOrders = deliveredOrders; }

        public long getCancelledOrders() { return cancelledOrders; }
        public void setCancelledOrders(long cancelledOrders) { this.cancelledOrders = cancelledOrders; }

        public BigDecimal getTotalOrderAmount() { return totalOrderAmount; }
        public void setTotalOrderAmount(BigDecimal totalOrderAmount) { this.totalOrderAmount = totalOrderAmount; }

        public BigDecimal getCompletedOrderAmount() { return completedOrderAmount; }
        public void setCompletedOrderAmount(BigDecimal completedOrderAmount) { this.completedOrderAmount = completedOrderAmount; }
    }

    public static class DeliveryStats {
        private long totalDeliveries;
        private long pendingDeliveries;
        private long inTransitDeliveries;
        private long deliveredDeliveries;
        private long failedDeliveries;

        public DeliveryStats() {}

        public long getTotalDeliveries() { return totalDeliveries; }
        public void setTotalDeliveries(long totalDeliveries) { this.totalDeliveries = totalDeliveries; }

        public long getPendingDeliveries() { return pendingDeliveries; }
        public void setPendingDeliveries(long pendingDeliveries) { this.pendingDeliveries = pendingDeliveries; }

        public long getInTransitDeliveries() { return inTransitDeliveries; }
        public void setInTransitDeliveries(long inTransitDeliveries) { this.inTransitDeliveries = inTransitDeliveries; }

        public long getDeliveredDeliveries() { return deliveredDeliveries; }
        public void setDeliveredDeliveries(long deliveredDeliveries) { this.deliveredDeliveries = deliveredDeliveries; }

        public long getFailedDeliveries() { return failedDeliveries; }
        public void setFailedDeliveries(long failedDeliveries) { this.failedDeliveries = failedDeliveries; }
    }

    public static class PaymentStats {
        private long totalPayments;
        private long pendingPayments;
        private long paidPayments;
        private long completedPayments;
        private long failedPayments;
        private long refundedPayments;
        private BigDecimal totalSettledAmount;

        public PaymentStats() {}

        public long getTotalPayments() { return totalPayments; }
        public void setTotalPayments(long totalPayments) { this.totalPayments = totalPayments; }

        public long getPendingPayments() { return pendingPayments; }
        public void setPendingPayments(long pendingPayments) { this.pendingPayments = pendingPayments; }

        public long getPaidPayments() { return paidPayments; }
        public void setPaidPayments(long paidPayments) { this.paidPayments = paidPayments; }

        public long getCompletedPayments() { return completedPayments; }
        public void setCompletedPayments(long completedPayments) { this.completedPayments = completedPayments; }

        public long getFailedPayments() { return failedPayments; }
        public void setFailedPayments(long failedPayments) { this.failedPayments = failedPayments; }

        public long getRefundedPayments() { return refundedPayments; }
        public void setRefundedPayments(long refundedPayments) { this.refundedPayments = refundedPayments; }

        public BigDecimal getTotalSettledAmount() { return totalSettledAmount; }
        public void setTotalSettledAmount(BigDecimal totalSettledAmount) { this.totalSettledAmount = totalSettledAmount; }
    }

    public static class PriceHistoryStats {
        private long totalRecords;
        private long orderSourceRecords;
        private long manualSourceRecords;
        private long mandiSourceRecords;
        private BigDecimal overallAveragePrice;
        private BigDecimal overallTotalVolume;

        public PriceHistoryStats() {}

        public long getTotalRecords() { return totalRecords; }
        public void setTotalRecords(long totalRecords) { this.totalRecords = totalRecords; }

        public long getOrderSourceRecords() { return orderSourceRecords; }
        public void setOrderSourceRecords(long orderSourceRecords) { this.orderSourceRecords = orderSourceRecords; }

        public long getManualSourceRecords() { return manualSourceRecords; }
        public void setManualSourceRecords(long manualSourceRecords) { this.manualSourceRecords = manualSourceRecords; }

        public long getMandiSourceRecords() { return mandiSourceRecords; }
        public void setMandiSourceRecords(long mandiSourceRecords) { this.mandiSourceRecords = mandiSourceRecords; }

        public BigDecimal getOverallAveragePrice() { return overallAveragePrice; }
        public void setOverallAveragePrice(BigDecimal overallAveragePrice) { this.overallAveragePrice = overallAveragePrice; }

        public BigDecimal getOverallTotalVolume() { return overallTotalVolume; }
        public void setOverallTotalVolume(BigDecimal overallTotalVolume) { this.overallTotalVolume = overallTotalVolume; }
    }
}
