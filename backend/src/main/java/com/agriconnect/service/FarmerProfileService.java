package com.agriconnect.service;

import com.agriconnect.dto.FarmerProfileDetailResponse;
import com.agriconnect.dto.FarmerProfileDto;
import com.agriconnect.entity.FarmerProfile;
import com.agriconnect.entity.HarvestStatus;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.HarvestRepository;
import com.agriconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service managing Farmer Profile details and agricultural operational statistics.
 */
@Service
public class FarmerProfileService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final HarvestRepository harvestRepository;

    public FarmerProfileService(UserRepository userRepository,
                                FarmerProfileRepository farmerProfileRepository,
                                HarvestRepository harvestRepository) {
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.harvestRepository = harvestRepository;
    }

    @Transactional(readOnly = true)
    public FarmerProfileDetailResponse getFarmerProfile(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (user.getRole() != Role.FARMER) {
            throw new BadRequestException("User ID " + userId + " does not have a FARMER role.");
        }

        FarmerProfile profile = farmerProfileRepository.findById(userId).orElse(null);

        long totalHarvests = harvestRepository.countByFarmer_UserId(userId);
        long activeHarvests = harvestRepository.countByFarmer_UserIdAndStatus(userId, HarvestStatus.AVAILABLE)
                + harvestRepository.countByFarmer_UserIdAndStatus(userId, HarvestStatus.PARTIALLY_SOLD);

        return new FarmerProfileDetailResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                profile != null ? profile.getFarmLocation() : "Not specified",
                profile != null ? profile.getFarmSizeAcres() : null,
                profile != null ? profile.getExperienceYears() : 0,
                totalHarvests,
                activeHarvests,
                user.getCreatedAt()
        );
    }

    @Transactional
    public FarmerProfileDetailResponse updateFarmerProfile(Integer userId, FarmerProfileDto updateDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        if (user.getRole() != Role.FARMER) {
            throw new BadRequestException("User ID " + userId + " does not have a FARMER role.");
        }

        FarmerProfile profile = farmerProfileRepository.findById(userId)
                .orElseGet(() -> {
                    FarmerProfile newProfile = new FarmerProfile();
                    newProfile.setUser(user);
                    newProfile.setFarmerId(user.getUserId());
                    return newProfile;
                });

        if (updateDto.getFarmLocation() != null && !updateDto.getFarmLocation().isBlank()) {
            profile.setFarmLocation(updateDto.getFarmLocation().trim());
        }
        if (updateDto.getFarmSizeAcres() != null) {
            if (updateDto.getFarmSizeAcres().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Farm size must be greater than 0 acres.");
            }
            profile.setFarmSizeAcres(updateDto.getFarmSizeAcres());
        }
        if (updateDto.getExperienceYears() != null) {
            if (updateDto.getExperienceYears() < 0) {
                throw new BadRequestException("Experience years cannot be negative.");
            }
            profile.setExperienceYears(updateDto.getExperienceYears());
        }

        farmerProfileRepository.save(profile);

        return getFarmerProfile(userId);
    }
}
