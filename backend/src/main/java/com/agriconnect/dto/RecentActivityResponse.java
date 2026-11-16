package com.agriconnect.dto;

import java.time.LocalDateTime;

/**
 * Representation of a recent event or transaction across the AgriConnect marketplace.
 */
public class RecentActivityResponse {

    private String activityType;
    private String description;
    private Integer referenceId;
    private String actorName;
    private LocalDateTime timestamp;
    private String status;

    public RecentActivityResponse() {}

    public RecentActivityResponse(String activityType, String description, Integer referenceId,
                                  String actorName, LocalDateTime timestamp, String status) {
        this.activityType = activityType;
        this.description = description;
        this.referenceId = referenceId;
        this.actorName = actorName;
        this.timestamp = timestamp;
        this.status = status;
    }

    public String getActivityType() {
        return activityType;
    }

    public void setActivityType(String activityType) {
        this.activityType = activityType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getReferenceId() {
        return referenceId;
    }

    public void setReferenceId(Integer referenceId) {
        this.referenceId = referenceId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
