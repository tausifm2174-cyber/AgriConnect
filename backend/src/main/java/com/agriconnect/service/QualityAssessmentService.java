package com.agriconnect.service;

import com.agriconnect.dto.*;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.DuplicateResourceException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service managing Quality Assessment, Verification, Buyer Feedback, and Reassessment workflows (Phases 5 & 16C).
 * Enforces server-side score calculation, grading rules, admin authorization,
 * farmer harvest ownership boundaries, and immutable audit history.
 */
@Service
public class QualityAssessmentService {

    private static final Logger log = LoggerFactory.getLogger(QualityAssessmentService.class);

    private final QualityAssessmentRepository qualityAssessmentRepository;
    private final HarvestRepository harvestRepository;
    private final UserRepository userRepository;
    private final BuyerQualityFeedbackRepository buyerQualityFeedbackRepository;
    private final QualityReassessmentRepository qualityReassessmentRepository;
    private final OrderRepository orderRepository;

    public QualityAssessmentService(QualityAssessmentRepository qualityAssessmentRepository,
                                    HarvestRepository harvestRepository,
                                    UserRepository userRepository,
                                    BuyerQualityFeedbackRepository buyerQualityFeedbackRepository,
                                    QualityReassessmentRepository qualityReassessmentRepository,
                                    OrderRepository orderRepository) {
        this.qualityAssessmentRepository = qualityAssessmentRepository;
        this.harvestRepository = harvestRepository;
        this.userRepository = userRepository;
        this.buyerQualityFeedbackRepository = buyerQualityFeedbackRepository;
        this.qualityReassessmentRepository = qualityReassessmentRepository;
        this.orderRepository = orderRepository;
    }

    // ===================================================================
    // Centralized Calculation & Grading Rules
    // ===================================================================

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

    @Transactional(readOnly = true)
    public QualityAssessmentResponse getAssessmentById(Integer assessmentId) {
        QualityAssessment qa = qualityAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Quality assessment not found with ID: " + assessmentId));
        return new QualityAssessmentResponse(qa);
    }

