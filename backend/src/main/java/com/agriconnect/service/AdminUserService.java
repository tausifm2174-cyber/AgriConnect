package com.agriconnect.service;

import com.agriconnect.dto.AdminUserResponse;
import com.agriconnect.dto.BuyerProfileDto;
import com.agriconnect.dto.FarmerProfileDto;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.entity.UserStatus;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.BuyerProfileRepository;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for administrative user oversight, inspection, and filtering.
 * Enforces data privacy: NEVER exposes passwords or password hashes.
 */
@Service
public class AdminUserService {

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final BuyerProfileRepository buyerProfileRepository;

    public AdminUserService(UserRepository userRepository,
                            FarmerProfileRepository farmerProfileRepository,
                            BuyerProfileRepository buyerProfileRepository) {
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.buyerProfileRepository = buyerProfileRepository;
    }

    /**
     * Search and filter users by role, status, and search keyword.
     */
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers(Role role, UserStatus status, String search) {
        String cleanSearch = (search != null && !search.isBlank()) ? search.trim() : null;
        List<User> users = userRepository.searchUsers(role, status, cleanSearch);
        return users.stream().map(this::mapToAdminUserResponse).toList();
    }

    /**
     * Retrieve a specific user by ID with specialized profile details.
     */
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        return mapToAdminUserResponse(user);
    }

    /**
     * Update user account status (e.g. ACTIVE -> INACTIVE or SUSPENDED).
     */
    @Transactional
    public AdminUserResponse updateUserStatus(Integer userId, UserStatus status) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
        user.setStatus(status);
        User saved = userRepository.save(user);
        return mapToAdminUserResponse(saved);
    }

    private AdminUserResponse mapToAdminUserResponse(User user) {
        AdminUserResponse response = new AdminUserResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );

        if (user.getRole() == Role.FARMER) {
            farmerProfileRepository.findById(user.getUserId()).ifPresent(fp ->
                    response.setFarmerProfile(new FarmerProfileDto(
                            fp.getFarmerId(),
                            fp.getFarmLocation(),
                            fp.getFarmSizeAcres(),
                            fp.getExperienceYears()
                    ))
            );
        } else if (user.getRole() == Role.BUYER) {
            buyerProfileRepository.findById(user.getUserId()).ifPresent(bp ->
                    response.setBuyerProfile(new BuyerProfileDto(
                            bp.getBuyerId(),
                            bp.getBusinessName(),
                            bp.getBusinessType(),
                            bp.getGstin(),
                            bp.getBusinessAddress()
                    ))
            );
        }

        return response;
    }
}
