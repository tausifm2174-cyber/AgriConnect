package com.agriconnect.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class QualityAuditTimelineItem {

    private String eventType;      // INITIAL_ASSESSMENT, VERIFIED, BUYER_FEEDBACK, REASSESSMENT_REQUESTED, REINSPECTED, REJECTED
    private LocalDateTime timestamp;
    private String actor;
    private String action;
    private String status;
    private BigDecimal score;
    private String grade;
    private String remarks;
    private Object details;

    public QualityAuditTimelineItem() {
    }

    public QualityAuditTimelineItem(String eventType, LocalDateTime timestamp, String actor,
                                    String action, String status, BigDecimal score,
                                    String grade, String remarks, Object details) {
        this.eventType = eventType;
        this.timestamp = timestamp;
        this.actor = actor;
        this.action = action;
        this.status = status;
        this.score = score;
        this.grade = grade;
        this.remarks = remarks;
        this.details = details;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public Object getDetails() {
        return details;
    }

    public void setDetails(Object details) {
        this.details = details;
    }
}
