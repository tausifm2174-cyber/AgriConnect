package com.agriconnect;

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
import com.agriconnect.service.BuyerRequirementService;
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
class BuyerRequirementServiceTest {

    @Mock
    private BuyerRequirementRepository requirementRepository;

    @Mock
    private CropRepository cropRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BuyerRequirementService requirementService;

    private User buyerUser1;
    private User buyerUser2;
    private User farmerUser;
    private Crop tomatoCrop;
    private BuyerRequirement requirement1;

    @BeforeEach
    void setUp() {
        buyerUser1 = new User("Vikas Gupta", "vikas@freshmarts.com", "+919833344455", "hash", Role.BUYER, UserStatus.ACTIVE);
        buyerUser1.setUserId(5);

        buyerUser2 = new User("Priya Sharma", "priya@organics.in", "+919844455566", "hash", Role.BUYER, UserStatus.ACTIVE);
        buyerUser2.setUserId(6);

        farmerUser = new User("Rajesh Patel", "rajesh@kisan.in", "+919811122233", "hash", Role.FARMER, UserStatus.ACTIVE);
        farmerUser.setUserId(2);

        tomatoCrop = new Crop("Tomato", CropCategory.VEGETABLE, CropSeason.ALL_SEASON, "Grade A Red Tomato");
        tomatoCrop.setCropId(1);

        requirement1 = new BuyerRequirement(
                buyerUser1,
                tomatoCrop,
                new BigDecimal("400.00"),
                new BigDecimal("27.00"),
                QualityGrade.A,
                "Nashik, Maharashtra",
                LocalDate.now().plusDays(10),
                RequirementStatus.OPEN
        );
        requirement1.setRequirementId(101);
    }

    @Test
    @DisplayName("Create Requirement: Successful with valid inputs")
    void testCreateRequirement_Success() {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                1, new BigDecimal("400.00"), new BigDecimal("27.00"),
                QualityGrade.A, "Nashik", LocalDate.now().plusDays(10)
        );

        when(userRepository.findById(5)).thenReturn(Optional.of(buyerUser1));
        when(cropRepository.findById(1)).thenReturn(Optional.of(tomatoCrop));
        when(requirementRepository.save(any(BuyerRequirement.class))).thenAnswer(inv -> {
            BuyerRequirement req = inv.getArgument(0);
            req.setRequirementId(101);
            return req;
        });

        BuyerRequirementResponse response = requirementService.createRequirement(5, request);

