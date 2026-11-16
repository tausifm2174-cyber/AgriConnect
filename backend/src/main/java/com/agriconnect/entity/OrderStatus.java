package com.agriconnect.entity;

/**
 * Lifecycle status of an Order in the AgriConnect marketplace.
 * Phase 8 introduced the core decision lifecycle:
 * PENDING -> ACCEPTED / REJECTED / CANCELLED
 *
 * Phase 9 integrates complete Delivery & Fulfillment management:
 * ACCEPTED -> CONFIRMED -> SHIPPED -> DELIVERED
 */
public enum OrderStatus {
    PENDING,
    ACCEPTED,
    REJECTED,
    CANCELLED,
    CONFIRMED,
    SHIPPED,
    DELIVERED;

    /**
     * Determines whether this status can transition to the given target status.
     * Enforces valid linear order fulfillment progression:
     * - PENDING -> ACCEPTED, REJECTED, CANCELLED
     * - ACCEPTED -> CONFIRMED, SHIPPED, CANCELLED
     * - CONFIRMED -> SHIPPED, CANCELLED
     * - SHIPPED -> DELIVERED
     * - Backward transitions (e.g. DELIVERED -> SHIPPED, SHIPPED -> ACCEPTED) are rejected.
     * - Terminal states (DELIVERED, REJECTED, CANCELLED) cannot transition further.
     *
     * @param targetStatus Proposed new status
     * @return true if the transition is permitted, false otherwise
     */
    public boolean canTransitionTo(OrderStatus targetStatus) {
        if (targetStatus == null || this == targetStatus) {
            return false;
        }

        return switch (this) {
            case PENDING -> targetStatus == ACCEPTED || targetStatus == REJECTED || targetStatus == CANCELLED;
            case ACCEPTED -> targetStatus == CONFIRMED || targetStatus == SHIPPED || targetStatus == CANCELLED;
            case CONFIRMED -> targetStatus == SHIPPED || targetStatus == CANCELLED;
            case SHIPPED -> targetStatus == DELIVERED;
            case DELIVERED, REJECTED, CANCELLED -> false;
        };
    }
}
