package com.agriconnect.entity;

/**
 * Lifecycle status of an agricultural lot quality assessment:
 * PENDING: Assessment recorded by inspector, awaiting administrative verification or re-check.
 * VERIFIED: Checked and certified by authorized administrator; eligible for market matching.
 * REJECTED: Inspection failed quality standards or submitted lot details rejected.
 */
public enum VerificationStatus {
    PENDING,
    VERIFIED,
    REJECTED
}
