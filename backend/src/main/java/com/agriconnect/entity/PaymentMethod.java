package com.agriconnect.entity;

/**
 * Payment method supported by AgriConnect marketplace (Phase 10).
 * Matches MySQL ENUM('BANK_TRANSFER','UPI','CASH','CHEQUE').
 */
public enum PaymentMethod {
    BANK_TRANSFER,
    UPI,
    CASH,
    CHEQUE
}
