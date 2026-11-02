package com.agriconnect.service;

import com.agriconnect.dto.BuyerRequirementMatchResponse;
import com.agriconnect.dto.MatchedHarvestDto;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.BuyerRequirementRepository;
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
import java.util.*;

/**
 * Core Matching Engine Service for AgriConnect (Phase 7: Quality-Aware Matching).
 * Deterministically evaluates commercial buyer requirements against available farmer harvests
 * backed by verified quality assessments.
 *
 * Enforces:
 * 1. Strict buyer ownership & RBAC authorization
 * 2. Hard matching eligibility filters (Open, non-expired, crop, quantity, price, grade, verified)
 * 3. 100-Point Deterministic Match Scoring:
 *    - Price Score:    30 points max (10 pt baseline at maxPrice + up to 20 pts price discount savings)
 *    - Quality Score:  30 points max (scaled from verified quality_score / 100 * 30)
 *    - Location Score: 20 points max (20 pts for match, 15 pts if unconstrained, 10 pts otherwise)
 *    - Quantity Score: 20 points max (10 pts for 1.0x coverage, scaling to 20 pts at >= 2.0x coverage)
 * 4. Deterministic Ranking: Match Score DESC -> Quality Score DESC -> Price ASC -> Quantity DESC
 * 5. Read-only safety: matching never creates orders or mutates inventory.
 */
@Service
public class MatchingService {

    private static final Logger log = LoggerFactory.getLogger(MatchingService.class);

    private final BuyerRequirementRepository requirementRepository;
    private final QualityAssessmentRepository qualityAssessmentRepository;
    private final UserRepository userRepository;

    public MatchingService(BuyerRequirementRepository requirementRepository,
                           QualityAssessmentRepository qualityAssessmentRepository,
                           UserRepository userRepository) {
        this.requirementRepository = requirementRepository;
        this.qualityAssessmentRepository = qualityAssessmentRepository;
        this.userRepository = userRepository;
    }

