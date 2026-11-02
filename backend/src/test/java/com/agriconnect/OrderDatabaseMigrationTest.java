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
class OrderDatabaseMigrationTest {

    private static final Logger log = LoggerFactory.getLogger(OrderDatabaseMigrationTest.class);

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Migration: Verify and apply Phase 8 Order Management schema migration idempotently")
    void verifyAndApplyPhase8Migration() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // 1. Update order_status enum
            try {
                stmt.execute("ALTER TABLE orders MODIFY COLUMN order_status " +
                        "ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'CONFIRMED', 'SHIPPED', 'DELIVERED') DEFAULT 'PENDING'");
                log.info("Successfully updated orders.order_status ENUM definition.");
            } catch (Exception ex) {
                log.warn("Could not update order_status enum: {}", ex.getMessage());
            }

            // 2. Add requirement_id column if not exists
            boolean hasRequirementId = columnExists(conn, "orders", "requirement_id");
            if (!hasRequirementId) {
                stmt.execute("ALTER TABLE orders ADD COLUMN requirement_id INT NULL AFTER harvest_id");
                log.info("Successfully added requirement_id column to orders table.");
            }

            // 3. Add remarks column if not exists
            boolean hasRemarks = columnExists(conn, "orders", "remarks");
            if (!hasRemarks) {
                stmt.execute("ALTER TABLE orders ADD COLUMN remarks VARCHAR(255) NULL AFTER total_amount");
                log.info("Successfully added remarks column to orders table.");
            }

            // 4. Add cancellation_reason column if not exists
            boolean hasCancellationReason = columnExists(conn, "orders", "cancellation_reason");
            if (!hasCancellationReason) {
                stmt.execute("ALTER TABLE orders ADD COLUMN cancellation_reason VARCHAR(255) NULL AFTER remarks");
                log.info("Successfully added cancellation_reason column to orders table.");
            }

            // 5. Add FK constraint if not exists
            boolean hasFk = constraintExists(conn, "orders", "fk_orders_requirement");
            if (!hasFk) {
                try {
                    stmt.execute("ALTER TABLE orders ADD CONSTRAINT fk_orders_requirement " +
                            "FOREIGN KEY (requirement_id) REFERENCES buyer_requirements(requirement_id) " +
                            "ON DELETE SET NULL ON UPDATE CASCADE");
                    log.info("Successfully added fk_orders_requirement foreign key.");
                } catch (Exception ex) {
                    log.warn("Foreign key fk_orders_requirement: {}", ex.getMessage());
                }
            }

            // 6. Add idx_orders_status index if not exists
            boolean hasIdx = indexExists(conn, "orders", "idx_orders_status");
            if (!hasIdx) {
                try {
                    stmt.execute("CREATE INDEX idx_orders_status ON orders(order_status)");
                    log.info("Successfully created idx_orders_status index.");
                } catch (Exception ex) {
                    log.warn("Index idx_orders_status: {}", ex.getMessage());
                }
            }

            // Verification assertions
            assertThat(columnExists(conn, "orders", "requirement_id")).isTrue();
            assertThat(columnExists(conn, "orders", "remarks")).isTrue();
            assertThat(columnExists(conn, "orders", "cancellation_reason")).isTrue();
        }
    }

    private boolean columnExists(Connection conn, String table, String column) throws Exception {
        try (ResultSet rs = conn.getMetaData().getColumns(null, null, table, column)) {
            return rs.next();
        }
    }

    private boolean constraintExists(Connection conn, String table, String constraintName) throws Exception {
        String sql = "SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '" + table + "' AND CONSTRAINT_NAME = '" + constraintName + "'";
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            return rs.next() && rs.getInt(1) > 0;
        }
    }

    private boolean indexExists(Connection conn, String table, String indexName) throws Exception {
        String sql = "SELECT COUNT(*) FROM information_schema.STATISTICS " +
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '" + table + "' AND INDEX_NAME = '" + indexName + "'";
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {
            return rs.next() && rs.getInt(1) > 0;
        }
    }
}
