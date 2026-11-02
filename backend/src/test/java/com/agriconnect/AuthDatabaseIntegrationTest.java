package com.agriconnect;

import com.agriconnect.dto.AuthResponse;
import com.agriconnect.dto.LoginRequest;
import com.agriconnect.dto.RegisterRequest;
import com.agriconnect.entity.BusinessType;
import com.agriconnect.entity.Role;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.DuplicateResourceException;
import com.agriconnect.repository.BuyerProfileRepository;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Transactional // Automatically rolls back database changes after each test
class AuthDatabaseIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FarmerProfileRepository farmerProfileRepository;

    @Autowired
    private BuyerProfileRepository buyerProfileRepository;

    @Test
    @DisplayName("Real DB: Register FARMER, verify DB insertion, BCrypt hash, and FarmerProfile creation")
    void testRealDatabaseFarmerRegistration() {
        String testEmail = "test.farmer." + System.currentTimeMillis() + "@kisan.in";
        String testPhone = "+91" + (System.currentTimeMillis() % 10000000000L);

        RegisterRequest request = new RegisterRequest(
                "Balram Singh",
                testEmail,
                testPhone,
                "KisanPass@2026",
                Role.FARMER
        );
        request.setFarmLocation("Nagpur APMC Region, Maharashtra");
        request.setFarmSizeAcres(new BigDecimal("15.75"));
        request.setExperienceYears(14);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isNotNull();
        assertThat(response.getToken()).isNotBlank();
        assertThat(response.getRole()).isEqualTo(Role.FARMER);

        // Verify entity in real MySQL table
        var dbUser = userRepository.findById(response.getUserId());
        assertThat(dbUser).isPresent();
        assertThat(dbUser.get().getPasswordHash()).isNotEqualTo("KisanPass@2026");
        assertThat(dbUser.get().getPasswordHash()).startsWith("$2a$");

        // Verify FarmerProfile in real MySQL table
        var dbProfile = farmerProfileRepository.findById(response.getUserId());
        assertThat(dbProfile).isPresent();
        assertThat(dbProfile.get().getFarmLocation()).isEqualTo("Nagpur APMC Region, Maharashtra");
        assertThat(dbProfile.get().getFarmSizeAcres()).isEqualByComparingTo(new BigDecimal("15.75"));
        assertThat(dbProfile.get().getExperienceYears()).isEqualTo(14);
    }

    @Test
    @DisplayName("Real DB: Register BUYER, verify DB insertion and BuyerProfile creation")
    void testRealDatabaseBuyerRegistration() {
        String testEmail = "test.buyer." + System.currentTimeMillis() + "@agrotrade.in";
        String testPhone = "+91" + ((System.currentTimeMillis() + 1) % 10000000000L);

        RegisterRequest request = new RegisterRequest(
                "Deepak Agarwal",
                testEmail,
                testPhone,
                "BuyerPass@2026",
                Role.BUYER
        );
        request.setBusinessName("Agarwal Agro Processing Ltd");
        request.setBusinessType(BusinessType.PROCESSOR);
        request.setBusinessAddress("MIDC Industrial Area, Pune, Maharashtra");

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isNotNull();
        assertThat(response.getRole()).isEqualTo(Role.BUYER);

        var dbProfile = buyerProfileRepository.findById(response.getUserId());
        assertThat(dbProfile).isPresent();
        assertThat(dbProfile.get().getBusinessName()).isEqualTo("Agarwal Agro Processing Ltd");
        assertThat(dbProfile.get().getBusinessType()).isEqualTo(BusinessType.PROCESSOR);
    }

    @Test
    @DisplayName("Real DB: Duplicate email registration triggers DuplicateResourceException (409)")
    void testRealDatabaseDuplicateEmailThrowsConflict() {
        // "admin@agriconnect.org" is already present in Phase 2 sample data
        RegisterRequest request = new RegisterRequest(
                "Duplicate Person",
                "admin@agriconnect.org",
                "+919999988888",
                "SomePassword123",
                Role.FARMER
        );

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email is already registered");
    }

    @Test
    @DisplayName("Real DB: Prevent public registration of ADMIN role")
    void testRealDatabasePreventAdminRegistration() {
        RegisterRequest request = new RegisterRequest(
                "Malicious Hacker",
                "hacker@darkweb.org",
                "+919999977777",
                "RootPassword123",
                Role.ADMIN
        );

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Public registration is not permitted for the ADMIN role");
    }

    @Test
    @DisplayName("Real DB: Login with backfilled existing sample user (admin@agriconnect.org / Password@123)")
    void testRealDatabaseSampleUserLogin() {
        LoginRequest request = new LoginRequest("admin@agriconnect.org", "Password@123");
        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.getRole()).isEqualTo(Role.ADMIN);
        assertThat(response.getToken()).isNotBlank();
        assertThat(response.getEmail()).isEqualTo("admin@agriconnect.org");
    }

    @Test
    @DisplayName("Real DB: Login with incorrect password triggers BadCredentialsException (401)")
    void testRealDatabaseInvalidLoginFails() {
        LoginRequest request = new LoginRequest("admin@agriconnect.org", "WrongPassword!456");

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }
}
