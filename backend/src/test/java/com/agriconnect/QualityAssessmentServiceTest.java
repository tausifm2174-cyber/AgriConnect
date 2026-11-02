package com.agriconnect;

import com.agriconnect.dto.CreateQualityAssessmentRequest;
import com.agriconnect.dto.QualityAssessmentResponse;
import com.agriconnect.dto.UpdateQualityAssessmentRequest;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.DuplicateResourceException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.HarvestRepository;
import com.agriconnect.repository.QualityAssessmentRepository;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.service.QualityAssessmentService;
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
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QualityAssessmentServiceTest {

    @Mock
    private QualityAssessmentRepository qualityAssessmentRepository;

    @Mock
    private HarvestRepository harvestRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private QualityAssessmentService qualityAssessmentService;

    private User adminUser;
    private User farmerUser1;
    private User farmerUser2;
    private Crop tomatoCrop;
    private Harvest harvest1;
    private QualityAssessment existingAssessment;

    @BeforeEach
    void setUp() {
        adminUser = new User("Admin Ramesh", "admin@agriconnect.org", "+919876543210", "hash", Role.ADMIN, UserStatus.ACTIVE);
        adminUser.setUserId(1);

        farmerUser1 = new User("Rajesh Patel", "rajesh@kisan.in", "+919811122233", "hash", Role.FARMER, UserStatus.ACTIVE);
        farmerUser1.setUserId(2);

        farmerUser2 = new User("Suresh Kumar", "suresh@kisan.in", "+919822233344", "hash", Role.FARMER, UserStatus.ACTIVE);
        farmerUser2.setUserId(3);

        tomatoCrop = new Crop("Tomato (Hybrid Red)", CropCategory.VEGETABLE, CropSeason.ALL_SEASON, "Firm tomatoes");
        tomatoCrop.setCropId(1);

        harvest1 = new Harvest(
                farmerUser1,
                tomatoCrop,
                new BigDecimal("1000.00"),
                new BigDecimal("1000.00"),
                new BigDecimal("25.00"),
                LocalDate.now().minusDays(2),
                "Nashik, Maharashtra",
                HarvestStatus.AVAILABLE
        );
        harvest1.setHarvestId(10);

        existingAssessment = new QualityAssessment(
                harvest1,
                adminUser,
                9, 8, 9, 8, 9,
                new BigDecimal("4.00"),
                new BigDecimal("86.00"),
                QualityGrade.A,
                VerificationStatus.PENDING,
                LocalDate.now(),
                "Initial inspection notes"
        );
        existingAssessment.setAssessmentId(100);
    }

    @Test
    @DisplayName("Admin can create assessment -> 201 with computed score 86.00 and Grade A")
    void testCreateAssessmentSuccess() {
        CreateQualityAssessmentRequest request = new CreateQualityAssessmentRequest(
                10, 9, 8, 9, 8, 9, new BigDecimal("4.00"), "Excellent lot"
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(adminUser));
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));
        when(qualityAssessmentRepository.existsByHarvest_HarvestId(10)).thenReturn(false);
        when(qualityAssessmentRepository.save(any(QualityAssessment.class))).thenAnswer(invocation -> {
            QualityAssessment qa = invocation.getArgument(0);
            qa.setAssessmentId(101);
            return qa;
        });

        QualityAssessmentResponse response = qualityAssessmentService.createAssessment(1, request);

        assertThat(response).isNotNull();
        assertThat(response.getAssessmentId()).isEqualTo(101);
        assertThat(response.getQualityScore()).isEqualByComparingTo(new BigDecimal("86.00"));
        assertThat(response.getQualityGrade()).isEqualTo(QualityGrade.A);
        assertThat(response.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(response.getAdminId()).isEqualTo(1);

        verify(qualityAssessmentRepository).save(any(QualityAssessment.class));
    }

    @Test
    @DisplayName("Non-admin user cannot create quality assessment -> AccessDeniedException")
    void testNonAdminCannotCreateAssessment() {
        CreateQualityAssessmentRequest request = new CreateQualityAssessmentRequest(
                10, 9, 8, 9, 8, 9, new BigDecimal("4.00"), "Notes"
        );

        when(userRepository.findById(2)).thenReturn(Optional.of(farmerUser1));

        assertThatThrownBy(() -> qualityAssessmentService.createAssessment(2, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("does not hold the ADMIN role");

        verify(qualityAssessmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Creating assessment on nonexistent harvest -> ResourceNotFoundException")
    void testCreateAssessmentHarvestNotFound() {
        CreateQualityAssessmentRequest request = new CreateQualityAssessmentRequest(
                999, 9, 8, 9, 8, 9, new BigDecimal("4.00"), "Notes"
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(adminUser));
        when(harvestRepository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> qualityAssessmentService.createAssessment(1, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Harvest not found with ID: 999");
    }

    @Test
    @DisplayName("Creating duplicate assessment on already assessed harvest -> DuplicateResourceException (409)")
    void testCreateDuplicateAssessmentFails() {
        CreateQualityAssessmentRequest request = new CreateQualityAssessmentRequest(
                10, 9, 8, 9, 8, 9, new BigDecimal("4.00"), "Notes"
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(adminUser));
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));
        when(qualityAssessmentRepository.existsByHarvest_HarvestId(10)).thenReturn(true);

        assertThatThrownBy(() -> qualityAssessmentService.createAssessment(1, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("already exists for harvest #10");

        verify(qualityAssessmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Admin can update assessment -> recalculates score & grade, resets status to PENDING")
    void testUpdateAssessmentRecalculates() {
        UpdateQualityAssessmentRequest request = new UpdateQualityAssessmentRequest(
                7, 7, 6, 7, 6, new BigDecimal("8.00"), "Downgraded due to storage delay"
        );

        when(userRepository.findById(1)).thenReturn(Optional.of(adminUser));
        when(qualityAssessmentRepository.findById(100)).thenReturn(Optional.of(existingAssessment));
        when(qualityAssessmentRepository.save(any(QualityAssessment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        QualityAssessmentResponse response = qualityAssessmentService.updateAssessment(1, 100, request);

        assertThat(response).isNotNull();
        assertThat(response.getQualityScore()).isEqualByComparingTo(new BigDecimal("66.00"));
        assertThat(response.getQualityGrade()).isEqualTo(QualityGrade.B);
        assertThat(response.getVerificationStatus()).isEqualTo(VerificationStatus.PENDING);
        assertThat(response.getInspectorNotes()).isEqualTo("Downgraded due to storage delay");
    }

    @Test
    @DisplayName("Admin can verify assessment -> status changes to VERIFIED")
    void testVerifyAssessment() {
        when(userRepository.findById(1)).thenReturn(Optional.of(adminUser));
        when(qualityAssessmentRepository.findById(100)).thenReturn(Optional.of(existingAssessment));
        when(qualityAssessmentRepository.save(any(QualityAssessment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        QualityAssessmentResponse response = qualityAssessmentService.verifyAssessment(1, 100);

        assertThat(response.getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
        assertThat(existingAssessment.getVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
    }

    @Test
    @DisplayName("Admin can reject assessment -> status changes to REJECTED")
    void testRejectAssessment() {
        when(userRepository.findById(1)).thenReturn(Optional.of(adminUser));
        when(qualityAssessmentRepository.findById(100)).thenReturn(Optional.of(existingAssessment));
        when(qualityAssessmentRepository.save(any(QualityAssessment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        QualityAssessmentResponse response = qualityAssessmentService.rejectAssessment(1, 100, "Severe rot detected");

        assertThat(response.getVerificationStatus()).isEqualTo(VerificationStatus.REJECTED);
        assertThat(existingAssessment.getVerificationStatus()).isEqualTo(VerificationStatus.REJECTED);
        assertThat(existingAssessment.getInspectorNotes()).isEqualTo("Severe rot detected");
    }

    @Test
    @DisplayName("Farmer can view own harvest quality -> success")
    void testFarmerCanViewOwnHarvestQuality() {
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));
        when(qualityAssessmentRepository.findByHarvest_HarvestId(10)).thenReturn(Optional.of(existingAssessment));

        Optional<QualityAssessmentResponse> result = qualityAssessmentService.getFarmerHarvestQuality(2, 10);

        assertThat(result).isPresent();
        assertThat(result.get().getHarvestId()).isEqualTo(10);
        assertThat(result.get().getFarmerId()).isEqualTo(2);
        assertThat(result.get().getQualityScore()).isEqualByComparingTo(new BigDecimal("86.00"));
    }

    @Test
    @DisplayName("Farmer cannot view another farmer's harvest quality -> AccessDeniedException (403)")
    void testFarmerCannotViewOtherFarmerQuality() {
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));

        // farmerUser2 (ID 3) attempts to view harvest1 owned by farmerUser1 (ID 2)
        assertThatThrownBy(() -> qualityAssessmentService.getFarmerHarvestQuality(3, 10))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("You do not have permission to view quality information for harvest #10");

        verify(qualityAssessmentRepository, never()).findByHarvest_HarvestId(any());
    }

    @Test
    @DisplayName("Farmer viewing unassessed harvest returns empty optional")
    void testFarmerViewingUnassessedHarvest() {
        when(harvestRepository.findById(10)).thenReturn(Optional.of(harvest1));
        when(qualityAssessmentRepository.findByHarvest_HarvestId(10)).thenReturn(Optional.empty());

        Optional<QualityAssessmentResponse> result = qualityAssessmentService.getFarmerHarvestQuality(2, 10);

        assertThat(result).isEmpty();
    }
}