    @Transactional
    public QualityAssessmentResponse updateAssessment(Integer adminUserId, Integer assessmentId, UpdateQualityAssessmentRequest request) {
        User admin = validateAdminUser(adminUserId);

        QualityAssessment qa = qualityAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Quality assessment not found with ID: " + assessmentId));

        if (qa.getVerificationStatus() == VerificationStatus.VERIFIED) {
            log.warn("Admin {} attempted direct update on already VERIFIED assessment #{}. Use Reassessment instead.", adminUserId, assessmentId);
            throw new BadRequestException("Assessment #" + assessmentId + " is already VERIFIED. Please request a formal Reassessment to adjust parameters.");
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

        qa.setFreshness(request.getFreshness());
        qa.setAppearance(request.getAppearance());
        qa.setSize(request.getSize());
        qa.setColor(request.getColor());
        qa.setRipeness(request.getRipeness());
        qa.setDamagePercentage(request.getDamagePercentage());
        qa.setQualityScore(score);
        qa.setQualityGrade(grade);
        qa.setInspectorNotes(request.getInspectorNotes());
        qa.setVerificationStatus(VerificationStatus.PENDING);
        qa.setAdmin(admin);

        QualityAssessment updated = qualityAssessmentRepository.save(qa);
        log.info("Admin user {} updated quality assessment #{}: New Score={}, Grade={}",
                adminUserId, assessmentId, score, grade);

        return new QualityAssessmentResponse(updated);
    }

    @Transactional
    public QualityAssessmentResponse verifyAssessment(Integer adminUserId, Integer assessmentId) {
        User admin = validateAdminUser(adminUserId);

        QualityAssessment qa = qualityAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Quality assessment not found with ID: " + assessmentId));

        if (qa.getVerificationStatus() == VerificationStatus.VERIFIED) {
            log.info("Quality assessment #{} is already VERIFIED. Idempotent return.", assessmentId);
            return new QualityAssessmentResponse(qa);
        }

        qa.setVerificationStatus(VerificationStatus.VERIFIED);
        qa.setAdmin(admin);
        QualityAssessment verified = qualityAssessmentRepository.save(qa);

        log.info("Admin user {} verified quality assessment #{} for harvest #{}",
                adminUserId, assessmentId, qa.getHarvest().getHarvestId());

        return new QualityAssessmentResponse(verified);
    }

    @Transactional
    public QualityAssessmentResponse rejectAssessment(Integer adminUserId, Integer assessmentId, String notes) {
        User admin = validateAdminUser(adminUserId);

        QualityAssessment qa = qualityAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Quality assessment not found with ID: " + assessmentId));

        if (qa.getVerificationStatus() == VerificationStatus.REJECTED) {
            log.info("Quality assessment #{} is already REJECTED. Idempotent return.", assessmentId);
            return new QualityAssessmentResponse(qa);
        }

        qa.setVerificationStatus(VerificationStatus.REJECTED);
        qa.setAdmin(admin);
        if (notes != null && !notes.isBlank()) {
            qa.setInspectorNotes(notes);
        }
        QualityAssessment rejected = qualityAssessmentRepository.save(qa);

        log.info("Admin user {} marked quality assessment #{} as REJECTED for harvest #{}",
                adminUserId, assessmentId, qa.getHarvest().getHarvestId());

        return new QualityAssessmentResponse(rejected);
    }

    // ===================================================================
    // Phase 16C: Quality Reassessment & Audit History
    // ===================================================================

    @Transactional
    public QualityAssessmentResponse requestReassessment(Integer adminUserId, Integer assessmentId, RequestReassessmentRequest request) {
        User admin = validateAdminUser(adminUserId);

        QualityAssessment qa = qualityAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Quality assessment not found with ID: " + assessmentId));

        if (qa.getVerificationStatus() == VerificationStatus.REJECTED) {
            throw new BadRequestException("Cannot request reassessment on an already rejected assessment.");
        }

        qa.setVerificationStatus(VerificationStatus.REASSESSMENT_REQUIRED);
        String reasonText = request.getReason().trim();
        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            qa.setInspectorNotes("Reassessment Requested: " + reasonText + " - " + request.getNotes().trim());
        } else {
            qa.setInspectorNotes("Reassessment Requested: " + reasonText);
        }

        if (request.getBuyerFeedbackId() != null) {
            buyerQualityFeedbackRepository.findById(request.getBuyerFeedbackId()).ifPresent(fb -> {
                fb.setReviewStatus(FeedbackReviewStatus.UNDER_REASSESSMENT);
                buyerQualityFeedbackRepository.save(fb);
            });
        }

        QualityAssessment saved = qualityAssessmentRepository.save(qa);
        log.info("Admin user {} placed quality assessment #{} in REASSESSMENT_REQUIRED. Reason: {}",
                adminUserId, assessmentId, reasonText);

        return new QualityAssessmentResponse(saved);
    }

