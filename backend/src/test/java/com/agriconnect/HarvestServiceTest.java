package com.agriconnect;

import com.agriconnect.dto.CreateHarvestRequest;
import com.agriconnect.dto.HarvestResponse;
import com.agriconnect.dto.UpdateHarvestRequest;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.HarvestRepository;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.service.HarvestService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class HarvestServiceTest {

    @Mock
    private HarvestRepository harvestRepository;

    @Mock
    private CropRepository cropRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private HarvestService harvestService;

    private User farmerUser1;
    private User farmerUser2;
    private User buyerUser;
    private Crop tomatoCrop;
    private Harvest harvest1;

    @BeforeEach
    void setUp() {
        farmerUser1 = new User("Rajesh Patel", "rajesh@kisan.in", "+919811122233", "hashedPass", Role.FARMER, UserStatus.ACTIVE);
        farmerUser1.setUserId(2);

        farmerUser2 = new User("Suresh Kumar", "suresh@kisan.in", "+919822233344", "hashedPass", Role.FARMER, UserStatus.ACTIVE);
        farmerUser2.setUserId(3);

        buyerUser = new User("Vikas Gupta", "vikas@freshmarts.com", "+919844455566", "hashedPass", Role.BUYER, UserStatus.ACTIVE);
        buyerUser.setUserId(5);

        tomatoCrop = new Crop("Tomato (Hybrid Red)", CropCategory.VEGETABLE, CropSeason.ALL_SEASON, "Firm tomatoes");
        tomatoCrop.setCropId(1);

        harvest1 = new Harvest(
                farmerUser1,
                tomatoCrop,
                new BigDecimal("1000.00"),
                new BigDecimal("1000.00"),
                new BigDecimal("25.00"),
                LocalDate.now(),
                "Nashik, Maharashtra",
                HarvestStatus.AVAILABLE
        );
        harvest1.setHarvestId(10);
    }

    @Test
    @DisplayName("Create Harvest: Valid parameters successfully creates harvest lot")
    void testCreateHarvestSuccess() {
        CreateHarvestRequest request = new CreateHarvestRequest(
                1,
                new BigDecimal("1000.00"),
                new BigDecimal("25.00"),
                LocalDate.now(),
                "Nashik, Maharashtra"
        );

        when(userRepository.findById(2)).thenReturn(Optional.of(farmerUser1));
        when(cropRepository.findById(1)).thenReturn(Optional.of(tomatoCrop));
        when(harvestRepository.save(any(Harvest.class))).thenAnswer(invocation -> {
            Harvest h = invocation.getArgument(0);
            h.setHarvestId(10);
            return h;
        });

        HarvestResponse response = harvestService.createHarvest(2, request);

        assertThat(response).isNotNull();
        assertThat(response.getHarvestId()).isEqualTo(10);
        assertThat(response.getFarmerId()).isEqualTo(2);
        assertThat(response.getCropId()).isEqualTo(1);
        assertThat(response.getInitialQuantity()).isEqualByComparingTo("1000.00");
        assertThat(response.getAvailableQuantity()).isEqualByComparingTo("1000.00");
        assertThat(response.getPricePerKg()).isEqualByComparingTo("25.00");
        assertThat(response.getStatus()).isEqualTo(HarvestStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Create Harvest: Rejects non-FARMER user")
    void testCreateHarvestFailsForNonFarmer() {
        CreateHarvestRequest request = new CreateHarvestRequest(
                1, new BigDecimal("500.00"), new BigDecimal("30.00"), LocalDate.now(), "Pune"
        );

        when(userRepository.findById(5)).thenReturn(Optional.of(buyerUser));

        assertThatThrownBy(() -> harvestService.createHarvest(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not authorized as a FARMER");
    }

    @Test
    @DisplayName("Create Harvest: Rejects non-existent crop")
    void testCreateHarvestFailsForInvalidCrop() {
        CreateHarvestRequest request = new CreateHarvestRequest(
                999, new BigDecimal("500.00"), new BigDecimal("30.00"), LocalDate.now(), "Pune"
        );

        when(userRepository.findById(2)).thenReturn(Optional.of(farmerUser1));
        when(cropRepository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> harvestService.createHarvest(2, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Crop not found with ID: 999");
    }

    @Test
    @DisplayName("Create Harvest: Rejects zero or negative quantity")
    void testCreateHarvestFailsForInvalidQuantity() {
        CreateHarvestRequest request = new CreateHarvestRequest(
                1, BigDecimal.ZERO, new BigDecimal("30.00"), LocalDate.now(), "Pune"
        );

        when(userRepository.findById(2)).thenReturn(Optional.of(farmerUser1));
        when(cropRepository.findById(1)).thenReturn(Optional.of(tomatoCrop));

        assertThatThrownBy(() -> harvestService.createHarvest(2, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("quantity must be greater than 0");
    }

    @Test
    @DisplayName("Create Harvest: Rejects zero or negative price")
    void testCreateHarvestFailsForInvalidPrice() {
        CreateHarvestRequest request = new CreateHarvestRequest(
                1, new BigDecimal("500.00"), new BigDecimal("-5.00"), LocalDate.now(), "Pune"
        );

        when(userRepository.findById(2)).thenReturn(Optional.of(farmerUser1));
        when(cropRepository.findById(1)).thenReturn(Optional.of(tomatoCrop));

        assertThatThrownBy(() -> harvestService.createHarvest(2, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Price per kg must be greater than 0");
    }

    @Test
    @DisplayName("Get Farmer Harvests: Retrieves all harvests owned by the authenticated farmer")
    void testGetFarmerHarvests() {
        when(harvestRepository.findByFarmer_UserIdOrderByCreatedAtDesc(2)).thenReturn(List.of(harvest1));

        List<HarvestResponse> results = harvestService.getFarmerHarvests(2);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getHarvestId()).isEqualTo(10);
        assertThat(results.get(0).getFarmerId()).isEqualTo(2);
    }

    @Test
    @DisplayName("Ownership check: Farmer accessing own harvest succeeds")
    void testGetOwnHarvestSuccess() {
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));

        HarvestResponse response = harvestService.getFarmerHarvestById(2, 10);

        assertThat(response).isNotNull();
        assertThat(response.getHarvestId()).isEqualTo(10);
    }

    @Test
    @DisplayName("Ownership check: Farmer accessing another farmer's harvest throws AccessDeniedException (403)")
    void testAccessAnotherFarmersHarvestThrowsAccessDenied() {
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));

        // Farmer 3 tries to view harvest 10 owned by Farmer 2
        assertThatThrownBy(() -> harvestService.getFarmerHarvestById(3, 10))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied: You do not have permission to access harvest #10");
    }

    @Test
    @DisplayName("Update Harvest: Farmer updating own harvest with valid parameters succeeds")
    void testUpdateOwnHarvestSuccess() {
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));
        when(harvestRepository.save(any(Harvest.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateHarvestRequest request = new UpdateHarvestRequest(
                new BigDecimal("800.00"),
                new BigDecimal("28.00"),
                LocalDate.now(),
                "Nashik New Mandi",
                HarvestStatus.AVAILABLE
        );

        HarvestResponse response = harvestService.updateFarmerHarvest(2, 10, request);

        assertThat(response.getAvailableQuantity()).isEqualByComparingTo("800.00");
        assertThat(response.getPricePerKg()).isEqualByComparingTo("28.00");
        assertThat(response.getLocation()).isEqualTo("Nashik New Mandi");
    }

    @Test
    @DisplayName("Update Harvest: Available quantity cannot exceed initial quantity")
    void testUpdateHarvestAvailableQuantityCannotExceedInitial() {
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));

        UpdateHarvestRequest request = new UpdateHarvestRequest();
        request.setAvailableQuantity(new BigDecimal("1200.00")); // initial is 1000

        assertThatThrownBy(() -> harvestService.updateFarmerHarvest(2, 10, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot exceed initial quantity");
    }

    @Test
    @DisplayName("Update Harvest: Updating another farmer's harvest throws AccessDeniedException (403)")
    void testUpdateAnotherFarmersHarvestThrowsAccessDenied() {
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));

        UpdateHarvestRequest request = new UpdateHarvestRequest();
        request.setPricePerKg(new BigDecimal("35.00"));

        assertThatThrownBy(() -> harvestService.updateFarmerHarvest(3, 10, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied: You do not have permission to access harvest #10");
    }

    @Test
    @DisplayName("Delete Harvest: Safely deletes harvest lot when no orders reference it")
    void testDeleteHarvestSuccessWhenNoOrdersExist() {
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));
        when(harvestRepository.countOrdersByHarvestId(10)).thenReturn(0L);

        harvestService.deleteFarmerHarvest(2, 10);

        verify(harvestRepository, times(1)).delete(harvest1);
    }

    @Test
    @DisplayName("Delete Harvest: Rejects deletion if orders reference the harvest lot")
    void testDeleteHarvestBlockedWhenOrdersExist() {
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));
        when(harvestRepository.countOrdersByHarvestId(10)).thenReturn(3L);

        assertThatThrownBy(() -> harvestService.deleteFarmerHarvest(2, 10))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("because 3 order(s) are associated with it");

        verify(harvestRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Delete Harvest: Deleting another farmer's harvest throws AccessDeniedException (403)")
    void testDeleteAnotherFarmersHarvestThrowsAccessDenied() {
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));

        assertThatThrownBy(() -> harvestService.deleteFarmerHarvest(3, 10))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied: You do not have permission to access harvest #10");

        verify(harvestRepository, never()).delete(any());
    }
}
