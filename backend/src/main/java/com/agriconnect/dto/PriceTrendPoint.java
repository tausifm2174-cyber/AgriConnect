package com.agriconnect.dto;

import com.agriconnect.entity.PriceSourceType;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Lightweight DTO representing a historical price data point for time-series and trend visualizations.
 */
public class PriceTrendPoint {

    private LocalDate recordedDate;
    private BigDecimal price;
    private PriceSourceType sourceType;
    private String marketLocation;
    private BigDecimal quantity;

    public PriceTrendPoint() {
    }

    public PriceTrendPoint(LocalDate recordedDate, BigDecimal price, PriceSourceType sourceType,
                           String marketLocation, BigDecimal quantity) {
        this.recordedDate = recordedDate;
        this.price = price;
        this.sourceType = sourceType;
        this.marketLocation = marketLocation;
        this.quantity = quantity;
    }

    public LocalDate getRecordedDate() {
        return recordedDate;
    }

    public void setRecordedDate(LocalDate recordedDate) {
        this.recordedDate = recordedDate;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public PriceSourceType getSourceType() {
        return sourceType;
    }

    public void setSourceType(PriceSourceType sourceType) {
        this.sourceType = sourceType;
    }

    public String getMarketLocation() {
        return marketLocation;
    }

    public void setMarketLocation(String marketLocation) {
        this.marketLocation = marketLocation;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
}
