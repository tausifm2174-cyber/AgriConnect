package com.agriconnect.service;

import com.agriconnect.dto.*;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.DuplicateResourceException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.HarvestRepository;
import com.agriconnect.repository.QualityAssessmentRepository;
import com.agriconnect.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service managing Quality Assessment and Quality Verification workflows (Phase 5).
 * Enforces server-side score calculation, grading rules, admin authorization,
 * farmer harvest ownership boundaries, and database integrity constraints.
 */
@Service
public class QualityAssessmentService {

    private static final Logger log = LoggerFactory.getLogger(QualityAssessmentService.class);

    private final QualityAssessmentRepository qualityAssessmentRepository;
    private final HarvestRepository harvestRepository;
    private final UserRepository userRepository;

    public QualityAssessmentService(QualityAssessmentRepository qualityAssessmentRepository,
                                    HarvestRepository harvestRepository,
                                    UserRepository userRepository) {
        this.qualityAssessmentRepository = qualityAssessmentRepository;
        this.harvestRepository = harvestRepository;
        this.userRepository = userRepository;
    }

    // ===================================================================
    // Centralized Calculation & Grading Rules (Sections 5, 6, 18)
    // ===================================================================

    /**
     * Calculates the official quality score from 5 agricultural inspection parameters:
     * Average = (freshness + appearance + size + color + ripeness) / 5.0
     * Quality Score = Average * 10.0
     * Rounded to 2 decimal places with HALF_UP.
     */
    public static BigDecimal calculateQualityScore(int freshness, int appearance, int size, int color, int ripeness) {
        validateParameterScale("Freshness", freshness);
        validateParameterScale("Appearance", appearance);
        validateParameterScale("Size", size);
        validateParameterScale("Color", color);
        validateParameterScale("Ripeness", ripeness);

        int total = freshness + appearance + size + color + ripeness;
        BigDecimal sum = BigDecimal.valueOf(total);
        return sum.divide(BigDecimal.valueOf(5), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(10))
                .setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * Determines quality grade from quality score:
     * Score 80.00 – 100.00 -> Grade A
     * Score 60.00 – 79.99  -> Grade B
     * Score 0.00 – 59.99   -> Grade C
     */
    public static QualityGrade determineQualityGrade(BigDecimal score) {
        if (score == null) {
            throw new BadRequestException("Quality score cannot be null.");
        }
        if (score.compareTo(BigDecimal.ZERO) < 0 || score.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("Quality score must be between 0 and 100.");
        }

        if (score.compareTo(BigDecimal.valueOf(80)) >= 0) {
            return QualityGrade.A;
        } else if (score.compareTo(BigDecimal.valueOf(60)) >= 0) {
            return QualityGrade.B;
        } else {
            return QualityGrade.C;
        }
    }

    private static void validateParameterScale(String paramName, int value) {
        if (value < 1 || value > 10) {
            throw new BadRequestException(paramName + " rating must be between 1 and 10 (received: " + value + ").");
        }
    }

    private static void validateDamagePercentage(BigDecimal damagePercentage) {
        if (damagePercentage == null) {
            throw new BadRequestException("Damage percentage is required.");
        }
        if (damagePercentage.compareTo(BigDecimal.ZERO) < 0 || damagePercentage.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new BadRequestException("Damage percentage must be between 0.00% and 100.00% (received: " + damagePercentage + ").");
        }
    }

    // ===================================================================
    // Admin Assessment Operations
    // ===================================================================

    /**
     * Creates an official quality assessment for a harvest lot.
     * Accessible only by authenticated administrators.
     * Enforces the 1:1 Harvest to QualityAssessment constraint (409 Conflict if duplicate).
     */
    @Transactional
    public QualityAssessmentResponse createAssessment(Integer adminUserId, CreateQualityAssessmentRequest request) {
        User admin = validateAdminUser(adminUserId);

        Harvest harvest = harvestRepository.findById(request.getHarvestId())
                .orElseThrow(() -> new ResourceNotFoundException("Harvest not found with ID: " + request.getHarvestId()));

        if (qualityAssessmentRepository.existsByHarvest_HarvestId(request.getHarvestId())) {
            log.warn("Attempt to create duplicate assessment for harvest ID: {}", request.getHarvestId());
            throw new DuplicateResourceException("A quality assessment already exists for harvest #" +
                    request.getHarvestId() + ". Please update the existing assessment instead.");
        }

        validateDamagePercentage(request.getDamagePercentage());

        BigDecimal score = calculateQualityScore(
                request.getFreshness(),
                request.getAppearance(),
                request.getSize(),
                request.getColor(),
                request.getRipeness()
        );
        QualityGrade grade = determineQualityGrade(score);

        QualityAssessment assessment = new QualityAssessment(
                harvest,
                admin,
                request.getFreshness(),
                request.getAppearance(),
                request.getSize(),
                request.getColor(),
                request.getRipeness(),
                request.getDamagePercentage(),
                score,
                grade,
                VerificationStatus.PENDING,
                LocalDate.now(),
                request.getInspectorNotes() != null ? request.getInspectorNotes().trim() : null
        );

        QualityAssessment saved = qualityAssessmentRepository.save(assessment);
        log.info("Admin {} created quality assessment #{} for harvest #{} (Score: {}, Grade: {})",
                adminUserId, saved.getAssessmentId(), harvest.getHarvestId(), score, grade);

        return new QualityAssessmentResponse(saved);
    }

    /**
     * Retrieves all harvests requiring quality assessment or filtered by status.
     * If status is null or 'PENDING', returns harvests awaiting inspection or verification.
     */
    @Transactional(readOnly = true)
    public List<AdminHarvestQualitySummaryResponse> getPendingHarvests(String statusFilter) {
        List<Harvest> allHarvests = harvestRepository.findAll();

        return allHarvests.stream()
                .map(harvest -> {
                    Optional<QualityAssessment> qaOpt = qualityAssessmentRepository.findByHarvest_HarvestId(harvest.getHarvestId());
                    return new AdminHarvestQualitySummaryResponse(harvest, qaOpt.orElse(null));
                })
                .filter(summary -> {
                    if (statusFilter == null || statusFilter.trim().isEmpty() || "PENDING".equalsIgnoreCase(statusFilter)) {
                        // Pending queue includes unassessed lots and lots awaiting verification
                        return !summary.isHasAssessment() || "PENDING".equalsIgnoreCase(summary.getAssessmentStatus());
                    } else if ("ALL".equalsIgnoreCase(statusFilter)) {
                        return true;
                    } else if ("NOT_ASSESSED".equalsIgnoreCase(statusFilter)) {
                        return !summary.isHasAssessment();
                    } else {
                        return statusFilter.equalsIgnoreCase(summary.getAssessmentStatus());
                    }
                })
                .toList();
    }

    /**
     * Retrieves full harvest details along with any existing quality assessment.
     */
    @Transactional(readOnly = true)
    public HarvestQualityDetailResponse getHarvestDetailsForAssessment(Integer harvestId) {
        Harvest harvest = harvestRepository.findById(harvestId)
                .orElseThrow(() -> new ResourceNotFoundException("Harvest not found with ID: " + harvestId));

        Optional<QualityAssessment> assessmentOpt = qualityAssessmentRepository.findByHarvest_HarvestId(harvestId);

        return new HarvestQualityDetailResponse(
                new HarvestResponse(harvest),
                assessmentOpt.map(QualityAssessmentResponse::new).orElse(null)
        );
    }

    /**
     * Retrieves a quality assessment by its ID.
     */
    @Transactional(readOnly = true)
    public QualityAssessmentResponse getAssessmentById(Integer assessmentId) {
        QualityAssessment qa = qualityAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Quality assessment not found with ID: " + assessmentId));
        return new QualityAssessmentResponse(qa);
    }

    /**
     * Updates an existing quality assessment.
     * Recalculates score and grade server-side, and resets status to PENDING for admin re-verification.
     */
    @Transactional
    public QualityAssessmentResponse updateAssessment(Integer adminUserId, Integer assessmentId, UpdateQualityAssessmentRequest request) {
        User admin = validateAdminUser(adminUserId);

        QualityAssessment qa = qualityAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Quality assessment not found with ID: " + assessmentId));

        validateDamagePercentage(request.getDamagePercentage());

        BigDecimal score = calculateQualityScore(
                request.getFreshness(),
                request.getAppearance(),
                request.getSize(),
                request.getColor(),
                request.getRipeness()
        );
        QualityGrade grade = determineQualityGrade(score);

        qa.setFreshness(request.getFreshness());
        qa.setAppearance(request.getAppearance());
        qa.setSize(request.getSize());
        qa.setColor(request.getColor());
        qa.setRipeness(request.getRipeness());
        qa.setDamagePercentage(request.getDamagePercentage());
        qa.setQualityScore(score);
        qa.setQualityGrade(grade);
        qa.setVerificationStatus(VerificationStatus.PENDING); // Reset to PENDING as per Section 21
        qa.setAdmin(admin);
        if (request.getInspectorNotes() != null) {
            qa.setInspectorNotes(request.getInspectorNotes().trim());
        }

        QualityAssessment updated = qualityAssessmentRepository.save(qa);
        log.info("Admin {} updated quality assessment #{} (Recalculated Score: {}, Grade: {})",
                adminUserId, assessmentId, score, grade);

        return new QualityAssessmentResponse(updated);
    }

    /**
     * Formally verifies a quality assessment.
     */
    @Transactional
    public QualityAssessmentResponse verifyAssessment(Integer adminUserId, Integer assessmentId) {
        User admin = validateAdminUser(adminUserId);

        QualityAssessment qa = qualityAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Quality assessment not found with ID: " + assessmentId));

        qa.setVerificationStatus(VerificationStatus.VERIFIED);
        qa.setAdmin(admin);

        QualityAssessment verified = qualityAssessmentRepository.save(qa);
        log.info("Admin {} VERIFIED quality assessment #{} for harvest lot #{}",
                adminUserId, assessmentId, qa.getHarvest().getHarvestId());

        return new QualityAssessmentResponse(verified);
    }

    /**
     * Rejects a quality assessment.
     */
    @Transactional
    public QualityAssessmentResponse rejectAssessment(Integer adminUserId, Integer assessmentId, String notes) {
        User admin = validateAdminUser(adminUserId);

        QualityAssessment qa = qualityAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Quality assessment not found with ID: " + assessmentId));

        qa.setVerificationStatus(VerificationStatus.REJECTED);
        qa.setAdmin(admin);
        if (notes != null && !notes.trim().isEmpty()) {
            qa.setInspectorNotes(notes.trim());
        }

        QualityAssessment rejected = qualityAssessmentRepository.save(qa);
        log.info("Admin {} REJECTED quality assessment #{} for harvest lot #{}",
                adminUserId, assessmentId, qa.getHarvest().getHarvestId());

        return new QualityAssessmentResponse(rejected);
    }

    /**
     * Retrieves aggregated assessment counts for the admin overview dashboard.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getAssessmentMetrics() {
        Map<String, Long> metrics = new HashMap<>();
        long verified = qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.VERIFIED);
        long rejected = qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.REJECTED);
        long pending = qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.PENDING);
        long totalHarvests = harvestRepository.count();
        long totalAssessed = qualityAssessmentRepository.count();
        long unassessed = Math.max(0, totalHarvests - totalAssessed);

        metrics.put("pending", pending);
        metrics.put("unassessed", unassessed);
        metrics.put("pendingTotal", pending + unassessed);
        metrics.put("verified", verified);
        metrics.put("rejected", rejected);
        metrics.put("totalHarvests", totalHarvests);

        return metrics;
    }

    // ===================================================================
    // Farmer Read-Only Quality API (Sections 12, 13)
    // ===================================================================

    /**
     * Retrieves the quality assessment for a harvest belonging strictly to the authenticated farmer.
     * Enforces harvest ownership boundary: if harvest does not belong to farmer, throws 403 Forbidden.
     */
    @Transactional(readOnly = true)
    public Optional<QualityAssessmentResponse> getFarmerHarvestQuality(Integer farmerUserId, Integer harvestId) {
        Harvest harvest = harvestRepository.findById(harvestId)
                .orElseThrow(() -> new ResourceNotFoundException("Harvest not found with ID: " + harvestId));

        if (!harvest.getFarmer().getUserId().equals(farmerUserId)) {
            log.warn("Ownership violation: Farmer user {} attempted to view quality of harvest #{} owned by user {}",
                    farmerUserId, harvestId, harvest.getFarmer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to view quality information for harvest #" + harvestId);
        }

        return qualityAssessmentRepository.findByHarvest_HarvestId(harvestId)
                .map(QualityAssessmentResponse::new);
    }

    // ===================================================================
    // Internal Helper Validations
    // ===================================================================

    private User validateAdminUser(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found with ID: " + userId));

        if (user.getRole() != Role.ADMIN) {
            log.warn("Unauthorized attempt: User {} with role {} attempted admin quality action.", userId, user.getRole());
            throw new AccessDeniedException("Access denied: User " + userId + " does not hold the ADMIN role.");
        }

        return user;
    }
}
