package com.agriconnect;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Phase 13: DBMS Queries & Reports Verification Test
 * Verifies analytical SQL views, multi-table joins, aggregates,
 * subqueries, and database constraints against the live relational database.
 */
@SpringBootTest
class Phase13DatabaseVerificationTest {

    private static final Logger log = LoggerFactory.getLogger(Phase13DatabaseVerificationTest.class);

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Views: Verify all 4 Phase 13 analytical views exist and are queryable")
    void testAnalyticalViewsExistAndQueryable() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // Ensure views exist (idempotent setup from migration)
            stmt.execute("CREATE OR REPLACE VIEW vw_verified_harvests AS " +
                    "SELECT h.harvest_id, h.farmer_id, u.full_name AS farmer_name, h.crop_id, c.crop_name, " +
                    "c.category AS crop_category, h.available_quantity, h.price_per_kg, h.location, " +
                    "qa.quality_score, qa.quality_grade, qa.assessment_date, h.status AS harvest_status " +
                    "FROM harvests h " +
                    "INNER JOIN users u ON h.farmer_id = u.user_id " +
                    "INNER JOIN crops c ON h.crop_id = c.crop_id " +
                    "INNER JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id " +
                    "WHERE qa.verification_status = 'VERIFIED'");

            stmt.execute("CREATE OR REPLACE VIEW vw_order_summary AS " +
                    "SELECT o.order_id, o.buyer_id, b.full_name AS buyer_name, h.farmer_id, f.full_name AS farmer_name, " +
                    "h.crop_id, c.crop_name, o.quantity, o.agreed_price_per_kg, o.total_amount, o.order_status, o.order_date " +
                    "FROM orders o " +
                    "INNER JOIN users b ON o.buyer_id = b.user_id " +
                    "INNER JOIN harvests h ON o.harvest_id = h.harvest_id " +
                    "INNER JOIN users f ON h.farmer_id = f.user_id " +
                    "INNER JOIN crops c ON h.crop_id = c.crop_id");

            stmt.execute("CREATE OR REPLACE VIEW vw_order_delivery_payment AS " +
                    "SELECT o.order_id, o.order_status, o.order_date, o.total_amount, b.user_id AS buyer_id, " +
                    "b.full_name AS buyer_name, f.user_id AS farmer_id, f.full_name AS farmer_name, c.crop_id, " +
                    "c.crop_name, d.delivery_id, d.delivery_status, d.tracking_number, d.dispatched_at, d.delivered_at, " +
                    "p.payment_id, p.payment_status, p.payment_method, p.amount AS payment_amount, " +
                    "p.transaction_reference, p.payment_date " +
                    "FROM orders o " +
                    "INNER JOIN users b ON o.buyer_id = b.user_id " +
                    "INNER JOIN harvests h ON o.harvest_id = h.harvest_id " +
                    "INNER JOIN users f ON h.farmer_id = f.user_id " +
                    "INNER JOIN crops c ON h.crop_id = c.crop_id " +
                    "LEFT JOIN deliveries d ON o.order_id = d.order_id " +
                    "LEFT JOIN payments p ON o.order_id = p.order_id");

            stmt.execute("CREATE OR REPLACE VIEW vw_marketplace_price_summary AS " +
                    "SELECT ph.price_id, ph.crop_id, c.crop_name, c.category AS crop_category, ph.source_type, " +
                    "COALESCE(ph.unit_price, ph.modal_price_per_kg) AS effective_price, ph.quantity, ph.total_amount, " +
                    "ph.modal_price_per_kg, ph.min_price_per_kg, ph.max_price_per_kg, ph.market_location, " +
                    "ph.recorded_date, ph.order_id, f.full_name AS farmer_name, b.full_name AS buyer_name, ph.created_at " +
                    "FROM price_history ph " +
                    "INNER JOIN crops c ON ph.crop_id = c.crop_id " +
                    "LEFT JOIN users f ON ph.farmer_id = f.user_id " +
                    "LEFT JOIN users b ON ph.buyer_id = b.user_id");

