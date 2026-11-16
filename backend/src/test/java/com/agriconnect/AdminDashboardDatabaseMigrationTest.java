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
class AdminDashboardDatabaseMigrationTest {

    private static final Logger log = LoggerFactory.getLogger(AdminDashboardDatabaseMigrationTest.class);

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Migration: Verify and ensure Phase 12 Admin Dashboard indexes idempotently")
    void verifyAndApplyPhase12Migration() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // 1. Ensure idx_price_history_source index exists
            if (!indexExists(conn, "price_history", "idx_price_history_source")) {
                stmt.execute("CREATE INDEX idx_price_history_source ON price_history(source_type)");
                log.info("Created index idx_price_history_source.");
            }

            // 2. Ensure idx_harvests_status_only index exists
            if (!indexExists(conn, "harvests", "idx_harvests_status_only")) {
                stmt.execute("CREATE INDEX idx_harvests_status_only ON harvests(status)");
                log.info("Created index idx_harvests_status_only.");
            }

            // 3. Ensure idx_buyer_req_status_only index exists
            if (!indexExists(conn, "buyer_requirements", "idx_buyer_req_status_only")) {
                stmt.execute("CREATE INDEX idx_buyer_req_status_only ON buyer_requirements(status)");
                log.info("Created index idx_buyer_req_status_only.");
            }

            // Assertions
            assertThat(indexExists(conn, "price_history", "idx_price_history_source")).isTrue();
            assertThat(indexExists(conn, "harvests", "idx_harvests_status_only")).isTrue();
            assertThat(indexExists(conn, "buyer_requirements", "idx_buyer_req_status_only")).isTrue();
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
}
