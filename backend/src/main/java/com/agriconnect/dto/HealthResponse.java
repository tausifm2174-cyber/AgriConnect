package com.agriconnect.dto;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for system health and status response.
 */
public class HealthResponse {

    private String status;
    private String application;
    private String phase;
    private String database;
    private LocalDateTime timestamp;

    public HealthResponse() {
    }

    public HealthResponse(String status, String application, String phase, String database, LocalDateTime timestamp) {
        this.status = status;
        this.application = application;
        this.phase = phase;
        this.database = database;
        this.timestamp = timestamp;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getApplication() {
        return application;
    }

    public void setApplication(String application) {
        this.application = application;
    }

    public String getPhase() {
        return phase;
    }

    public void setPhase(String phase) {
        this.phase = phase;
    }

    public String getDatabase() {
        return database;
    }

    public void setDatabase(String database) {
        this.database = database;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