        assertThat(response).isNotNull();
        assertThat(response.getRequirementId()).isEqualTo(101);
        assertThat(response.getCropName()).isEqualTo("Tomato");
        assertThat(response.getRequiredQuantity()).isEqualByComparingTo("400.00");
        assertThat(response.getMaxPricePerKg()).isEqualByComparingTo("27.00");
        assertThat(response.getMinQualityGrade()).isEqualTo(QualityGrade.A);
        assertThat(response.getStatus()).isEqualTo(RequirementStatus.OPEN);
    }

    @Test
    @DisplayName("Create Requirement: Non-buyer role throws BadRequestException")
    void testCreateRequirement_NonBuyerRole_ThrowsBadRequest() {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                1, new BigDecimal("400.00"), new BigDecimal("27.00"),
                QualityGrade.A, "Nashik", LocalDate.now().plusDays(10)
        );

        when(userRepository.findById(2)).thenReturn(Optional.of(farmerUser));

        assertThatThrownBy(() -> requirementService.createRequirement(2, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not authorized as a BUYER");
    }

    @Test
    @DisplayName("Create Requirement: Non-existent crop throws ResourceNotFoundException")
    void testCreateRequirement_InvalidCrop_ThrowsNotFound() {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                999, new BigDecimal("400.00"), new BigDecimal("27.00"),
                QualityGrade.A, "Nashik", LocalDate.now().plusDays(10)
        );

        when(userRepository.findById(5)).thenReturn(Optional.of(buyerUser1));
        when(cropRepository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> requirementService.createRequirement(5, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Crop not found with ID: 999");
    }

    @Test
    @DisplayName("Create Requirement: Zero or negative quantity throws BadRequestException")
    void testCreateRequirement_InvalidQuantity_ThrowsBadRequest() {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                1, new BigDecimal("0.00"), new BigDecimal("27.00"),
                QualityGrade.A, "Nashik", LocalDate.now().plusDays(10)
        );

        when(userRepository.findById(5)).thenReturn(Optional.of(buyerUser1));
        when(cropRepository.findById(1)).thenReturn(Optional.of(tomatoCrop));

        assertThatThrownBy(() -> requirementService.createRequirement(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Required quantity must be greater than 0 kg");
    }

    @Test
    @DisplayName("Create Requirement: Zero or negative price throws BadRequestException")
    void testCreateRequirement_InvalidPrice_ThrowsBadRequest() {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                1, new BigDecimal("400.00"), new BigDecimal("-5.00"),
                QualityGrade.A, "Nashik", LocalDate.now().plusDays(10)
        );

        when(userRepository.findById(5)).thenReturn(Optional.of(buyerUser1));
        when(cropRepository.findById(1)).thenReturn(Optional.of(tomatoCrop));

        assertThatThrownBy(() -> requirementService.createRequirement(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Maximum price per kg must be greater than 0");
    }

    @Test
    @DisplayName("Create Requirement: Past date throws BadRequestException")
    void testCreateRequirement_PastDate_ThrowsBadRequest() {
        CreateBuyerRequirementRequest request = new CreateBuyerRequirementRequest(
                1, new BigDecimal("400.00"), new BigDecimal("27.00"),
                QualityGrade.A, "Nashik", LocalDate.now().minusDays(1)
        );

        when(userRepository.findById(5)).thenReturn(Optional.of(buyerUser1));
        when(cropRepository.findById(1)).thenReturn(Optional.of(tomatoCrop));

        assertThatThrownBy(() -> requirementService.createRequirement(5, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Required-by date cannot be in the past");
    }

    @Test
    @DisplayName("Get Requirements: Returns list and auto-marks overdue open requirements as EXPIRED")
    void testGetBuyerRequirements_AutoExpiresOverdue() {
        BuyerRequirement overdueReq = new BuyerRequirement(
                buyerUser1, tomatoCrop, new BigDecimal("100.00"), new BigDecimal("20.00"),
                QualityGrade.B, "Pune", LocalDate.now().minusDays(5), RequirementStatus.OPEN
        );
        overdueReq.setRequirementId(102);

        when(requirementRepository.findByBuyer_UserIdOrderByCreatedAtDesc(5))
                .thenReturn(List.of(requirement1, overdueReq));
        when(requirementRepository.save(any(BuyerRequirement.class))).thenAnswer(inv -> inv.getArgument(0));

        List<BuyerRequirementResponse> responses = requirementService.getBuyerRequirements(5);

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getStatus()).isEqualTo(RequirementStatus.OPEN);
        assertThat(responses.get(1).getStatus()).isEqualTo(RequirementStatus.EXPIRED);
        verify(requirementRepository).save(overdueReq);
    }

    @Test
    @DisplayName("Get Requirement By ID: Owned requirement returns successfully")
    void testGetBuyerRequirementById_Success() {
        when(requirementRepository.findById(101)).thenReturn(Optional.of(requirement1));

        BuyerRequirementResponse response = requirementService.getBuyerRequirementById(5, 101);

        assertThat(response).isNotNull();
        assertThat(response.getRequirementId()).isEqualTo(101);
    }

    @Test
    @DisplayName("Get Requirement By ID: Foreign owner throws AccessDeniedException (403)")
    void testGetBuyerRequirementById_ForeignOwner_ThrowsAccessDenied() {
        when(requirementRepository.findById(101)).thenReturn(Optional.of(requirement1));

        assertThatThrownBy(() -> requirementService.getBuyerRequirementById(6, 101))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("Update Requirement: Valid updates applied successfully")
    void testUpdateBuyerRequirement_Success() {
        UpdateBuyerRequirementRequest updateReq = new UpdateBuyerRequirementRequest(
                1, new BigDecimal("500.00"), new BigDecimal("30.00"),
                QualityGrade.B, "Pune, Maharashtra", LocalDate.now().plusDays(15)
        );

        when(requirementRepository.findById(101)).thenReturn(Optional.of(requirement1));
        when(cropRepository.findById(1)).thenReturn(Optional.of(tomatoCrop));
        when(requirementRepository.save(any(BuyerRequirement.class))).thenAnswer(inv -> inv.getArgument(0));

        BuyerRequirementResponse response = requirementService.updateBuyerRequirement(5, 101, updateReq);

        assertThat(response.getRequiredQuantity()).isEqualByComparingTo("500.00");
        assertThat(response.getMaxPricePerKg()).isEqualByComparingTo("30.00");
        assertThat(response.getMinQualityGrade()).isEqualTo(QualityGrade.B);
        assertThat(response.getPreferredLocation()).isEqualTo("Pune, Maharashtra");
    }

    @Test
    @DisplayName("Update Requirement: Foreign owner throws AccessDeniedException (403)")
    void testUpdateBuyerRequirement_ForeignOwner_ThrowsAccessDenied() {
        UpdateBuyerRequirementRequest updateReq = new UpdateBuyerRequirementRequest(
                1, new BigDecimal("500.00"), new BigDecimal("30.00"),
                QualityGrade.B, "Pune", LocalDate.now().plusDays(15)
        );

        when(requirementRepository.findById(101)).thenReturn(Optional.of(requirement1));

        assertThatThrownBy(() -> requirementService.updateBuyerRequirement(6, 101, updateReq))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("Update Requirement: Cancelled requirement cannot be edited")
    void testUpdateBuyerRequirement_Cancelled_ThrowsBadRequest() {
        requirement1.setStatus(RequirementStatus.CANCELLED);
        UpdateBuyerRequirementRequest updateReq = new UpdateBuyerRequirementRequest(
                1, new BigDecimal("500.00"), new BigDecimal("30.00"),
                QualityGrade.B, "Pune", LocalDate.now().plusDays(15)
        );

        when(requirementRepository.findById(101)).thenReturn(Optional.of(requirement1));

        assertThatThrownBy(() -> requirementService.updateBuyerRequirement(5, 101, updateReq))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already been CANCELLED");
    }

    @Test
    @DisplayName("Cancel Requirement: Open requirement cancelled successfully")
    void testCancelBuyerRequirement_Success() {
        when(requirementRepository.findById(101)).thenReturn(Optional.of(requirement1));
        when(requirementRepository.save(any(BuyerRequirement.class))).thenAnswer(inv -> inv.getArgument(0));

        BuyerRequirementResponse response = requirementService.cancelBuyerRequirement(5, 101);

        assertThat(response.getStatus()).isEqualTo(RequirementStatus.CANCELLED);
    }

    @Test
    @DisplayName("Cancel Requirement: Already cancelled throws BadRequestException")
    void testCancelBuyerRequirement_AlreadyCancelled_ThrowsBadRequest() {
        requirement1.setStatus(RequirementStatus.CANCELLED);
        when(requirementRepository.findById(101)).thenReturn(Optional.of(requirement1));

        assertThatThrownBy(() -> requirementService.cancelBuyerRequirement(5, 101))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already CANCELLED");
    }

    @Test
    @DisplayName("Cancel Requirement: Foreign owner throws AccessDeniedException (403)")
    void testCancelBuyerRequirement_ForeignOwner_ThrowsAccessDenied() {
        when(requirementRepository.findById(101)).thenReturn(Optional.of(requirement1));

        assertThatThrownBy(() -> requirementService.cancelBuyerRequirement(6, 101))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("Metrics: Accurately reports breakdown of requirement counts")
    void testGetBuyerRequirementMetrics_Success() {
        when(requirementRepository.findByBuyer_UserIdOrderByCreatedAtDesc(5))
                .thenReturn(List.of(requirement1));
        when(requirementRepository.countByBuyer_UserId(5)).thenReturn(4L);
        when(requirementRepository.countByBuyer_UserIdAndStatus(5, RequirementStatus.OPEN)).thenReturn(2L);
        when(requirementRepository.countByBuyer_UserIdAndStatus(5, RequirementStatus.FULFILLED)).thenReturn(1L);
        when(requirementRepository.countByBuyer_UserIdAndStatus(5, RequirementStatus.EXPIRED)).thenReturn(0L);
        when(requirementRepository.countByBuyer_UserIdAndStatus(5, RequirementStatus.CANCELLED)).thenReturn(1L);

        BuyerRequirementMetricsResponse metrics = requirementService.getBuyerRequirementMetrics(5);

        assertThat(metrics.getTotalRequirements()).isEqualTo(4L);
        assertThat(metrics.getOpenRequirements()).isEqualTo(2L);
        assertThat(metrics.getFulfilledRequirements()).isEqualTo(1L);
        assertThat(metrics.getExpiredRequirements()).isEqualTo(0L);
        assertThat(metrics.getCancelledRequirements()).isEqualTo(1L);
    }
}
