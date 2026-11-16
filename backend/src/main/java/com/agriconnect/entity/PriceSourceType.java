package com.agriconnect.entity;

/**
 * Origin source type for historical price records in AgriConnect (Phase 11).
 * Matches MySQL ENUM('MARKET_MANDI', 'TRANSACTION_SALE').
 */
public enum PriceSourceType {
    /**
     * APMC Mandi benchmark price recorded from physical markets.
     */
    MARKET_MANDI,

    /**
     * Actual commercial sale contract executed between Buyer and Farmer on AgriConnect.
     */
    TRANSACTION_SALE
}
