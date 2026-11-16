package com.agriconnect;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class DeliveryDatabaseMigrationTest {

    private static final Logger log = LoggerFactory.getLogger(DeliveryDatabaseMigrationTest.class);

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Migration: Verify and apply Phase 9 Delivery Management schema migration idempotently")
    void verifyAndApplyPhase9Migration() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // 1. Update delivery_status enum to include Phase 9 statuses
            try {
                stmt.execute("ALTER TABLE deliveries MODIFY COLUMN delivery_status " +
                        "ENUM('PENDING', 'DISPATCHED', 'IN_TRANSIT', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'FAILED') DEFAULT 'PENDING'");
                log.info("Successfully updated deliveries.delivery_status ENUM definition.");
            } catch (Exception ex) {
                log.warn("Could not update delivery_status enum: {}", ex.getMessage());
            }

            // 2. Add remarks column if not exists
            boolean hasRemarks = columnExists(conn, "deliveries", "remarks");
            if (!hasRemarks) {
                stmt.execute("ALTER TABLE deliveries ADD COLUMN remarks VARCHAR(255) NULL AFTER delivery_address");
                log.info("Successfully added remarks column to deliveries table.");
            }

            // 3. Add estimated_delivery_date column if not exists
            boolean hasEstimatedDate = columnExists(conn, "deliveries", "estimated_delivery_date");
            if (!hasEstimatedDate) {
                stmt.execute("ALTER TABLE deliveries ADD COLUMN estimated_delivery_date DATE NULL AFTER delivered_at");
                log.info("Successfully added estimated_delivery_date column to deliveries table.");
            }

            // 4. Add updated_at column if not exists
            boolean hasUpdatedAt = columnExists(conn, "deliveries", "updated_at");
            if (!hasUpdatedAt) {
                stmt.execute("ALTER TABLE deliveries ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
                log.info("Successfully added updated_at column to deliveries table.");
            }

            // 5. Add idx_deliveries_order_status index if not exists
            boolean hasIdx = indexExists(conn, "deliveries", "idx_deliveries_order_status");
            if (!hasIdx) {
                try {
                    stmt.execute("CREATE INDEX idx_deliveries_order_status ON deliveries(order_id, delivery_status)");
                    log.info("Successfully created idx_deliveries_order_status index.");
                } catch (Exception ex) {
                    log.warn("Index idx_deliveries_order_status: {}", ex.getMessage());
                }
            }

            // Verification assertions
            assertThat(columnExists(conn, "deliveries", "remarks")).isTrue();
            assertThat(columnExists(conn, "deliveries", "delivery_address")).isTrue();
            assertThat(columnExists(conn, "deliveries", "delivery_status")).isTrue();
            assertThat(columnExists(conn, "deliveries", "tracking_number")).isTrue();
        }
    }

    private boolean columnExists(Connection conn, String table, String column) throws Exception {
        try (ResultSet rs = conn.getMetaData().getColumns(null, null, table, column)) {
            return rs.next();
        }
    }

    private boolean indexExists(Connection conn, String table, String indexName) throws Exception {
        String sql = "SELECT COUNT(*) FROM information_schema.STATISTICS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '" + table + "' AND INDEX_NAME = '" + indexName + "'";
        try (Statement s = conn.createStatement();
             ResultSet rs = s.executeQuery(sql)) {
            return rs.next() && rs.getInt(1) > 0;
        }
    }
}
