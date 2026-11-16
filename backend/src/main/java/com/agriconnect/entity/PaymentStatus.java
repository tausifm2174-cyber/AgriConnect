package com.agriconnect.entity;

/**
 * Lifecycle status of a Payment in the AgriConnect marketplace (Phase 10).
 * Matches MySQL ENUM('PENDING','PROCESSING','COMPLETED','PAID','FAILED','CANCELLED','REFUNDED').
 * Enforces non-reversible progression and academic DBMS integrity rules.
 */
public enum PaymentStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    PAID,
    FAILED,
    CANCELLED,
    REFUNDED;

    /**
     * Determines whether this payment status can transition to the given target status.
     * Enforces transition boundaries:
     * - PENDING -> PROCESSING, COMPLETED, PAID, CANCELLED, FAILED
     * - PROCESSING -> COMPLETED, PAID, FAILED, CANCELLED
     * - COMPLETED / PAID -> REFUNDED
     * - FAILED, CANCELLED, REFUNDED -> terminal (cannot transition)
     * - Cannot transition to self
     *
     * @param target Proposed new payment status
     * @return true if the transition is permitted, false otherwise
     */
    public boolean canTransitionTo(PaymentStatus target) {
        if (target == null || this == target) {
            return false;
        }

        return switch (this) {
            case PENDING -> target == PROCESSING || target == COMPLETED || target == PAID 
                            || target == CANCELLED || target == FAILED;
            case PROCESSING -> target == COMPLETED || target == PAID 
                            || target == FAILED || target == CANCELLED;
            case COMPLETED, PAID -> target == REFUNDED;
            case FAILED, CANCELLED, REFUNDED -> false;
        };
    }

    /**
     * Checks if the status represents a successful payment settlement.
     */
    public boolean isSuccessful() {
        return this == COMPLETED || this == PAID;
    }
}
