package com.agriconnect.dto;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Platform-wide marketplace summary DTO providing macroscopic pricing metrics and crop distributions (Phase 11).
 */
public class MarketplacePriceSummaryResponse {

    private long overallTransactionCount;
    private BigDecimal overallTotalQuantity;
    private BigDecimal overallAveragePrice;
    private String highestPricedCrop;
    private BigDecimal highestCropAveragePrice;
    private String lowestPricedCrop;
    private BigDecimal lowestCropAveragePrice;

    private List<CropPriceAnalyticsResponse> cropAnalytics = new ArrayList<>();

    public MarketplacePriceSummaryResponse() {
    }

    public MarketplacePriceSummaryResponse(long overallTransactionCount, BigDecimal overallTotalQuantity,
                                           BigDecimal overallAveragePrice, String highestPricedCrop,
                                           BigDecimal highestCropAveragePrice, String lowestPricedCrop,
                                           BigDecimal lowestCropAveragePrice,
                                           List<CropPriceAnalyticsResponse> cropAnalytics) {
        this.overallTransactionCount = overallTransactionCount;
        this.overallTotalQuantity = overallTotalQuantity;
        this.overallAveragePrice = overallAveragePrice;
        this.highestPricedCrop = highestPricedCrop;
        this.highestCropAveragePrice = highestCropAveragePrice;
        this.lowestPricedCrop = lowestPricedCrop;
        this.lowestCropAveragePrice = lowestCropAveragePrice;
        this.cropAnalytics = cropAnalytics != null ? cropAnalytics : new ArrayList<>();
    }

    public long getOverallTransactionCount() {
        return overallTransactionCount;
    }

    public void setOverallTransactionCount(long overallTransactionCount) {
        this.overallTransactionCount = overallTransactionCount;
    }

    public BigDecimal getOverallTotalQuantity() {
        return overallTotalQuantity;
    }

    public void setOverallTotalQuantity(BigDecimal overallTotalQuantity) {
        this.overallTotalQuantity = overallTotalQuantity;
    }

    public BigDecimal getOverallAveragePrice() {
        return overallAveragePrice;
    }

    public void setOverallAveragePrice(BigDecimal overallAveragePrice) {
        this.overallAveragePrice = overallAveragePrice;
    }

    public String getHighestPricedCrop() {
        return highestPricedCrop;
    }

    public void setHighestPricedCrop(String highestPricedCrop) {
        this.highestPricedCrop = highestPricedCrop;
    }

    public BigDecimal getHighestCropAveragePrice() {
        return highestCropAveragePrice;
    }

    public void setHighestCropAveragePrice(BigDecimal highestCropAveragePrice) {
        this.highestCropAveragePrice = highestCropAveragePrice;
    }

    public String getLowestPricedCrop() {
        return lowestPricedCrop;
    }

    public void setLowestPricedCrop(String lowestPricedCrop) {
        this.lowestPricedCrop = lowestPricedCrop;
    }

    public BigDecimal getLowestCropAveragePrice() {
        return lowestCropAveragePrice;
    }

    public void setLowestCropAveragePrice(BigDecimal lowestCropAveragePrice) {
        this.lowestCropAveragePrice = lowestCropAveragePrice;
    }

    public List<CropPriceAnalyticsResponse> getCropAnalytics() {
        return cropAnalytics;
    }

    public void setCropAnalytics(List<CropPriceAnalyticsResponse> cropAnalytics) {
        this.cropAnalytics = cropAnalytics;
    }
}
