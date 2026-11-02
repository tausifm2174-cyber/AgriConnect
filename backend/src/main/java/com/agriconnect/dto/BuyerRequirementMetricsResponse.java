package com.agriconnect.dto;

/**
 * Metric summary counts for authenticated buyer dashboard overview cards.
 */
public class BuyerRequirementMetricsResponse {

    private long totalRequirements;
    private long openRequirements;
    private long fulfilledRequirements;
    private long expiredRequirements;
    private long cancelledRequirements;

    public BuyerRequirementMetricsResponse() {
    }

    public BuyerRequirementMetricsResponse(long totalRequirements, long openRequirements,
                                          long fulfilledRequirements, long expiredRequirements,
                                          long cancelledRequirements) {
        this.totalRequirements = totalRequirements;
        this.openRequirements = openRequirements;
        this.fulfilledRequirements = fulfilledRequirements;
        this.expiredRequirements = expiredRequirements;
        this.cancelledRequirements = cancelledRequirements;
    }

    public long getTotalRequirements() {
        return totalRequirements;
    }

    public void setTotalRequirements(long totalRequirements) {
        this.totalRequirements = totalRequirements;
    }

    public long getOpenRequirements() {
        return openRequirements;
    }

    public void setOpenRequirements(long openRequirements) {
        this.openRequirements = openRequirements;
    }

    public long getFulfilledRequirements() {
        return fulfilledRequirements;
    }

    public void setFulfilledRequirements(long fulfilledRequirements) {
        this.fulfilledRequirements = fulfilledRequirements;
    }

    public long getExpiredRequirements() {
        return expiredRequirements;
    }

    public void setExpiredRequirements(long expiredRequirements) {
        this.expiredRequirements = expiredRequirements;
    }

    public long getCancelledRequirements() {
        return cancelledRequirements;
    }

    public void setCancelledRequirements(long cancelledRequirements) {
        this.cancelledRequirements = cancelledRequirements;
    }
}