    /**
     * Executes the quality-aware matching engine for an authenticated buyer's requirement.
     *
     * @param buyerUserId   Authenticated user ID from JWT context
     * @param requirementId ID of the requirement to match against
     * @param sort          Optional sort criteria (defaults to 'best')
     * @return Ranked matching results wrapped in BuyerRequirementMatchResponse
     */
    @Transactional
    public BuyerRequirementMatchResponse findMatchesForRequirement(Integer buyerUserId, Integer requirementId, String sort) {
        User buyer = userRepository.findById(buyerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer user not found with ID: " + buyerUserId));

        if (buyer.getRole() != Role.BUYER) {
            throw new AccessDeniedException("Access denied: Only users with ROLE_BUYER can access the matching engine.");
        }

        BuyerRequirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer requirement not found with ID: " + requirementId));

        // Enforce strict buyer ownership
        if (!requirement.getBuyer().getUserId().equals(buyerUserId)) {
            log.warn("Security violation: Buyer user {} attempted to access matches for requirement {} owned by user {}",
                    buyerUserId, requirementId, requirement.getBuyer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to view matches for requirement #" + requirementId);
        }

        // Validate expiration state
        LocalDate today = LocalDate.now();
        if (requirement.getStatus() == RequirementStatus.OPEN && requirement.getRequiredByDate() != null
                && requirement.getRequiredByDate().isBefore(today)) {
            requirement.setStatus(RequirementStatus.EXPIRED);
            requirementRepository.save(requirement);
            log.info("Requirement #{} auto-expired due to past requiredByDate: {}", requirementId, requirement.getRequiredByDate());
            throw new BadRequestException("Requirement #" + requirementId + " has EXPIRED (required-by date was "
                    + requirement.getRequiredByDate() + ") and cannot be matched.");
        }

        // Validate requirement status eligibility
        if (requirement.getStatus() != RequirementStatus.OPEN) {
            throw new BadRequestException("Requirement #" + requirementId + " has status " + requirement.getStatus()
                    + " and cannot be matched. Only OPEN requirements are eligible for matching.");
        }

        // Determine acceptable quality grades based on buyer's required minimum grade
        List<QualityGrade> acceptableGrades = QualityGrade.getAcceptableGrades(requirement.getMinQualityGrade());

        // Relational database query: filters crop, status, available quantity, price ceiling, verified quality, and grade
        List<QualityAssessment> eligibleAssessments = qualityAssessmentRepository.findEligibleMatches(
                requirement.getCrop().getCropId(),
                requirement.getRequiredQuantity(),
                requirement.getMaxPricePerKg(),
                HarvestStatus.AVAILABLE,
                VerificationStatus.VERIFIED,
                acceptableGrades
        );

        log.info("Matching Engine: Found {} database candidates for requirement #{} (Crop: {}, MinGrade: {})",
                eligibleAssessments.size(), requirementId, requirement.getCrop().getCropName(), requirement.getMinQualityGrade());

        List<MatchedHarvestDto> matches = new ArrayList<>();

        for (QualityAssessment qa : eligibleAssessments) {
            Harvest harvest = qa.getHarvest();

            // Programmatic defense-in-depth verification of hard filters
            if (!isHardFilterSatisfied(requirement, harvest, qa)) {
                continue;
            }

            // Calculate component scores
            double priceScore = calculatePriceScore(harvest.getPricePerKg(), requirement.getMaxPricePerKg());
            double qualityScoreComp = calculateQualityScore(qa.getQualityScore());
            double locationScore = calculateLocationScore(harvest.getLocation(), requirement.getPreferredLocation());
            boolean locationMatch = isLocationMatch(harvest.getLocation(), requirement.getPreferredLocation());
            double quantityScore = calculateQuantityScore(harvest.getAvailableQuantity(), requirement.getRequiredQuantity());

            double totalScore = calculateTotalScore(priceScore, qualityScoreComp, locationScore, quantityScore);

            MatchedHarvestDto dto = new MatchedHarvestDto();
            dto.setHarvestId(harvest.getHarvestId());
            dto.setCropId(harvest.getCrop().getCropId());
            dto.setCropName(harvest.getCrop().getCropName());
            if (harvest.getFarmer() != null) {
                dto.setFarmerId(harvest.getFarmer().getUserId());
                dto.setFarmerName(harvest.getFarmer().getFullName());
            }
            dto.setAvailableQuantity(harvest.getAvailableQuantity());
            dto.setPricePerKg(harvest.getPricePerKg());
            dto.setHarvestDate(harvest.getHarvestDate());
            dto.setLocation(harvest.getLocation());

            // Quality Details
            dto.setQualityGrade(qa.getQualityGrade());
            dto.setQualityScore(qa.getQualityScore());
            dto.setQualityVerificationStatus(qa.getVerificationStatus());
            dto.setFreshness(qa.getFreshness());
            dto.setAppearance(qa.getAppearance());
            dto.setSize(qa.getSize());
            dto.setColor(qa.getColor());
            dto.setRipeness(qa.getRipeness());
            dto.setDamagePercentage(qa.getDamagePercentage());

            // Scoring components
            dto.setPriceScore(roundTwoDecimals(priceScore));
            dto.setQualityScoreComponent(roundTwoDecimals(qualityScoreComp));
            dto.setLocationScore(roundTwoDecimals(locationScore));
            dto.setQuantityScore(roundTwoDecimals(quantityScore));
            dto.setMatchScore(roundTwoDecimals(totalScore));
            dto.setLocationMatch(locationMatch);

            matches.add(dto);
        }

        // Rank results deterministically:
        // 1. Match score DESC
        // 2. Quality score DESC
        // 3. Harvest price ASC
        // 4. Available quantity DESC
        matches.sort(Comparator
                .comparing(MatchedHarvestDto::getMatchScore, Comparator.reverseOrder())
                .thenComparing(MatchedHarvestDto::getQualityScore, Comparator.reverseOrder())
                .thenComparing(MatchedHarvestDto::getPricePerKg)
                .thenComparing(MatchedHarvestDto::getAvailableQuantity, Comparator.reverseOrder())
        );

        return new BuyerRequirementMatchResponse(requirement, matches);
    }

    /**
     * Defense-in-depth verification of hard constraints.
     */
    public boolean isHardFilterSatisfied(BuyerRequirement requirement, Harvest harvest, QualityAssessment qa) {
        if (requirement == null || harvest == null || qa == null) {
            return false;
        }

        // 1. Crop Match
        if (!harvest.getCrop().getCropId().equals(requirement.getCrop().getCropId())) {
            return false;
        }

        // 2. Harvest Status
        if (harvest.getStatus() != HarvestStatus.AVAILABLE) {
            return false;
        }

        // 3. Available Quantity >= Required Quantity (> 0)
        if (harvest.getAvailableQuantity() == null || harvest.getAvailableQuantity().compareTo(BigDecimal.ZERO) <= 0
                || harvest.getAvailableQuantity().compareTo(requirement.getRequiredQuantity()) < 0) {
            return false;
        }

        // 4. Harvest Price <= Buyer Maximum Price
        if (harvest.getPricePerKg() == null || harvest.getPricePerKg().compareTo(requirement.getMaxPricePerKg()) > 0) {
            return false;
        }

        // 5. Quality Verification Status = VERIFIED
        if (qa.getVerificationStatus() != VerificationStatus.VERIFIED) {
            return false;
        }

        // 6. Quality Grade meets or exceeds requirement minimum grade
        if (!qa.getQualityGrade().satisfiesMinimum(requirement.getMinQualityGrade())) {
            return false;
        }

        return true;
    }

    /**
     * Price Score (30 points max):
     * Lower harvest price relative to buyer max price yields a higher score.
     * When harvestPrice == maxPrice, baseline score = 10.0 points (budget constraint met).
     * Savings bonus = (1 - harvestPrice/maxPrice) * 20.0 points.
     * Clamped to [0.0, 30.0].
     */
    public double calculatePriceScore(BigDecimal harvestPrice, BigDecimal maxPrice) {
        if (harvestPrice == null || maxPrice == null || maxPrice.compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        if (harvestPrice.compareTo(maxPrice) > 0) {
            return 0.0;
        }

        double priceRatio = harvestPrice.doubleValue() / maxPrice.doubleValue();
        double priceSavingsRatio = Math.max(0.0, 1.0 - priceRatio);
        double score = 10.0 + (priceSavingsRatio * 20.0);

        return Math.max(0.0, Math.min(30.0, score));
    }

    /**
     * Quality Score (30 points max):
     * Scales directly from the verified quality_score (0 - 100 scale).
     * Quality 100 -> 30.0 pts; Quality 80 -> 24.0 pts; Quality 60 -> 18.0 pts.
     * Clamped to [0.0, 30.0].
     */
    public double calculateQualityScore(BigDecimal assessmentQualityScore) {
        if (assessmentQualityScore == null || assessmentQualityScore.compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        double rawScore = (assessmentQualityScore.doubleValue() / 100.0) * 30.0;
        return Math.max(0.0, Math.min(30.0, rawScore));
    }

    /**
     * Location Score (20 points max):
     * Exact or substring/token match -> 20.0 points
     * No preferred location specified -> 15.0 points (neutral)
     * Different location -> 10.0 points
     */
    public double calculateLocationScore(String harvestLocation, String preferredLocation) {
        if (preferredLocation == null || preferredLocation.trim().isEmpty()) {
            return 15.0;
        }
        return isLocationMatch(harvestLocation, preferredLocation) ? 20.0 : 10.0;
    }

    /**
     * Case-insensitive, whitespace-normalized location comparison.
     */
    public boolean isLocationMatch(String harvestLocation, String preferredLocation) {
        if (preferredLocation == null || preferredLocation.trim().isEmpty()) {
            return true;
        }
        if (harvestLocation == null || harvestLocation.trim().isEmpty()) {
            return false;
        }

        String hLoc = harvestLocation.trim().toLowerCase();
        String pLoc = preferredLocation.trim().toLowerCase();

        // Exact match
        if (hLoc.equals(pLoc)) {
            return true;
        }

        // Substring containment
        if (hLoc.contains(pLoc) || pLoc.contains(hLoc)) {
            return true;
        }

        // Token match (split by comma, slash, dash)
        String[] pTokens = pLoc.split("[,/\\-]+");
        for (String pt : pTokens) {
            String token = pt.trim();
            if (token.length() >= 3 && hLoc.contains(token)) {
                return true;
            }
        }

        String[] hTokens = hLoc.split("[,/\\-]+");
        for (String ht : hTokens) {
            String token = ht.trim();
            if (token.length() >= 3 && pLoc.contains(token)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Quantity Score (20 points max):
     * Coverage ratio = availableQuantity / requiredQuantity.
     * When available == required (1.0x): 10.0 points
     * When available == 1.5x required: 15.0 points
     * When available >= 2.0x required: 20.0 points
     * Formula: min(ratio, 2.0) / 2.0 * 20.0
     * Clamped to [0.0, 20.0].
     */
    public double calculateQuantityScore(BigDecimal availableQty, BigDecimal requiredQty) {
        if (availableQty == null || requiredQty == null || requiredQty.compareTo(BigDecimal.ZERO) <= 0) {
            return 0.0;
        }
        if (availableQty.compareTo(requiredQty) < 0) {
            return 0.0;
        }

        double ratio = availableQty.doubleValue() / requiredQty.doubleValue();
        double score = (Math.min(ratio, 2.0) / 2.0) * 20.0;

        return Math.max(0.0, Math.min(20.0, score));
    }

    /**
     * Total Score (0.00 - 100.00 scale):
     * Sum of price, quality, location, and quantity scores.
     * Clamped to [0.0, 100.0].
     */
    public double calculateTotalScore(double priceScore, double qualityScore, double locationScore, double quantityScore) {
        double total = priceScore + qualityScore + locationScore + quantityScore;
        return Math.max(0.0, Math.min(100.0, total));
    }

    private double roundTwoDecimals(double val) {
        return BigDecimal.valueOf(val).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }
}
