package com.agriconnect;

import com.agriconnect.dto.AdminUserResponse;
import com.agriconnect.entity.*;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.BuyerProfileRepository;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.service.AdminUserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private FarmerProfileRepository farmerProfileRepository;
    @Mock
    private BuyerProfileRepository buyerProfileRepository;

    @InjectMocks
    private AdminUserService adminUserService;

    private User farmerUser;
    private User buyerUser;
    private FarmerProfile farmerProfile;
    private BuyerProfile buyerProfile;

    @BeforeEach
    void setUp() {
        farmerUser = new User("Ramesh Kumar", "ramesh@example.com", "9876543210", "$2a$10$encodedHash", Role.FARMER, UserStatus.ACTIVE);
        farmerUser.setUserId(10);

        buyerUser = new User("Sunita Agro", "sunita@example.com", "9876543211", "$2a$10$encodedHash", Role.BUYER, UserStatus.ACTIVE);
        buyerUser.setUserId(20);

        farmerProfile = new FarmerProfile(farmerUser, "Nashik, Maharashtra", new BigDecimal("12.50"), 15);
        buyerProfile = new BuyerProfile(buyerUser, "Sunita Organics Pvt Ltd", BusinessType.WHOLESALER, "27ABCDE1234F1Z5", "Pune Industrial Area");
    }

    @Test
    @DisplayName("getUsers: Successfully retrieves filtered users and maps profiles safely without password")
    void testGetUsers() {
        when(userRepository.searchUsers(Role.FARMER, UserStatus.ACTIVE, "Ramesh"))
                .thenReturn(List.of(farmerUser));
        when(farmerProfileRepository.findById(10)).thenReturn(Optional.of(farmerProfile));

        List<AdminUserResponse> users = adminUserService.getUsers(Role.FARMER, UserStatus.ACTIVE, "Ramesh");

        assertThat(users).hasSize(1);
        AdminUserResponse response = users.get(0);
        assertThat(response.getUserId()).isEqualTo(10);
        assertThat(response.getFullName()).isEqualTo("Ramesh Kumar");
        assertThat(response.getEmail()).isEqualTo("ramesh@example.com");
        assertThat(response.getRole()).isEqualTo(Role.FARMER);
        assertThat(response.getFarmerProfile()).isNotNull();
        assertThat(response.getFarmerProfile().getFarmLocation()).isEqualTo("Nashik, Maharashtra");
        assertThat(response.getBuyerProfile()).isNull();
    }

    @Test
    @DisplayName("getUserById: Returns buyer with buyer specialization details")
    void testGetUserByIdBuyer() {
        when(userRepository.findById(20)).thenReturn(Optional.of(buyerUser));
        when(buyerProfileRepository.findById(20)).thenReturn(Optional.of(buyerProfile));

        AdminUserResponse response = adminUserService.getUserById(20);

        assertThat(response).isNotNull();
        assertThat(response.getUserId()).isEqualTo(20);
        assertThat(response.getFullName()).isEqualTo("Sunita Agro");
        assertThat(response.getRole()).isEqualTo(Role.BUYER);
        assertThat(response.getBuyerProfile()).isNotNull();
        assertThat(response.getBuyerProfile().getBusinessName()).isEqualTo("Sunita Organics Pvt Ltd");
        assertThat(response.getFarmerProfile()).isNull();
    }

    @Test
    @DisplayName("getUserById: Throws ResourceNotFoundException when user does not exist")
    void testGetUserByIdNotFound() {
        when(userRepository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminUserService.getUserById(999))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with ID: 999");
    }
}
