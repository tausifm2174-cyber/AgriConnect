package com.agriconnect.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Aggregated analytics DTO for a specific crop across historical pricing records (Phase 11).
 */
public class CropPriceAnalyticsResponse {

    private Integer cropId;
    private String cropName;
    private String cropCategory;

    // Aggregate statistics
    private BigDecimal averagePrice;
    private BigDecimal minimumPrice;
    private BigDecimal maximumPrice;
    private BigDecimal latestPrice;
    private BigDecimal totalQuantity;
    private long transactionCount;

    // Trend indicator: UPWARD, DOWNWARD, STABLE, or INSUFFICIENT_DATA
    private String recentTrend;

    // Historical trend series
    private List<PriceTrendPoint> trendPoints = new ArrayList<>();

    public CropPriceAnalyticsResponse() {
    }

    public CropPriceAnalyticsResponse(Integer cropId, String cropName, String cropCategory,
                                      BigDecimal averagePrice, BigDecimal minimumPrice,
                                      BigDecimal maximumPrice, BigDecimal latestPrice,
                                      BigDecimal totalQuantity, long transactionCount,
                                      String recentTrend, List<PriceTrendPoint> trendPoints) {
        this.cropId = cropId;
        this.cropName = cropName;
        this.cropCategory = cropCategory;
        this.averagePrice = averagePrice;
        this.minimumPrice = minimumPrice;
        this.maximumPrice = maximumPrice;
        this.latestPrice = latestPrice;
        this.totalQuantity = totalQuantity;
        this.transactionCount = transactionCount;
        this.recentTrend = recentTrend;
        this.trendPoints = trendPoints != null ? trendPoints : new ArrayList<>();
    }

    public Integer getCropId() {
        return cropId;
    }

    public void setCropId(Integer cropId) {
        this.cropId = cropId;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public String getCropCategory() {
        return cropCategory;
    }

    public void setCropCategory(String cropCategory) {
        this.cropCategory = cropCategory;
    }

    public BigDecimal getAveragePrice() {
        return averagePrice;
    }

    public void setAveragePrice(BigDecimal averagePrice) {
        this.averagePrice = averagePrice;
    }

    public BigDecimal getMinimumPrice() {
        return minimumPrice;
    }

    public void setMinimumPrice(BigDecimal minimumPrice) {
        this.minimumPrice = minimumPrice;
    }

    public BigDecimal getMaximumPrice() {
        return maximumPrice;
    }

    public void setMaximumPrice(BigDecimal maximumPrice) {
        this.maximumPrice = maximumPrice;
    }

    public BigDecimal getLatestPrice() {
        return latestPrice;
    }

    public void setLatestPrice(BigDecimal latestPrice) {
        this.latestPrice = latestPrice;
    }

    public BigDecimal getTotalQuantity() {
        return totalQuantity;
    }

    public void setTotalQuantity(BigDecimal totalQuantity) {
        this.totalQuantity = totalQuantity;
    }

    public long getTransactionCount() {
        return transactionCount;
    }

    public void setTransactionCount(long transactionCount) {
        this.transactionCount = transactionCount;
    }

    public String getRecentTrend() {
        return recentTrend;
    }

    public void setRecentTrend(String recentTrend) {
        this.recentTrend = recentTrend;
    }

    public List<PriceTrendPoint> getTrendPoints() {
        return trendPoints;
    }

    public void setTrendPoints(List<PriceTrendPoint> trendPoints) {
        this.trendPoints = trendPoints;
    }
}