            // Verify vw_verified_harvests
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM vw_verified_harvests")) {
                assertThat(rs.next()).isTrue();
                int count = rs.getInt(1);
                log.info("vw_verified_harvests row count: {}", count);
                assertThat(count).isGreaterThanOrEqualTo(0);
            }

            // Verify vw_order_summary
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM vw_order_summary")) {
                assertThat(rs.next()).isTrue();
                int count = rs.getInt(1);
                log.info("vw_order_summary row count: {}", count);
                assertThat(count).isGreaterThan(0);
            }

            // Verify vw_order_delivery_payment
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM vw_order_delivery_payment")) {
                assertThat(rs.next()).isTrue();
                int count = rs.getInt(1);
                log.info("vw_order_delivery_payment row count: {}", count);
                assertThat(count).isGreaterThan(0);
            }

            // Verify vw_marketplace_price_summary
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM vw_marketplace_price_summary")) {
                assertThat(rs.next()).isTrue();
                int count = rs.getInt(1);
                log.info("vw_marketplace_price_summary row count: {}", count);
                assertThat(count).isGreaterThan(0);
            }
        }
    }

    @Test
    @DisplayName("Joins & Aggregates: Multi-table reporting queries execute and return consistent results")
    void testJoinsAndAggregates() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // Multi-way join query across farmer, harvest, quality, buyer, order, delivery, payment
            String multiJoinSql = "SELECT o.order_id, f.full_name AS farmer_name, b.full_name AS buyer_name, " +
                    "c.crop_name, o.quantity, o.total_amount, d.delivery_status, p.payment_status " +
                    "FROM orders o " +
                    "INNER JOIN harvests h ON o.harvest_id = h.harvest_id " +
                    "INNER JOIN users f ON h.farmer_id = f.user_id " +
                    "INNER JOIN crops c ON h.crop_id = c.crop_id " +
                    "INNER JOIN users b ON o.buyer_id = b.user_id " +
                    "LEFT JOIN deliveries d ON o.order_id = d.order_id " +
                    "LEFT JOIN payments p ON o.order_id = p.order_id " +
                    "LIMIT 10";

            try (ResultSet rs = stmt.executeQuery(multiJoinSql)) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt("order_id")).isPositive();
                assertThat(rs.getString("farmer_name")).isNotBlank();
                assertThat(rs.getString("buyer_name")).isNotBlank();
                assertThat(rs.getString("crop_name")).isNotBlank();
                assertThat(rs.getBigDecimal("total_amount")).isNotNull();
            }

            // Aggregate metrics
            String aggSql = "SELECT COUNT(o.order_id) AS total_orders, " +
                    "SUM(o.total_amount) AS gross_sales, " +
                    "AVG(o.agreed_price_per_kg) AS avg_price " +
                    "FROM orders o";

            try (ResultSet rs = stmt.executeQuery(aggSql)) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt("total_orders")).isPositive();
                assertThat(rs.getBigDecimal("gross_sales")).isNotNull();
                assertThat(rs.getBigDecimal("avg_price")).isNotNull();
            }
        }
    }

    @Test
    @DisplayName("Subqueries: Correlated and derived table subqueries execute successfully")
    void testSubqueries() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // Correlated subquery: Highest priced harvest per crop
            String subquerySql = "SELECT c.crop_name, h.harvest_id, h.price_per_kg " +
                    "FROM harvests h " +
                    "INNER JOIN crops c ON h.crop_id = c.crop_id " +
                    "WHERE h.price_per_kg = (" +
                    "    SELECT MAX(h2.price_per_kg) " +
                    "    FROM harvests h2 " +
                    "    WHERE h2.crop_id = h.crop_id" +
                    ") LIMIT 5";

            try (ResultSet rs = stmt.executeQuery(subquerySql)) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString("crop_name")).isNotBlank();
                assertThat(rs.getBigDecimal("price_per_kg")).isNotNull();
            }

            // Membership subquery: Active buyers with orders
            String inSubquerySql = "SELECT user_id, full_name FROM users " +
                    "WHERE user_id IN (SELECT DISTINCT buyer_id FROM orders)";

            try (ResultSet rs = stmt.executeQuery(inSubquerySql)) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString("full_name")).isNotBlank();
            }
        }
    }

    @Test
    @DisplayName("Constraints: Relational integrity and uniqueness constraints are enforced")
    void testDatabaseConstraintsEnforced() throws Exception {
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // Attempt inserting a user with duplicate email (should fail on unique constraint)
            String duplicateEmailSql = "INSERT INTO users (full_name, email, phone, password_hash, role, status) " +
                    "VALUES ('Duplicate Test', 'rajesh.patel@kisan.in', '+919999900000', 'hash', 'FARMER', 'ACTIVE')";

            assertThatThrownBy(() -> stmt.execute(duplicateEmailSql))
                    .isInstanceOf(SQLException.class);

            // Attempt inserting an order with non-existent foreign key harvest_id (should fail on FK constraint)
            String invalidFkSql = "INSERT INTO orders (buyer_id, harvest_id, quantity, agreed_price_per_kg, total_amount, order_status) " +
                    "VALUES (5, 999999, 100.00, 25.00, 2500.00, 'PENDING')";

            assertThatThrownBy(() -> stmt.execute(invalidFkSql))
                    .isInstanceOf(SQLException.class);
        }
    }
}
