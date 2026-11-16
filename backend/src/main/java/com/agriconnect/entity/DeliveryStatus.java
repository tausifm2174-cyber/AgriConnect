package com.agriconnect.entity;

/**
 * Lifecycle status of a Delivery in the AgriConnect marketplace (Phase 9).
 * Defines valid delivery lifecycle states and transition boundaries:
 * PENDING -> SHIPPED (or DISPATCHED -> IN_TRANSIT -> SHIPPED) -> DELIVERED
 */
public enum DeliveryStatus {
    PENDING,
    DISPATCHED,
    IN_TRANSIT,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    FAILED;

    /**
     * Determines whether this delivery status can transition to the given target status.
     * Enforces non-reversible progression:
     * - DELIVERED is terminal (cannot transition backward to SHIPPED or PENDING).
     * - FAILED and CANCELLED are terminal.
     * - Cannot transition to the exact same status.
     *
     * @param target Proposed new delivery status
     * @return true if the transition is permitted, false otherwise
     */
    public boolean canTransitionTo(DeliveryStatus target) {
        if (target == null || this == target) {
            return false;
        }

        return switch (this) {
            case PENDING -> target == DISPATCHED || target == SHIPPED || target == CANCELLED;
            case DISPATCHED -> target == IN_TRANSIT || target == SHIPPED || target == DELIVERED || target == FAILED || target == CANCELLED;
            case IN_TRANSIT -> target == SHIPPED || target == DELIVERED || target == FAILED;
            case SHIPPED -> target == DELIVERED || target == FAILED;
            case DELIVERED, CANCELLED, FAILED -> false;
        };
    }
}
