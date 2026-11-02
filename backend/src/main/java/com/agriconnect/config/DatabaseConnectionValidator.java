package com.agriconnect.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Validates the MySQL database connection immediately on startup.
 * Fails fast and clearly if the database is unreachable or credentials are invalid.
 */
@Component
public class DatabaseConnectionValidator implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConnectionValidator.class);
    private final DataSource dataSource;

    public DatabaseConnectionValidator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) throws Exception {
        log.info("Verifying MySQL database connection to 'agriconnect_db'...");
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT 1")) {

            if (rs.next()) {
                String catalog = conn.getCatalog();
                log.info("=========================================================");
                log.info("DATABASE CONNECTIVITY SUCCESSFUL");
                log.info("Connected to MySQL catalog: [{}]", catalog != null ? catalog : "agriconnect_db");
                log.info("=========================================================");
            }
        } catch (Exception ex) {
            log.error("=========================================================");
            log.error("DATABASE CONNECTIVITY FAILED!");
            log.error("Could not connect to MySQL. Reason: {}", ex.getMessage());
            log.error("Please verify that:");
            log.error("  1. MySQL Server is running on port 3306");
            log.error("  2. 'agriconnect_db' has been created");
            log.error("  3. DB_USERNAME and DB_PASSWORD environment variables are set correctly");
            log.error("=========================================================");
            throw new IllegalStateException("Database connection verification failed: " + ex.getMessage(), ex);
        }
    }
}
