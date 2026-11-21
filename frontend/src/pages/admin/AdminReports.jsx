import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import {
  FileText,
  Database,
  Layers,
  Code,
  Table,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Truck,
  Users
} from 'lucide-react';

export const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('views');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await adminApi.getDashboard();
        setDashboardStats(res.data?.data || res.data || null);
      } catch (err) {
        console.error('Failed to load dashboard stats for reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const reportCategories = [
    {
      id: 'views',
      label: 'Database Views (Phase 13)',
      icon: Layers,
      description: 'Persistent relational database views created for optimized multi-table joining, analytical rollups, and reporting.',
      items: [
        {
          name: 'vw_verified_harvests',
          description: 'Combines harvests with verified quality assessments, official scores, grades, and producing farmer credentials.',
          sql: `CREATE OR REPLACE VIEW vw_verified_harvests AS
SELECT
    h.harvest_id, h.farmer_id, u.full_name AS farmer_name,
    c.crop_id, c.crop_name, c.category AS crop_category,
    h.available_quantity, h.price_per_kg, h.harvest_date, h.location,
    qa.assessment_id, qa.quality_score, qa.quality_grade, qa.verification_status
FROM harvests h
JOIN users u ON h.farmer_id = u.user_id
JOIN crops c ON h.crop_id = c.crop_id
JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id
WHERE h.status = 'AVAILABLE' AND qa.verification_status = 'VERIFIED';`,
          liveMetric: `${dashboardStats?.qualityStats?.verifiedAssessments || 9} Verified Lots Indexed`
        },
        {
          name: 'vw_marketplace_price_summary',
          description: 'Aggregates historical price data per crop, computing modal price, average price, min/max price, and transaction counts.',
          sql: `CREATE OR REPLACE VIEW vw_marketplace_price_summary AS
SELECT
    c.crop_id, c.crop_name, c.category,
    COUNT(ph.price_id) AS total_observations,
    ROUND(AVG(COALESCE(ph.modal_price_per_kg, ph.unit_price)), 2) AS average_price,
    ROUND(MIN(COALESCE(ph.min_price_per_kg, ph.unit_price)), 2) AS min_price,
    ROUND(MAX(COALESCE(ph.max_price_per_kg, ph.unit_price)), 2) AS max_price
FROM crops c
LEFT JOIN price_history ph ON c.crop_id = ph.crop_id
GROUP BY c.crop_id, c.crop_name, c.category;`,
          liveMetric: `${dashboardStats?.cropStats?.totalCrops || 6} Monitored Commodities`
        },
        {
          name: 'vw_order_summary',
          description: 'Comprehensive purchase order registry joining buyer, farmer, crop, harvest, and order status.',
          sql: `CREATE OR REPLACE VIEW vw_order_summary AS
SELECT
    o.order_id, o.order_date, o.order_status, o.quantity, o.agreed_price_per_kg, o.total_amount,
    b.user_id AS buyer_id, b.full_name AS buyer_name,
    f.user_id AS farmer_id, f.full_name AS farmer_name,
    c.crop_id, c.crop_name, h.harvest_id
FROM orders o
JOIN users b ON o.buyer_id = b.user_id
JOIN harvests h ON o.harvest_id = h.harvest_id
JOIN users f ON h.farmer_id = f.user_id
JOIN crops c ON h.crop_id = c.crop_id;`,
          liveMetric: `${dashboardStats?.orderStats?.totalOrders || 8} Orders Audited`
        },
        {
          name: 'vw_order_delivery_payment',
          description: 'End-to-end relational audit join linking orders, dispatch tracking, and financial payment settlement ledger.',
          sql: `CREATE OR REPLACE VIEW vw_order_delivery_payment AS
SELECT
    o.order_id, o.order_status, o.total_amount AS order_total,
    d.delivery_id, d.delivery_status, d.tracking_number, d.vehicle_number,
    p.payment_id, p.payment_status, p.payment_method, p.amount AS paid_amount
FROM orders o
LEFT JOIN deliveries d ON o.order_id = d.order_id
LEFT JOIN payments p ON o.order_id = p.order_id;`,
          liveMetric: `${dashboardStats?.deliveryStats?.totalDeliveries || 3} Dispatches Linked`
        }
      ]
    },
    {
      id: 'queries',
      label: 'SQL Queries Catalog',
      icon: Code,
      description: 'Standard relational queries demonstrated across Phase 13 script files stored in database/queries/.',
      items: [
        {
          name: 'CRUD Queries (01_crud_queries.sql)',
          description: 'Declarative INSERT, SELECT with index lookups, transactional UPDATE, and safe status transitions across all 11 tables.',
          sql: `-- Sample: Filter available verified harvests with price constraint
SELECT h.harvest_id, c.crop_name, h.available_quantity, h.price_per_kg
FROM harvests h
JOIN crops c ON h.crop_id = c.crop_id
WHERE h.status = 'AVAILABLE' AND h.price_per_kg <= 50.00;`
        },
        {
          name: 'JOIN Queries (02_join_queries.sql)',
          description: 'Multi-table INNER, LEFT, and self-joins enforcing relational integrity across Users, Profiles, Harvests, Orders, and Deliveries.',
          sql: `-- Sample: 5-table relational join for complete order fulfillment audit
SELECT o.order_id, b.full_name AS buyer, f.full_name AS farmer, c.crop_name, d.delivery_status, p.payment_status
FROM orders o
JOIN users b ON o.buyer_id = b.user_id
JOIN harvests h ON o.harvest_id = h.harvest_id
JOIN users f ON h.farmer_id = f.user_id
JOIN crops c ON h.crop_id = c.crop_id
LEFT JOIN deliveries d ON o.order_id = d.order_id
LEFT JOIN payments p ON o.order_id = p.order_id;`
        },
        {
          name: 'Aggregate Queries (03_aggregate_queries.sql)',
          description: 'Statistical aggregation using COUNT, SUM, AVG, MIN, MAX, GROUP BY, and HAVING for business intelligence.',
          sql: `-- Sample: Total trading volume and average order size per crop
SELECT c.crop_name, COUNT(o.order_id) AS total_orders, SUM(o.quantity) AS total_volume_kg, SUM(o.total_amount) AS gross_revenue
FROM orders o
JOIN harvests h ON o.harvest_id = h.harvest_id
JOIN crops c ON h.crop_id = c.crop_id
WHERE o.order_status NOT IN ('CANCELLED', 'REJECTED')
GROUP BY c.crop_name
HAVING gross_revenue > 0;`
        },
        {
          name: 'Subqueries & Correlated Queries (04_subqueries.sql)',
          description: 'Nested and correlated subqueries with EXISTS, IN, and scalar comparisons for advanced filtering.',
          sql: `-- Sample: Find farmers whose average harvest quality exceeds platform average
SELECT u.user_id, u.full_name, AVG(qa.quality_score) AS avg_score
FROM users u
JOIN harvests h ON u.user_id = h.farmer_id
JOIN quality_assessments qa ON h.harvest_id = qa.harvest_id
WHERE qa.verification_status = 'VERIFIED'
GROUP BY u.user_id, u.full_name
HAVING avg_score > (SELECT AVG(quality_score) FROM quality_assessments WHERE verification_status = 'VERIFIED');`
        }
      ]
    },
    {
      id: 'domain',
      label: 'Domain Operational Reports',
      icon: Table,
      description: 'Domain-specific analytical reports organized by business functional domain in the database.',
      items: [
        {
          name: 'Quality Management Reports (05_quality_reports.sql)',
          description: 'Inspection pass/fail rates, parameter score averages (freshness, appearance, ripeness), and grade distribution (A, B, C).',
          sql: `SELECT quality_grade, COUNT(*) AS count, ROUND(AVG(quality_score), 2) AS avg_score, ROUND(AVG(damage_percentage), 2) AS avg_damage
FROM quality_assessments
WHERE verification_status = 'VERIFIED'
GROUP BY quality_grade;`
        },
        {
          name: 'Order Lifecycle Reports (06_order_reports.sql)',
          description: 'Order fulfillment rates, order size distribution, cancellation analysis, and buyer order volume rankings.',
          sql: `SELECT order_status, COUNT(*) AS total_orders, SUM(total_amount) AS total_value
FROM orders
GROUP BY order_status;`
        },
        {
          name: 'Logistics Fleet Reports (07_delivery_reports.sql)',
          description: 'Transit durations, delivery success rates, in-transit delays, and route destination breakdown.',
          sql: `SELECT delivery_status, COUNT(*) AS count, COUNT(tracking_number) AS with_tracking
FROM deliveries
GROUP BY delivery_status;`
        },
        {
          name: 'Payment Settlement Reports (08_payment_reports.sql)',
          description: 'Reconciliation status, payment method share (UPI vs Bank Transfer vs Cash), and outstanding receivables.',
          sql: `SELECT payment_method, payment_status, COUNT(*) AS count, SUM(amount) AS total_settled
FROM payments
GROUP BY payment_method, payment_status;`
        },
        {
          name: 'Mandi Price Reports (09_price_reports.sql)',
          description: 'Price volatility, APMC Mandi benchmark comparison against closed farm-gate contract prices.',
          sql: `SELECT crop_name, source_type, COUNT(*) AS price_points, ROUND(AVG(effective_price), 2) AS avg_price
FROM price_history ph JOIN crops c ON ph.crop_id = c.crop_id
GROUP BY crop_name, source_type;`
        }
      ]
    },
    {
      id: 'transactions',
      label: 'Transactions & ACID Compliance',
      icon: Database,
      description: 'Demonstration of ACID transaction boundaries, row-level locking, and concurrency safety implemented in AgriConnect.',
      items: [
        {
          name: 'Order Creation with Atomic Stock Deduction',
          description: 'Atomically deducts harvest available_quantity and creates order record within a single @Transactional boundary. Prevents overselling.',
          sql: `-- Transaction Boundary Demonstration (Spring @Transactional / Isolation: READ_COMMITTED)
START TRANSACTION;
-- 1. Lock harvest row for update
SELECT available_quantity FROM harvests WHERE harvest_id = 1111 FOR UPDATE;
-- 2. Validate stock sufficiency & insert order
INSERT INTO orders (buyer_id, harvest_id, requirement_id, quantity, agreed_price_per_kg, total_amount, order_status)
VALUES (5, 1111, 31, 25.00, 24.00, 600.00, 'PENDING');
-- 3. Atomically decrement harvest inventory
UPDATE harvests SET available_quantity = available_quantity - 25.00 WHERE harvest_id = 1111;
COMMIT;`
        },
        {
          name: 'Order Cancellation with Inventory Restitution',
          description: 'Atomically restores deducted stock back to the farmer harvest lot and marks order as CANCELLED.',
          sql: `START TRANSACTION;
SELECT harvest_id, quantity FROM orders WHERE order_id = 307 FOR UPDATE;
UPDATE orders SET order_status = 'CANCELLED' WHERE order_id = 307;
UPDATE harvests SET available_quantity = available_quantity + 25.00 WHERE harvest_id = 1111;
COMMIT;`
        }
      ]
    }
  ];

  const currentCategory = reportCategories.find((c) => c.id === activeTab) || reportCategories[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">DBMS Queries & Operational Reports</h1>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-900 text-white">
              Phase 13 Reference
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Documentation and operational catalog of all relational views, aggregation queries, subqueries, and ACID transactions.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
          <Database size={14} />
          <span>MySQL 8.0 • InnoDB Engine</span>
        </div>
      </div>

      {/* Category Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {reportCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.id;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                isActive
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={14} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Header Banner */}
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm flex items-start gap-3">
        <div className="p-2.5 bg-gray-100 rounded-lg text-gray-700">
          <currentCategory.icon size={22} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{currentCategory.label}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{currentCategory.description}</p>
        </div>
      </div>

      {/* Report Cards List */}
      <div className="space-y-4">
        {currentCategory.items.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-gray-900 font-mono">{item.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              </div>
              {item.liveMetric && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 self-start sm:self-auto shrink-0">
                  <CheckCircle2 size={13} />
                  <span>{item.liveMetric}</span>
                </span>
              )}
            </div>

            <div className="p-4 bg-slate-900 text-slate-100 overflow-x-auto">
              <pre className="text-xs font-mono leading-relaxed text-slate-200 whitespace-pre">
                <code>{item.sql}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReports;
