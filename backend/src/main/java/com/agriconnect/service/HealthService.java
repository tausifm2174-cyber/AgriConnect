package com.agriconnect.service;

import com.agriconnect.dto.HealthResponse;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDateTime;

/**
 * Service to verify application and database health.
 */
@Service
public class HealthService {

    private final DataSource dataSource;

    public HealthService(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Inspects MySQL connectivity and returns system status.
     *
     * @return HealthResponse with application, phase, and database status
     */
    public HealthResponse getSystemHealth() {
        String dbStatus = checkDatabaseConnection();
        String overallStatus = dbStatus.startsWith("Connected") ? "UP" : "DEGRADED";

        return new HealthResponse(
                overallStatus,
                "AgriConnect",
                "Phase 1",
                dbStatus,
                LocalDateTime.now()
        );
    }

    /**
     * Executes a lightweight validation query against MySQL.
     * Does not require any application tables to exist.
     */
    public String checkDatabaseConnection() {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT 1")) {

            if (rs.next()) {
                String catalog = conn.getCatalog();
                return "Connected (" + (catalog != null ? catalog : "MySQL") + ")";
            }
            return "Connected";
        } catch (Exception e) {
            return "Disconnected: " + e.getMessage();
        }
    }
}
