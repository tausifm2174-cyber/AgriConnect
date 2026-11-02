package com.agriconnect.entity;

import com.fasterxml.jackson.annotation.JsonCreator;

/**
 * Requirement status lifecycle states for Buyer Requirements.
 * Reuses the existing database enum ('OPEN', 'FULFILLED', 'EXPIRED', 'CANCELLED').
 */
public enum RequirementStatus {
    OPEN,
    FULFILLED,
    EXPIRED,
    CANCELLED;

    /**
     * Flexible deserializer accepting both canonical 'OPEN' and alias 'ACTIVE'.
     */
    @JsonCreator
    public static RequirementStatus fromString(String value) {
        if (value == null) {
            return OPEN;
        }
        String normalized = value.trim().toUpperCase();
        if ("ACTIVE".equals(normalized)) {
            return OPEN;
        }
        for (RequirementStatus status : values()) {
            if (status.name().equals(normalized)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown requirement status: " + value);
    }
}
