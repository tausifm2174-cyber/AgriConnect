package com.agriconnect.service;

import com.agriconnect.dto.*;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.DuplicateResourceException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.BuyerProfileRepository;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.security.JwtTokenProvider;
import com.agriconnect.security.TokenBlacklistService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Service managing user registration, authentication, profile creation, and session logout.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final FarmerProfileRepository farmerProfileRepository;
    private final BuyerProfileRepository buyerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthService(UserRepository userRepository,
                       FarmerProfileRepository farmerProfileRepository,
                       BuyerProfileRepository buyerProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       TokenBlacklistService tokenBlacklistService) {
        this.userRepository = userRepository;
        this.farmerProfileRepository = farmerProfileRepository;
        this.buyerProfileRepository = buyerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    /**
     * Public user registration for FARMER or BUYER roles.
     * Prevents public registration of ADMIN accounts.
     * Transactional: atomically persists user and corresponding profile.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Enforce role constraints
        if (request.getRole() == Role.ADMIN) {
            log.warn("Blocked public registration attempt for ADMIN role with email: {}", request.getEmail());
            throw new BadRequestException("Public registration is not permitted for the ADMIN role.");
        }

        if (request.getRole() != Role.FARMER && request.getRole() != Role.BUYER) {
            throw new BadRequestException("Invalid registration role. Allowed roles are: FARMER, BUYER");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedPhone = request.getPhone().trim();

        // Check for duplicates
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new DuplicateResourceException("Email is already registered: " + normalizedEmail);
        }

        if (userRepository.existsByPhone(normalizedPhone)) {
            throw new DuplicateResourceException("Phone number is already registered: " + normalizedPhone);
        }

        // Secure password hashing with BCrypt
        String passwordHash = passwordEncoder.encode(request.getPassword());

        // Create central user
        User user = new User(
                request.getFullName().trim(),
                normalizedEmail,
                normalizedPhone,
                passwordHash,
                request.getRole(),
                UserStatus.ACTIVE
        );

        User savedUser = userRepository.save(user);

        // Create corresponding 1:1 specialization profile
        if (savedUser.getRole() == Role.FARMER) {
            String location = StringUtils.hasText(request.getFarmLocation())
                    ? request.getFarmLocation().trim()
                    : "Location pending";
            BigDecimal size = request.getFarmSizeAcres() != null && request.getFarmSizeAcres().compareTo(BigDecimal.ZERO) > 0
                    ? request.getFarmSizeAcres()
                    : new BigDecimal("1.00");
            Integer experience = request.getExperienceYears() != null && request.getExperienceYears() >= 0
                    ? request.getExperienceYears()
                    : 0;

            FarmerProfile farmerProfile = new FarmerProfile(savedUser, location, size, experience);
            farmerProfileRepository.save(farmerProfile);
            log.info("Registered new FARMER with ID: {} and created farmer profile", savedUser.getUserId());

        } else if (savedUser.getRole() == Role.BUYER) {
            String businessName = StringUtils.hasText(request.getBusinessName())
                    ? request.getBusinessName().trim()
                    : savedUser.getFullName() + " Enterprise";
            BusinessType businessType = request.getBusinessType() != null
                    ? request.getBusinessType()
                    : BusinessType.RETAILER;
            String gstin = StringUtils.hasText(request.getGstin()) ? request.getGstin().trim() : null;
            String businessAddress = StringUtils.hasText(request.getBusinessAddress())
                    ? request.getBusinessAddress().trim()
                    : "Business address pending";

            BuyerProfile buyerProfile = new BuyerProfile(savedUser, businessName, businessType, gstin, businessAddress);
            buyerProfileRepository.save(buyerProfile);
            log.info("Registered new BUYER with ID: {} and created buyer profile", savedUser.getUserId());
        }

        // Generate JWT token
        String token = jwtTokenProvider.generateToken(savedUser);

        return new AuthResponse(
                token,
                savedUser.getUserId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole(),
                savedUser.getStatus(),
                "User registered successfully as " + savedUser.getRole()
        );
    }

    /**
     * Authenticates user credentials and generates JWT token.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Failed authentication attempt for email: {}", normalizedEmail);
            throw new BadCredentialsException("Invalid email or password");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            log.warn("Blocked login for non-active account (status: {}) for email: {}", user.getStatus(), normalizedEmail);
            throw new BadRequestException("Account status is " + user.getStatus().name() + ". Please contact administrator.");
        }

        String token = jwtTokenProvider.generateToken(user);
        log.info("User logged in successfully: {} (Role: {})", user.getEmail(), user.getRole());

        return new AuthResponse(
                token,
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus(),
                "Authentication successful"
        );
    }

    /**
     * Retrieves safe current user identity and profile details.
     */
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        UserResponse response = new UserResponse(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getStatus()
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

    /**
     * Invalidates the provided JWT token on the server-side and clears SecurityContext.
     */
    public void logout(String authHeader) {
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtTokenProvider.validateToken(token)) {
                Instant expiry = jwtTokenProvider.getExpirationFromToken(token);
                tokenBlacklistService.blacklistToken(token, expiry);
            }
        }
        SecurityContextHolder.clearContext();
        log.info("User logged out and security context cleared");
    }
}
