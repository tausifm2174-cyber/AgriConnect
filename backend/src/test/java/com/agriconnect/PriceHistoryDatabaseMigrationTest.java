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
class PriceHistoryDatabaseMigrationTest {

    private static final Logger log = LoggerFactory.getLogger(PriceHistoryDatabaseMigrationTest.class);

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Migration: Verify and ensure Phase 11 Price History & Analytics schema idempotently")
    void verifyAndApplyPhase11Migration() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // 1. Ensure source_type column exists
            if (!columnExists(conn, "price_history", "source_type")) {
                stmt.execute("ALTER TABLE price_history ADD COLUMN source_type ENUM('MARKET_MANDI', 'TRANSACTION_SALE') " +
                        "DEFAULT 'TRANSACTION_SALE' AFTER crop_id");
                log.info("Added source_type column to price_history.");
            }

            // 2. Ensure order_id column exists
            if (!columnExists(conn, "price_history", "order_id")) {
                stmt.execute("ALTER TABLE price_history ADD COLUMN order_id INT NULL AFTER source_type");
                log.info("Added order_id column to price_history.");
            }

            // 3. Ensure farmer_id column exists
            if (!columnExists(conn, "price_history", "farmer_id")) {
                stmt.execute("ALTER TABLE price_history ADD COLUMN farmer_id INT NULL AFTER order_id");
                log.info("Added farmer_id column to price_history.");
            }

            // 4. Ensure buyer_id column exists
            if (!columnExists(conn, "price_history", "buyer_id")) {
                stmt.execute("ALTER TABLE price_history ADD COLUMN buyer_id INT NULL AFTER farmer_id");
                log.info("Added buyer_id column to price_history.");
            }

            // 5. Ensure quantity column exists
            if (!columnExists(conn, "price_history", "quantity")) {
                stmt.execute("ALTER TABLE price_history ADD COLUMN quantity DECIMAL(10,2) NULL AFTER buyer_id");
                log.info("Added quantity column to price_history.");
            }

            // 6. Ensure unit_price column exists
            if (!columnExists(conn, "price_history", "unit_price")) {
                stmt.execute("ALTER TABLE price_history ADD COLUMN unit_price DECIMAL(8,2) NULL AFTER quantity");
                log.info("Added unit_price column to price_history.");
            }

            // 7. Ensure total_amount column exists
            if (!columnExists(conn, "price_history", "total_amount")) {
                stmt.execute("ALTER TABLE price_history ADD COLUMN total_amount DECIMAL(12,2) NULL AFTER unit_price");
                log.info("Added total_amount column to price_history.");
            }

            // 8. Ensure foreign key constraints exist
            ensureForeignKey(stmt, conn, "price_history", "fk_price_history_order",
                    "ALTER TABLE price_history ADD CONSTRAINT fk_price_history_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL");
            ensureForeignKey(stmt, conn, "price_history", "fk_price_history_farmer",
                    "ALTER TABLE price_history ADD CONSTRAINT fk_price_history_farmer FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE SET NULL");
            ensureForeignKey(stmt, conn, "price_history", "fk_price_history_buyer",
                    "ALTER TABLE price_history ADD CONSTRAINT fk_price_history_buyer FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE SET NULL");

            // 9. Ensure unique index on order_id
            if (!indexExists(conn, "price_history", "idx_price_history_order_unique")) {
                stmt.execute("CREATE UNIQUE INDEX idx_price_history_order_unique ON price_history(order_id)");
                log.info("Created unique index idx_price_history_order_unique.");
            }

            // 10. Ensure composite indexes
            if (!indexExists(conn, "price_history", "idx_price_history_crop_price")) {
                stmt.execute("CREATE INDEX idx_price_history_crop_price ON price_history(crop_id, unit_price)");
                log.info("Created composite index idx_price_history_crop_price.");
            }
            if (!indexExists(conn, "price_history", "idx_price_history_farmer")) {
                stmt.execute("CREATE INDEX idx_price_history_farmer ON price_history(farmer_id)");
                log.info("Created index idx_price_history_farmer.");
            }
            if (!indexExists(conn, "price_history", "idx_price_history_buyer")) {
                stmt.execute("CREATE INDEX idx_price_history_buyer ON price_history(buyer_id)");
                log.info("Created index idx_price_history_buyer.");
            }

            // Assertions
            assertThat(columnExists(conn, "price_history", "source_type")).isTrue();
            assertThat(columnExists(conn, "price_history", "order_id")).isTrue();
            assertThat(columnExists(conn, "price_history", "farmer_id")).isTrue();
            assertThat(columnExists(conn, "price_history", "buyer_id")).isTrue();
            assertThat(columnExists(conn, "price_history", "quantity")).isTrue();
            assertThat(columnExists(conn, "price_history", "unit_price")).isTrue();
            assertThat(columnExists(conn, "price_history", "total_amount")).isTrue();
            assertThat(columnExists(conn, "price_history", "modal_price_per_kg")).isTrue();
            assertThat(columnExists(conn, "price_history", "min_price_per_kg")).isTrue();
            assertThat(columnExists(conn, "price_history", "max_price_per_kg")).isTrue();
            assertThat(columnExists(conn, "price_history", "market_location")).isTrue();
            assertThat(columnExists(conn, "price_history", "recorded_date")).isTrue();
            assertThat(columnExists(conn, "price_history", "created_at")).isTrue();

            assertThat(indexExists(conn, "price_history", "idx_price_history_order_unique")).isTrue();
            assertThat(indexExists(conn, "price_history", "idx_price_history_crop_price")).isTrue();
        }
    }

    private boolean columnExists(Connection conn, String table, String column) throws Exception {
        try (ResultSet rs = conn.getMetaData().getColumns(null, null, table, column)) {
            return rs.next();
        }
    }

    private boolean indexExists(Connection conn, String table, String indexName) throws Exception {
        try (ResultSet rs = conn.getMetaData().getIndexInfo(null, null, table, false, false)) {
            while (rs.next()) {
                if (indexName.equalsIgnoreCase(rs.getString("INDEX_NAME"))) {
                    return true;
                }
            }
        }
        return false;
    }

    private void ensureForeignKey(Statement stmt, Connection conn, String table, String fkName, String addFkSql) {
        try {
            try (ResultSet rs = conn.getMetaData().getImportedKeys(null, null, table)) {
                while (rs.next()) {
                    if (fkName.equalsIgnoreCase(rs.getString("FK_NAME"))) {
                        return;
                    }
                }
            }
            stmt.execute(addFkSql);
            log.info("Created FK: {}", fkName);
        } catch (Exception ex) {
            log.warn("FK {} creation note: {}", fkName, ex.getMessage());
        }
    }
}
