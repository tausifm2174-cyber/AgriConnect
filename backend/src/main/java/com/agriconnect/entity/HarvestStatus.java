package com.agriconnect.entity;

/**
 * Harvest lot inventory status aligned with database ENUM in harvests table.
 */
public enum HarvestStatus {
    AVAILABLE,
    PARTIALLY_SOLD,
    SOLD_OUT,
    CANCELLED
}
