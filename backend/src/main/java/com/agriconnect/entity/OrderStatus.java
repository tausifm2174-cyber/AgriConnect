package com.agriconnect.entity;

/**
 * Lifecycle status of an Order in the AgriConnect marketplace.
 * Phase 8 introduces the core lifecycle:
 * PENDING -> ACCEPTED
 * PENDING -> REJECTED
 * PENDING -> CANCELLED
 * Preserves legacy statuses (CONFIRMED, SHIPPED, DELIVERED) for subsequent fulfillment phases.
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
     * In Phase 8:
     * - Only PENDING orders can transition to ACCEPTED, REJECTED, or CANCELLED.
     * - ACCEPTED, REJECTED, and CANCELLED are terminal states for Phase 8.
     *
     * @param targetStatus Proposed new status
     * @return true if the transition is permitted, false otherwise
     */
    public boolean canTransitionTo(OrderStatus targetStatus) {
        if (this == targetStatus) {
            return false;
        }
        if (this == PENDING) {
            return targetStatus == ACCEPTED || targetStatus == REJECTED || targetStatus == CANCELLED;
        }
        // Terminal or future fulfillment states cannot transition back to Phase 8 decision states
        return false;
    }
}