    @Transactional
    public QualityReassessmentResponse performReassessment(Integer adminUserId, Integer assessmentId, PerformReassessmentRequest request) {
        User admin = validateAdminUser(adminUserId);

        QualityAssessment qa = qualityAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Quality assessment not found with ID: " + assessmentId));

        validateDamagePercentage(request.getDamagePercentage());

        if (request.getReason() == null || request.getReason().isBlank()) {
            throw new BadRequestException("Reassessment reason is required.");
        }
        if (request.getInspectionRemarks() == null || request.getInspectionRemarks().isBlank()) {
            throw new BadRequestException("Inspection remarks are required.");
        }

        BigDecimal recalculatedScore = calculateQualityScore(
                request.getFreshness(),
                request.getAppearance(),
                request.getSize(),
                request.getColor(),
                request.getRipeness()
        );
        QualityGrade recalculatedGrade = determineQualityGrade(recalculatedScore);

        BigDecimal previousScore = qa.getQualityScore();
        QualityGrade previousGrade = qa.getQualityGrade();

        BuyerQualityFeedback feedback = null;
        if (request.getBuyerFeedbackId() != null) {
            feedback = buyerQualityFeedbackRepository.findById(request.getBuyerFeedbackId()).orElse(null);
        }

        QualityReassessment reassessment = new QualityReassessment(
                qa,
                qa.getHarvest(),
                admin,
                request.getReason().trim(),
                feedback,
                request.getFreshness(),
                request.getAppearance(),
                request.getSize(),
                request.getColor(),
                request.getRipeness(),
                request.getDamagePercentage(),
                recalculatedScore,
                recalculatedGrade,
                request.getInspectionRemarks().trim(),
                previousScore,
                previousGrade,
                request.getDecision(),
                admin
        );

        QualityReassessment savedReassessment = qualityReassessmentRepository.save(reassessment);

        // Update live QualityAssessment entity
        if (request.getDecision() == ReassessmentDecision.RE_VERIFIED) {
            qa.setFreshness(request.getFreshness());
            qa.setAppearance(request.getAppearance());
            qa.setSize(request.getSize());
            qa.setColor(request.getColor());
            qa.setRipeness(request.getRipeness());
            qa.setDamagePercentage(request.getDamagePercentage());
            qa.setQualityScore(recalculatedScore);
            qa.setQualityGrade(recalculatedGrade);
            qa.setVerificationStatus(VerificationStatus.VERIFIED);
            qa.setInspectorNotes("Re-Verified: " + request.getInspectionRemarks().trim());
            if (feedback != null) {
                feedback.setReviewStatus(FeedbackReviewStatus.RESOLVED);
                buyerQualityFeedbackRepository.save(feedback);
            }
        } else {
            qa.setVerificationStatus(VerificationStatus.REJECTED);
            qa.setInspectorNotes("Rejected after Reassessment: " + request.getInspectionRemarks().trim());
            if (feedback != null) {
                feedback.setReviewStatus(FeedbackReviewStatus.RESOLVED);
                buyerQualityFeedbackRepository.save(feedback);
            }
        }

        qa.setAdmin(admin);
        qualityAssessmentRepository.save(qa);

        log.info("Admin user {} completed reassessment #{} on QA #{}. Decision={}, Score={}, Grade={}",
                adminUserId, savedReassessment.getReassessmentId(), assessmentId,
                request.getDecision(), recalculatedScore, recalculatedGrade);

        return new QualityReassessmentResponse(savedReassessment);
    }

