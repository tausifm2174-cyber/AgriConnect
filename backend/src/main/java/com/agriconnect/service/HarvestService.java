package com.agriconnect.service;

import com.agriconnect.dto.CreateHarvestRequest;
import com.agriconnect.dto.HarvestResponse;
import com.agriconnect.dto.UpdateHarvestRequest;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.HarvestRepository;
import com.agriconnect.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Service managing harvest lots for authenticated farmers.
 * Enforces ownership boundaries, database constraints, and transactional integrity.
 */
@Service
public class HarvestService {

    private static final Logger log = LoggerFactory.getLogger(HarvestService.class);

    private final HarvestRepository harvestRepository;
    private final CropRepository cropRepository;
    private final UserRepository userRepository;

    public HarvestService(HarvestRepository harvestRepository,
                          CropRepository cropRepository,
                          UserRepository userRepository) {
        this.harvestRepository = harvestRepository;
        this.cropRepository = cropRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a new harvest lot for the currently authenticated farmer.
     * The farmer identity is strictly bound to the authenticated user ID from the JWT.
     */
    @Transactional
    public HarvestResponse createHarvest(Integer farmerUserId, CreateHarvestRequest request) {
        User farmer = userRepository.findById(farmerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Farmer user not found with ID: " + farmerUserId));

        if (farmer.getRole() != Role.FARMER) {
            throw new BadRequestException("User " + farmerUserId + " is not authorized as a FARMER.");
        }

        Crop crop = cropRepository.findById(request.getCropId())
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with ID: " + request.getCropId()));

        if (request.getQuantity() == null || request.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Initial harvest quantity must be greater than 0 kg.");
        }

        if (request.getPricePerKg() == null || request.getPricePerKg().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Price per kg must be greater than 0.");
        }

        if (request.getLocation() == null || request.getLocation().trim().isEmpty()) {
            throw new BadRequestException("Harvest location is required.");
        }

        Harvest harvest = new Harvest(
                farmer,
                crop,
                request.getQuantity(),
                request.getQuantity(), // available quantity initially equals initial quantity
                request.getPricePerKg(),
                request.getHarvestDate(),
                request.getLocation().trim(),
                HarvestStatus.AVAILABLE
        );

        Harvest savedHarvest = harvestRepository.save(harvest);
        log.info("Created harvest lot ID: {} for farmer ID: {} (Crop: {}, Qty: {} kg)",
                savedHarvest.getHarvestId(), farmerUserId, crop.getCropName(), savedHarvest.getInitialQuantity());

        return new HarvestResponse(savedHarvest);
    }

    /**
     * Retrieves all harvests listed by the authenticated farmer, newest first.
     */
    @Transactional(readOnly = true)
    public List<HarvestResponse> getFarmerHarvests(Integer farmerUserId) {
        return harvestRepository.findByFarmer_UserIdOrderByCreatedAtDesc(farmerUserId)
                .stream()
                .map(HarvestResponse::new)
                .toList();
    }

    /**
     * Retrieves a single harvest by ID, strictly enforcing that it belongs to the authenticated farmer.
     */
    @Transactional(readOnly = true)
    public HarvestResponse getFarmerHarvestById(Integer farmerUserId, Integer harvestId) {
        Harvest harvest = harvestRepository.findById(harvestId)
                .orElseThrow(() -> new ResourceNotFoundException("Harvest not found with ID: " + harvestId));

        validateOwnership(farmerUserId, harvest);

        return new HarvestResponse(harvest);
    }

    /**
     * Updates an existing harvest lot owned by the authenticated farmer.
     */
    @Transactional
    public HarvestResponse updateFarmerHarvest(Integer farmerUserId, Integer harvestId, UpdateHarvestRequest request) {
        Harvest harvest = harvestRepository.findById(harvestId)
                .orElseThrow(() -> new ResourceNotFoundException("Harvest not found with ID: " + harvestId));

        validateOwnership(farmerUserId, harvest);

        if (request.getPricePerKg() != null) {
            if (request.getPricePerKg().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Price per kg must be greater than 0.");
            }
            harvest.setPricePerKg(request.getPricePerKg());
        }

        if (request.getAvailableQuantity() != null) {
            if (request.getAvailableQuantity().compareTo(BigDecimal.ZERO) < 0) {
                throw new BadRequestException("Available quantity cannot be negative.");
            }
            if (request.getAvailableQuantity().compareTo(harvest.getInitialQuantity()) > 0) {
                throw new BadRequestException("Available quantity (" + request.getAvailableQuantity() +
                        " kg) cannot exceed initial quantity of " + harvest.getInitialQuantity() + " kg.");
            }
            harvest.setAvailableQuantity(request.getAvailableQuantity());

            // If available quantity drops to 0 and no explicit status is provided, auto-update to SOLD_OUT
            if (request.getAvailableQuantity().compareTo(BigDecimal.ZERO) == 0 && request.getStatus() == null) {
                harvest.setStatus(HarvestStatus.SOLD_OUT);
            }
        }

        if (request.getLocation() != null && !request.getLocation().trim().isEmpty()) {
            harvest.setLocation(request.getLocation().trim());
        }

        if (request.getHarvestDate() != null) {
            harvest.setHarvestDate(request.getHarvestDate());
        }

        if (request.getStatus() != null) {
            harvest.setStatus(request.getStatus());
        }

        Harvest updatedHarvest = harvestRepository.save(harvest);
        log.info("Updated harvest lot ID: {} by farmer ID: {}", harvestId, farmerUserId);

        return new HarvestResponse(updatedHarvest);
    }

    /**
     * Safely deletes a harvest lot owned by the authenticated farmer.
     * Prevents deletion if any orders are linked, maintaining relational integrity.
     */
    @Transactional
    public void deleteFarmerHarvest(Integer farmerUserId, Integer harvestId) {
        Harvest harvest = harvestRepository.findById(harvestId)
                .orElseThrow(() -> new ResourceNotFoundException("Harvest not found with ID: " + harvestId));

        validateOwnership(farmerUserId, harvest);

        long orderCount = harvestRepository.countOrdersByHarvestId(harvestId);
        if (orderCount > 0) {
            throw new BadRequestException("Cannot delete harvest #" + harvestId + " because " +
                    orderCount + " order(s) are associated with it. You can mark its status as CANCELLED instead.");
        }

        harvestRepository.delete(harvest);
        log.info("Successfully deleted harvest lot ID: {} by farmer ID: {}", harvestId, farmerUserId);
    }

    /**
     * Enforces ownership boundary: Farmers can only access and modify their own harvests.
     */
    private void validateOwnership(Integer farmerUserId, Harvest harvest) {
        if (!harvest.getFarmer().getUserId().equals(farmerUserId)) {
            log.warn("Security violation: User {} attempted to access harvest {} owned by user {}",
                    farmerUserId, harvest.getHarvestId(), harvest.getFarmer().getUserId());
            throw new AccessDeniedException("Access denied: You do not have permission to access harvest #" + harvest.getHarvestId());
        }
    }
}
