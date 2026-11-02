package com.agriconnect.service;

import com.agriconnect.dto.BuyerRequirementMetricsResponse;
import com.agriconnect.dto.BuyerRequirementResponse;
import com.agriconnect.dto.CreateBuyerRequirementRequest;
import com.agriconnect.dto.UpdateBuyerRequirementRequest;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.BuyerRequirementRepository;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Service managing buyer requirements and demand specifications.
 * Enforces buyer role validation, ownership boundaries, and lifecycle states.
 */
@Service
public class BuyerRequirementService {

    private static final Logger log = LoggerFactory.getLogger(BuyerRequirementService.class);

    private final BuyerRequirementRepository requirementRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;

    public BuyerRequirementService(BuyerRequirementRepository requirementRepository,
                                   CropRepository cropRepository,
                                   UserRepository userRepository) {
        this.requirementRepository = requirementRepository;
        this.cropRepository = cropRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a new crop requirement for the authenticated buyer.
     * Buyer identity is strictly derived from the JWT context.
     */
    @Transactional
    public BuyerRequirementResponse createRequirement(Integer buyerUserId, CreateBuyerRequirementRequest request) {
        User buyer = userRepository.findById(buyerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyer user not found with ID: " + buyerUserId));

        if (buyer.getRole() != Role.BUYER) {
            throw new BadRequestException("User " + buyerUserId + " is not authorized as a BUYER.");
        }

        Crop crop = cropRepository.findById(request.getCropId())
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with ID: " + request.getCropId()));

        if (request.getRequiredQuantity() == null || request.getRequiredQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Required quantity must be greater than 0 kg.");
        }

        if (request.getMaxPricePerKg() == null || request.getMaxPricePerKg().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Maximum price per kg must be greater than 0.");
        }

        if (request.getPreferredLocation() == null || request.getPreferredLocation().trim().isEmpty()) {
            throw new BadRequestException("Preferred location is required.");
        }

        if (request.getRequiredByDate() != null && request.getRequiredByDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Required-by date cannot be in the past (" + request.getRequiredByDate() + ").");
        }

        BuyerRequirement requirement = new BuyerRequirement(
                buyer,
                crop,
                request.getRequiredQuantity(),
                request.getMaxPricePerKg(),
                request.getMinQualityGrade(),
                request.getPreferredLocation().trim(),
                request.getRequiredByDate(),
                RequirementStatus.OPEN
        );

        BuyerRequirement saved = requirementRepository.save(requirement);
        log.info("Created buyer requirement ID: {} for buyer ID: {} (Crop: {}, Qty: {} kg, MaxPrice: ₹{}/kg, Grade: {})",
                saved.getRequirementId(), buyerUserId, crop.getCropName(), saved.getRequiredQuantity(),
                saved.getMaxPricePerKg(), saved.getMinQualityGrade());

        return new BuyerRequirementResponse(saved);
    }

    /**
     * Retrieves all requirements posted by the authenticated buyer, newest first.
     * Evaluates expiration date for OPEN requirements.
     */
    @Transactional
    public List<BuyerRequirementResponse> getBuyerRequirements(Integer buyerUserId) {
        List<BuyerRequirement> requirements = requirementRepository.findByBuyer_UserIdOrderByCreatedAtDesc(buyerUserId);
        LocalDate today = LocalDate.now();

        // Check and persist expired status for overdue open requirements
        for (BuyerRequirement req : requirements) {
            if (req.getStatus() == RequirementStatus.OPEN && req.getRequiredByDate() != null && req.getRequiredByDate().isBefore(today)) {
                req.setStatus(RequirementStatus.EXPIRED);
                requirementRepository.save(req);
            }
        }

        return requirements.stream()
                .map(BuyerRequirementResponse::new)
                .toList();
    }

    /**
     * Retrieves a single buyer requirement by ID, strictly enforcing that it belongs to the authenticated buyer.
     */
    @Transactional
    public BuyerRequirementResponse getBuyerRequirementById(Integer buyerUserId, Integer requirementId) {
        BuyerRequirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement not found with ID: " + requirementId));

        validateOwnership(buyerUserId, requirement);

        if (requirement.getStatus() == RequirementStatus.OPEN && requirement.getRequiredByDate() != null
                && requirement.getRequiredByDate().isBefore(LocalDate.now())) {
            requirement.setStatus(RequirementStatus.EXPIRED);
            requirement = requirementRepository.save(requirement);
        }

        return new BuyerRequirementResponse(requirement);
    }

    /**
     * Updates an existing requirement owned by the authenticated buyer.
     */
    @Transactional
    public BuyerRequirementResponse updateBuyerRequirement(Integer buyerUserId, Integer requirementId,
                                                           UpdateBuyerRequirementRequest request) {
        BuyerRequirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement not found with ID: " + requirementId));

        validateOwnership(buyerUserId, requirement);

        if (requirement.getStatus() == RequirementStatus.CANCELLED) {
            throw new BadRequestException("Cannot update requirement #" + requirementId + " because it has already been CANCELLED.");
        }

        if (requirement.getStatus() == RequirementStatus.FULFILLED) {
            throw new BadRequestException("Cannot update requirement #" + requirementId + " because it has already been FULFILLED.");
        }

        Crop crop = cropRepository.findById(request.getCropId())
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with ID: " + request.getCropId()));

        if (request.getRequiredQuantity() == null || request.getRequiredQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Required quantity must be greater than 0 kg.");
        }

        if (request.getMaxPricePerKg() == null || request.getMaxPricePerKg().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Maximum price per kg must be greater than 0.");
        }

        if (request.getPreferredLocation() == null || request.getPreferredLocation().trim().isEmpty()) {
            throw new BadRequestException("Preferred location is required.");
        }

        if (request.getRequiredByDate() != null && request.getRequiredByDate().isBefore(LocalDate.now())) {
            throw new BadRequestException("Required-by date cannot be in the past (" + request.getRequiredByDate() + ").");
        }

        requirement.setCrop(crop);
        requirement.setRequiredQuantity(request.getRequiredQuantity());
        requirement.setMaxPricePerKg(request.getMaxPricePerKg());
        requirement.setMinQualityGrade(request.getMinQualityGrade());
        requirement.setPreferredLocation(request.getPreferredLocation().trim());
        requirement.setRequiredByDate(request.getRequiredByDate());

        // If previously EXPIRED and updated with a future date, revive to OPEN
        if (requirement.getStatus() == RequirementStatus.EXPIRED && request.getRequiredByDate() != null
                && !request.getRequiredByDate().isBefore(LocalDate.now())) {
            requirement.setStatus(RequirementStatus.OPEN);
        }

        BuyerRequirement updated = requirementRepository.save(requirement);
        log.info("Updated requirement ID: {} by buyer ID: {}", requirementId, buyerUserId);

        return new BuyerRequirementResponse(updated);
    }

    /**
     * Cancels an open requirement owned by the authenticated buyer.
     */
    @Transactional
    public BuyerRequirementResponse cancelBuyerRequirement(Integer buyerUserId, Integer requirementId) {
        BuyerRequirement requirement = requirementRepository.findById(requirementId)
                .orElseThrow(() -> new ResourceNotFoundException("Requirement not found with ID: " + requirementId));

        validateOwnership(buyerUserId, requirement);

        if (requirement.getStatus() == RequirementStatus.CANCELLED) {
            throw new BadRequestException("Requirement #" + requirementId + " is already CANCELLED.");
        }

        if (requirement.getStatus() == RequirementStatus.FULFILLED) {
            throw new BadRequestException("Cannot cancel requirement #" + requirementId + " because it is already FULFILLED.");
        }

        requirement.setStatus(RequirementStatus.CANCELLED);
        BuyerRequirement saved = requirementRepository.save(requirement);
        log.info("Cancelled requirement ID: {} by buyer ID: {}", requirementId, buyerUserId);

        return new BuyerRequirementResponse(saved);
    }

    /**
     * Retrieves summary counts for the buyer dashboard overview cards.
     */
    @Transactional
    public BuyerRequirementMetricsResponse getBuyerRequirementMetrics(Integer buyerUserId) {
        // Run getBuyerRequirements to evaluate overdue expirations
        getBuyerRequirements(buyerUserId);

        long total = requirementRepository.countByBuyer_UserId(buyerUserId);
        long open = requirementRepository.countByBuyer_UserIdAndStatus(buyerUserId, RequirementStatus.OPEN);
        long fulfilled = requirementRepository.countByBuyer_UserIdAndStatus(buyerUserId, RequirementStatus.FULFILLED);
        long expired = requirementRepository.countByBuyer_UserIdAndStatus(buyerUserId, RequirementStatus.EXPIRED);
        long cancelled = requirementRepository.countByBuyer_UserIdAndStatus(buyerUserId, RequirementStatus.CANCELLED);

        return new BuyerRequirementMetricsResponse(total, open, fulfilled, expired, cancelled);
    }

    /**
     * Enforces ownership boundary: Buyers can only access and modify their own requirements.
     */
    private void validateOwnership(Integer buyerUserId, BuyerRequirement requirement) {
        if (!requirement.getBuyer().getUserId().equals(buyerUserId)) {
            log.warn("Security violation: User {} attempted to access requirement {} owned by user {}",
                    buyerUserId, requirement.getRequirementId(), requirement.getBuyer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to access requirement #" + requirement.getRequirementId());
        }
    }
}