    @Transactional(readOnly = true)
    public List<QualityAuditTimelineItem> getAuditHistory(Integer assessmentId) {
        QualityAssessment qa = qualityAssessmentRepository.findById(assessmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Quality assessment not found with ID: " + assessmentId));

        List<QualityAuditTimelineItem> timeline = new ArrayList<>();

        // 1. Initial Assessment
        LocalDateTime initTime = qa.getCreatedAt() != null ? qa.getCreatedAt() : qa.getAssessmentDate().atStartOfDay();
        timeline.add(new QualityAuditTimelineItem(
                "INITIAL_ASSESSMENT",
                initTime,
                qa.getAdmin() != null ? qa.getAdmin().getFullName() : "APMC Quality Inspector",
                "Initial Assessment Stamped",
                qa.getVerificationStatus().name(),
                qa.getQualityScore(),
                qa.getQualityGrade().name(),
                qa.getInspectorNotes(),
                Map.of(
                        "freshness", qa.getFreshness(),
                        "appearance", qa.getAppearance(),
                        "size", qa.getSize(),
                        "color", qa.getColor(),
                        "ripeness", qa.getRipeness(),
                        "damagePercentage", qa.getDamagePercentage()
                )
        ));

        // 2. Buyer Feedbacks on harvest's orders
        if (qa.getHarvest() != null) {
            List<BuyerQualityFeedback> feedbacks = buyerQualityFeedbackRepository
                    .findByHarvest_HarvestIdOrderBySubmittedAtDesc(qa.getHarvest().getHarvestId());
            for (BuyerQualityFeedback fb : feedbacks) {
                timeline.add(new QualityAuditTimelineItem(
                        "BUYER_FEEDBACK",
                        fb.getSubmittedAt(),
                        fb.getBuyer() != null ? fb.getBuyer().getFullName() : "Buyer",
                        "Buyer Quality Feedback (" + fb.getIssueType().name() + ")",
                        fb.getReviewStatus().name(),
                        null,
                        null,
                        fb.getComments(),
                        Map.of(
                                "feedbackId", fb.getFeedbackId(),
                                "orderId", fb.getOrder() != null ? fb.getOrder().getOrderId() : 0,
                                "rating", fb.getRating(),
                                "issueType", fb.getIssueType().name()
                        )
                ));
            }
        }

        // 3. Reassessments
        List<QualityReassessment> reassessments = qualityReassessmentRepository
                .findByQualityAssessment_AssessmentIdOrderByInspectedAtDesc(assessmentId);
        for (QualityReassessment qr : reassessments) {
            timeline.add(new QualityAuditTimelineItem(
                    qr.getDecision() == ReassessmentDecision.RE_VERIFIED ? "RE_VERIFIED" : "REJECTED",
                    qr.getInspectedAt(),
                    qr.getInspectedBy() != null ? qr.getInspectedBy().getFullName() : "Admin Inspector",
                    qr.getDecision() == ReassessmentDecision.RE_VERIFIED ? "Quality Re-Verified by Admin" : "Quality Rejected on Reassessment",
                    qr.getDecision().name(),
                    qr.getRecalculatedScore(),
                    qr.getRecalculatedGrade().name(),
                    qr.getInspectionRemarks(),
                    Map.of(
                            "reassessmentId", qr.getReassessmentId(),
                            "reason", qr.getReason(),
                            "previousScore", qr.getPreviousScore(),
                            "previousGrade", qr.getPreviousGrade().name(),
                            "freshness", qr.getFreshness(),
                            "appearance", qr.getAppearance(),
                            "size", qr.getSize(),
                            "color", qr.getColor(),
                            "ripeness", qr.getRipeness(),
                            "damagePercentage", qr.getDamagePercentage()
                    )
            ));
        }

        timeline.sort((a, b) -> {
            if (a.getTimestamp() == null || b.getTimestamp() == null) return 0;
            return b.getTimestamp().compareTo(a.getTimestamp());
        });

        return timeline;
    }

    @Transactional(readOnly = true)
    public List<QualityReassessmentResponse> getAllReassessments() {
        return qualityReassessmentRepository.findAllByOrderByInspectedAtDesc()
                .stream()
                .map(QualityReassessmentResponse::new)
                .toList();
    }

    // ===================================================================
    // Phase 16C: Buyer Quality Feedback Operations
    // ===================================================================

    @Transactional
    public BuyerQualityFeedbackResponse submitBuyerFeedback(Integer buyerUserId, Integer orderId, SubmitBuyerFeedbackRequest request) {
        User buyer = userRepository.findById(buyerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer user not found with ID: " + buyerUserId));

        if (buyer.getRole() != Role.BUYER) {
            throw new AccessDeniedException("Access denied: Only buyers can submit quality feedback.");
        }

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (!order.getBuyer().getUserId().equals(buyerUserId)) {
            log.warn("Security violation: Buyer {} attempted to submit feedback for order {} belonging to buyer {}",
                    buyerUserId, orderId, order.getBuyer().getUserId());
            throw new AccessDeniedException("Access denied: You can only submit feedback for your own orders.");
        }

        if (order.getOrderStatus() != OrderStatus.DELIVERED) {
            throw new BadRequestException("Quality feedback can only be submitted for delivered orders. Current order status: "
                    + order.getOrderStatus());
        }

        if (buyerQualityFeedbackRepository.existsByOrder_OrderId(orderId)) {
            throw new DuplicateResourceException("Quality feedback has already been submitted for Order #" + orderId);
        }

        Harvest harvest = order.getHarvest();
        QualityAssessment qa = qualityAssessmentRepository.findByHarvest_HarvestId(harvest.getHarvestId()).orElse(null);

        BuyerQualityFeedback feedback = new BuyerQualityFeedback(
                order,
                buyer,
                harvest,
                qa,
                request.getRating(),
                request.getIssueType(),
                request.getComments().trim()
        );

        BuyerQualityFeedback saved = buyerQualityFeedbackRepository.save(feedback);
        log.info("Buyer {} submitted quality feedback on Order #{} for harvest #{}. Issue: {}",
                buyerUserId, orderId, harvest.getHarvestId(), request.getIssueType());

        return new BuyerQualityFeedbackResponse(saved);
    }

    @Transactional(readOnly = true)
    public Optional<BuyerQualityFeedbackResponse> getFeedbackByOrderId(Integer orderId, Integer userId, boolean isAdmin) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with ID: " + orderId));

        if (!isAdmin) {
            boolean isBuyer = order.getBuyer().getUserId().equals(userId);
            boolean isFarmer = order.getHarvest().getFarmer().getUserId().equals(userId);
            if (!isBuyer && !isFarmer) {
                throw new AccessDeniedException("Access denied: You do not have permission to view feedback for order #" + orderId);
            }
        }

        return buyerQualityFeedbackRepository.findByOrder_OrderId(orderId)
                .map(BuyerQualityFeedbackResponse::new);
    }

    @Transactional(readOnly = true)
    public List<BuyerQualityFeedbackResponse> getAllBuyerFeedback(String statusFilter) {
        List<BuyerQualityFeedback> list;
        if (statusFilter != null && !statusFilter.isBlank() && !statusFilter.equalsIgnoreCase("ALL")) {
            FeedbackReviewStatus reviewStatus = FeedbackReviewStatus.valueOf(statusFilter.toUpperCase());
            list = buyerQualityFeedbackRepository.findByReviewStatusOrderBySubmittedAtDesc(reviewStatus);
        } else {
            list = buyerQualityFeedbackRepository.findAllByOrderBySubmittedAtDesc();
        }
        return list.stream().map(BuyerQualityFeedbackResponse::new).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getAssessmentMetrics() {
        Map<String, Long> metrics = new HashMap<>();
        long verified = qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.VERIFIED);
        long rejected = qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.REJECTED);
        long pending = qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.PENDING);
        long reassessmentRequired = qualityAssessmentRepository.countByVerificationStatus(VerificationStatus.REASSESSMENT_REQUIRED);
        long pendingFeedback = buyerQualityFeedbackRepository.findByReviewStatusOrderBySubmittedAtDesc(FeedbackReviewStatus.PENDING_REVIEW).size();
        long totalHarvests = harvestRepository.count();
        long totalAssessed = qualityAssessmentRepository.count();
        long unassessed = Math.max(0, totalHarvests - totalAssessed);

        metrics.put("pending", pending);
        metrics.put("unassessed", unassessed);
        metrics.put("pendingTotal", pending + unassessed);
        metrics.put("verified", verified);
        metrics.put("rejected", rejected);
        metrics.put("reassessmentRequired", reassessmentRequired);
        metrics.put("pendingFeedback", pendingFeedback);
        metrics.put("totalHarvests", totalHarvests);

        return metrics;
    }

    @Transactional(readOnly = true)
    public List<QualityAssessmentResponse> getAllAssessments() {
        return qualityAssessmentRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(QualityAssessmentResponse::new)
                .toList();
    }

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
