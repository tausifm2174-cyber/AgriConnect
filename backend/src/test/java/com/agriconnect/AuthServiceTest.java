package com.agriconnect;

import com.agriconnect.dto.AuthResponse;
import com.agriconnect.dto.LoginRequest;
import com.agriconnect.dto.RegisterRequest;
import com.agriconnect.dto.UserResponse;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.DuplicateResourceException;
import com.agriconnect.repository.BuyerProfileRepository;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.security.JwtTokenProvider;
import com.agriconnect.security.TokenBlacklistService;
import com.agriconnect.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private FarmerProfileRepository farmerProfileRepository;

    @Mock
    private BuyerProfileRepository buyerProfileRepository;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(
                userRepository,
                farmerProfileRepository,
                buyerProfileRepository,
                passwordEncoder,
                jwtTokenProvider,
                tokenBlacklistService
        );
    }

    @Test
    @DisplayName("Should successfully register a FARMER and create farmer profile")
    void registerFarmer_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Kisan Lal");
        request.setEmail("kisan@example.com");
        request.setPhone("+919876500001");
        request.setPassword("SecureFarmerPass123");
        request.setRole(Role.FARMER);
        request.setFarmLocation("Nagpur, Maharashtra");
        request.setFarmSizeAcres(new BigDecimal("12.50"));
        request.setExperienceYears(8);

        when(userRepository.existsByEmailIgnoreCase("kisan@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("+919876500001")).thenReturn(false);
        when(jwtTokenProvider.generateToken(any(User.class))).thenReturn("mock-jwt-farmer-token");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(101);
            return u;
        });

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock-jwt-farmer-token");
        assertThat(response.getEmail()).isEqualTo("kisan@example.com");
        assertThat(response.getRole()).isEqualTo(Role.FARMER);
        assertThat(response.getUserId()).isEqualTo(101);

        // Verify password was hashed and never plaintext
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getPasswordHash()).isNotEqualTo("SecureFarmerPass123");
        assertThat(passwordEncoder.matches("SecureFarmerPass123", savedUser.getPasswordHash())).isTrue();

        // Verify FarmerProfile was saved
        ArgumentCaptor<FarmerProfile> profileCaptor = ArgumentCaptor.forClass(FarmerProfile.class);
        verify(farmerProfileRepository).save(profileCaptor.capture());
        FarmerProfile profile = profileCaptor.getValue();
        assertThat(profile.getFarmLocation()).isEqualTo("Nagpur, Maharashtra");
        assertThat(profile.getFarmSizeAcres()).isEqualTo(new BigDecimal("12.50"));
        assertThat(profile.getExperienceYears()).isEqualTo(8);
        verifyNoInteractions(buyerProfileRepository);
    }

    @Test
    @DisplayName("Should successfully register a BUYER and create buyer profile")
    void registerBuyer_Success() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Maha Mandi Traders");
        request.setEmail("buyer@example.com");
        request.setPhone("+919876500002");
        request.setPassword("SecureBuyerPass123");
        request.setRole(Role.BUYER);
        request.setBusinessName("Maha Mandi Pvt Ltd");
        request.setBusinessType(BusinessType.WHOLESALER);
        request.setGstin("27AAAAA0000A1Z5");
        request.setBusinessAddress("Vashi APMC Market, Navi Mumbai");

        when(userRepository.existsByEmailIgnoreCase("buyer@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("+919876500002")).thenReturn(false);
        when(jwtTokenProvider.generateToken(any(User.class))).thenReturn("mock-jwt-buyer-token");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(202);
            return u;
        });

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock-jwt-buyer-token");
        assertThat(response.getRole()).isEqualTo(Role.BUYER);
        assertThat(response.getUserId()).isEqualTo(202);

        // Verify BuyerProfile was saved
        ArgumentCaptor<BuyerProfile> profileCaptor = ArgumentCaptor.forClass(BuyerProfile.class);
        verify(buyerProfileRepository).save(profileCaptor.capture());
        BuyerProfile profile = profileCaptor.getValue();
        assertThat(profile.getBusinessName()).isEqualTo("Maha Mandi Pvt Ltd");
        assertThat(profile.getBusinessType()).isEqualTo(BusinessType.WHOLESALER);
        verifyNoInteractions(farmerProfileRepository);
    }

    @Test
    @DisplayName("Should reject public registration for ADMIN role")
    void registerAdmin_ThrowsBadRequest() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Unauthorized Admin");
        request.setEmail("admin@hack.org");
        request.setPhone("+919876500003");
        request.setPassword("AdminHack123");
        request.setRole(Role.ADMIN);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Public registration is not permitted for the ADMIN role");

        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("Should reject duplicate email registration with 409 Conflict")
    void registerDuplicateEmail_ThrowsDuplicateResourceException() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Duplicate User");
        request.setEmail("existing@example.com");
        request.setPhone("+919876500004");
        request.setPassword("Pass12345");
        request.setRole(Role.FARMER);

        when(userRepository.existsByEmailIgnoreCase("existing@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email is already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject duplicate phone registration with 409 Conflict")
    void registerDuplicatePhone_ThrowsDuplicateResourceException() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Duplicate Phone User");
        request.setEmail("newemail@example.com");
        request.setPhone("+919876500005");
        request.setPassword("Pass12345");
        request.setRole(Role.BUYER);

        when(userRepository.existsByEmailIgnoreCase("newemail@example.com")).thenReturn(false);
        when(userRepository.existsByPhone("+919876500005")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Phone number is already registered");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should successfully login with valid credentials")
    void login_Success() {
        String rawPassword = "ValidPassword123";
        String encoded = passwordEncoder.encode(rawPassword);

        User user = new User("Ramesh Farmer", "ramesh@kisan.in", "+919811122233", encoded, Role.FARMER, UserStatus.ACTIVE);
        user.setUserId(10);

        when(userRepository.findByEmailIgnoreCase("ramesh@kisan.in")).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateToken(user)).thenReturn("valid-jwt-token");

        LoginRequest request = new LoginRequest("ramesh@kisan.in", rawPassword);
        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("valid-jwt-token");
        assertThat(response.getUserId()).isEqualTo(10);
        assertThat(response.getRole()).isEqualTo(Role.FARMER);
        assertThat(response.getEmail()).isEqualTo("ramesh@kisan.in");
    }

    @Test
    @DisplayName("Should fail login when password is incorrect")
    void login_InvalidPassword_ThrowsBadCredentials() {
        String encoded = passwordEncoder.encode("CorrectPassword");
        User user = new User("Ramesh", "ramesh@kisan.in", "+919811122233", encoded, Role.FARMER, UserStatus.ACTIVE);

        when(userRepository.findByEmailIgnoreCase("ramesh@kisan.in")).thenReturn(Optional.of(user));

        LoginRequest request = new LoginRequest("ramesh@kisan.in", "WrongPassword");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("Should fail login when email does not exist")
    void login_UserNotFound_ThrowsBadCredentials() {
        when(userRepository.findByEmailIgnoreCase("nonexistent@example.com")).thenReturn(Optional.empty());

        LoginRequest request = new LoginRequest("nonexistent@example.com", "SomePass");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("Should retrieve current user details safely without exposing password")
    void getCurrentUser_Success() {
        User user = new User("Suresh Kumar", "suresh@kisan.in", "+919822233344", "hash-not-exposed", Role.FARMER, UserStatus.ACTIVE);
        user.setUserId(3);

        FarmerProfile fp = new FarmerProfile(user, "Karnal, Haryana", new BigDecimal("25.00"), 20);

        when(userRepository.findByEmailIgnoreCase("suresh@kisan.in")).thenReturn(Optional.of(user));
        when(farmerProfileRepository.findById(3)).thenReturn(Optional.of(fp));

        UserResponse response = authService.getCurrentUser("suresh@kisan.in");

        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(3);
        assertThat(response.getFullName()).isEqualTo("Suresh Kumar");
        assertThat(response.getEmail()).isEqualTo("suresh@kisan.in");
        assertThat(response.getRole()).isEqualTo(Role.FARMER);
        assertThat(response.getFarmerProfile()).isNotNull();
        assertThat(response.getFarmerProfile().getFarmLocation()).isEqualTo("Karnal, Haryana");
    }

    @Test
    @DisplayName("Should blacklist token on logout")
    void logout_Success() {
        String token = "sample.bearer.token";
        String header = "Bearer " + token;

        when(jwtTokenProvider.validateToken(token)).thenReturn(true);
        when(jwtTokenProvider.getExpirationFromToken(token)).thenReturn(java.time.Instant.now().plusSeconds(3600));

        authService.logout(header);

        verify(tokenBlacklistService).blacklistToken(eq(token), any());
    }
}
