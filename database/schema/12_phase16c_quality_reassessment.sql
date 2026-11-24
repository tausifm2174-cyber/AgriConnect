-- ===================================================================
-- AgriConnect Phase 16C: Admin Quality Reassessment & Buyer Feedback
-- ===================================================================

-- 1. Extend VerificationStatus enum in quality_assessments to include 'REASSESSMENT_REQUIRED'
ALTER TABLE quality_assessments
    MODIFY COLUMN verification_status ENUM('PENDING', 'VERIFIED', 'REJECTED', 'REASSESSMENT_REQUIRED') DEFAULT 'PENDING';

-- 2. Buyer Quality Feedback Table
CREATE TABLE IF NOT EXISTS buyer_quality_feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL UNIQUE,
    buyer_id INT NOT NULL,
    harvest_id INT NOT NULL,
    quality_assessment_id INT NULL,
    rating INT NOT NULL,
    issue_type ENUM(
        'QUALITY_LOWER_THAN_CERTIFIED',
        'EXCESSIVE_DAMAGE',
        'FRESHNESS_ISSUE',
        'APPEARANCE_ISSUE',
        'RIPENESS_ISSUE',
        'SIZE_MISMATCH',
        'OTHER'
    ) NOT NULL,
    comments VARCHAR(500) NOT NULL,
    review_status ENUM(
        'PENDING_REVIEW',
        'UNDER_REASSESSMENT',
        'RESOLVED',
        'DISMISSED'
    ) DEFAULT 'PENDING_REVIEW',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_feedback_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_feedback_buyer FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_feedback_harvest FOREIGN KEY (harvest_id) REFERENCES harvests(harvest_id) ON DELETE RESTRICT,
    CONSTRAINT fk_feedback_qa FOREIGN KEY (quality_assessment_id) REFERENCES quality_assessments(assessment_id) ON DELETE SET NULL,
    INDEX idx_feedback_order (order_id),
    INDEX idx_feedback_buyer (buyer_id),
    INDEX idx_feedback_harvest (harvest_id),
    INDEX idx_feedback_status (review_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Quality Reassessments History Table
CREATE TABLE IF NOT EXISTS quality_reassessments (
    reassessment_id INT AUTO_INCREMENT PRIMARY KEY,
    quality_assessment_id INT NOT NULL,
    harvest_id INT NOT NULL,
    requested_by INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    buyer_feedback_id INT NULL,
    freshness INT NOT NULL,
    appearance INT NOT NULL,
    size INT NOT NULL,
    color INT NOT NULL,
    ripeness INT NOT NULL,
    damage_percentage DECIMAL(5, 2) NOT NULL,
    recalculated_score DECIMAL(5, 2) NOT NULL,
    recalculated_grade ENUM('A', 'B', 'C') NOT NULL,
    inspection_remarks VARCHAR(500) NOT NULL,
    previous_score DECIMAL(5, 2) NOT NULL,
    previous_grade ENUM('A', 'B', 'C') NOT NULL,
    decision ENUM('RE_VERIFIED', 'REJECTED') NOT NULL,
    inspected_by INT NOT NULL,
    inspected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reassess_qa FOREIGN KEY (quality_assessment_id) REFERENCES quality_assessments(assessment_id) ON DELETE RESTRICT,
    CONSTRAINT fk_reassess_harvest FOREIGN KEY (harvest_id) REFERENCES harvests(harvest_id) ON DELETE RESTRICT,
    CONSTRAINT fk_reassess_requester FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_reassess_inspector FOREIGN KEY (inspected_by) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_reassess_feedback FOREIGN KEY (buyer_feedback_id) REFERENCES buyer_quality_feedback(feedback_id) ON DELETE SET NULL,
    INDEX idx_reassess_qa (quality_assessment_id),
    INDEX idx_reassess_harvest (harvest_id),
    INDEX idx_reassess_decision (decision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
