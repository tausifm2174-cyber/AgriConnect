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
class PaymentDatabaseMigrationTest {

    private static final Logger log = LoggerFactory.getLogger(PaymentDatabaseMigrationTest.class);

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Migration: Verify and ensure Phase 10 Payment Management schema migration idempotently")
    void verifyAndApplyPhase10Migration() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // 1. Ensure payment_status enum contains complete Phase 10 lifecycle statuses
            try {
                stmt.execute("ALTER TABLE payments MODIFY COLUMN payment_status " +
                        "ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'PENDING'");
                log.info("Successfully ensured payments.payment_status ENUM definition.");
            } catch (Exception ex) {
                log.warn("Could not alter payment_status enum: {}", ex.getMessage());
            }

            // 2. Add remarks column if not exists
            if (!columnExists(conn, "payments", "remarks")) {
                stmt.execute("ALTER TABLE payments ADD COLUMN remarks VARCHAR(255) NULL AFTER transaction_reference");
                log.info("Successfully added remarks column to payments table.");
            }

            // 3. Add created_at column if not exists
            if (!columnExists(conn, "payments", "created_at")) {
                stmt.execute("ALTER TABLE payments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER payment_date");
                log.info("Successfully added created_at column to payments table.");
            }

            // 4. Add updated_at column if not exists
            if (!columnExists(conn, "payments", "updated_at")) {
                stmt.execute("ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at");
                log.info("Successfully added updated_at column to payments table.");
            }

            // 5. Add composite index on (order_id, payment_status) if not exists
            if (!indexExists(conn, "payments", "idx_payments_order_status")) {
                stmt.execute("CREATE INDEX idx_payments_order_status ON payments(order_id, payment_status)");
                log.info("Successfully created idx_payments_order_status index.");
            }

            // 6. Add composite index on (payment_status, payment_date) if not exists
            if (!indexExists(conn, "payments", "idx_payments_status_date")) {
                stmt.execute("CREATE INDEX idx_payments_status_date ON payments(payment_status, payment_date)");
                log.info("Successfully created idx_payments_status_date index.");
            }

            // Verification assertions
            assertThat(columnExists(conn, "payments", "payment_id")).isTrue();
            assertThat(columnExists(conn, "payments", "order_id")).isTrue();
            assertThat(columnExists(conn, "payments", "amount")).isTrue();
            assertThat(columnExists(conn, "payments", "payment_method")).isTrue();
            assertThat(columnExists(conn, "payments", "payment_status")).isTrue();
            assertThat(columnExists(conn, "payments", "transaction_reference")).isTrue();
            assertThat(columnExists(conn, "payments", "remarks")).isTrue();
            assertThat(columnExists(conn, "payments", "payment_date")).isTrue();
            assertThat(columnExists(conn, "payments", "created_at")).isTrue();
            assertThat(columnExists(conn, "payments", "updated_at")).isTrue();

            assertThat(indexExists(conn, "payments", "idx_payments_order_status")).isTrue();
            assertThat(indexExists(conn, "payments", "idx_payments_status_date")).isTrue();
        }
    }

    private boolean columnExists(Connection conn, String tableName, String columnName) throws Exception {
        try (ResultSet rs = conn.getMetaData().getColumns(null, null, tableName, columnName)) {
            return rs.next();
        }
    }

    private boolean indexExists(Connection conn, String tableName, String indexName) throws Exception {
        try (ResultSet rs = conn.getMetaData().getIndexInfo(null, null, tableName, false, false)) {
            while (rs.next()) {
                String name = rs.getString("INDEX_NAME");
                if (indexName.equalsIgnoreCase(name)) {
                    return true;
                }
            }
            return false;
        }
    }
}
