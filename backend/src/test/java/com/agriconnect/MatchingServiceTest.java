package com.agriconnect;

import com.agriconnect.dto.BuyerRequirementMatchResponse;
import com.agriconnect.dto.MatchedHarvestDto;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.BuyerRequirementRepository;
import com.agriconnect.repository.QualityAssessmentRepository;
import com.agriconnect.repository.UserRepository;
import com.agriconnect.service.MatchingService;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchingServiceTest {

    @Mock
    private BuyerRequirementRepository requirementRepository;

    @Mock
    private QualityAssessmentRepository qualityAssessmentRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MatchingService matchingService;

    private User buyerUser1;
    private User buyerUser2;
    private User farmerUser;
    private User adminUser;
    private Crop tomatoCrop;
    private Crop wheatCrop;
    private BuyerRequirement openRequirementA;
    private Harvest harvest1;
    private QualityAssessment verifiedQualityA;

    @BeforeEach
    void setUp() {
        buyerUser1 = new User("Vikas Gupta", "vikas@freshmarts.com", "+919833344455", "hash", Role.BUYER, UserStatus.ACTIVE);
        buyerUser1.setUserId(5);

        buyerUser2 = new User("Priya Sharma", "priya@organics.in", "+919844455566", "hash", Role.BUYER, UserStatus.ACTIVE);
        buyerUser2.setUserId(6);

        farmerUser = new User("Rajesh Patel", "rajesh@kisan.in", "+919811122233", "hash", Role.FARMER, UserStatus.ACTIVE);
        farmerUser.setUserId(2);

        adminUser = new User("Ramesh Sharma", "admin@agriconnect.org", "+919876543210", "hash", Role.ADMIN, UserStatus.ACTIVE);
        adminUser.setUserId(1);

        tomatoCrop = new Crop("Tomato (Hybrid Red)", CropCategory.VEGETABLE, CropSeason.ALL_SEASON, "Tomatoes");
        tomatoCrop.setCropId(1);

        wheatCrop = new Crop("Wheat (Sharbati)", CropCategory.CEREAL, CropSeason.RABI, "Wheat");
        wheatCrop.setCropId(3);

        openRequirementA = new BuyerRequirement(
                buyerUser1,
                tomatoCrop,
                new BigDecimal("400.00"),
                new BigDecimal("27.00"),
                QualityGrade.A,
                "Nashik, Maharashtra",
                LocalDate.now().plusDays(10),
                RequirementStatus.OPEN
        );
        openRequirementA.setRequirementId(101);

        harvest1 = new Harvest(
                farmerUser,
                tomatoCrop,
                new BigDecimal("1000.00"),
                new BigDecimal("550.00"),
                new BigDecimal("26.00"),
                LocalDate.now().minusDays(3),
                "Nashik, Maharashtra",
                HarvestStatus.AVAILABLE
        );
        harvest1.setHarvestId(201);

        verifiedQualityA = new QualityAssessment(
                harvest1,
                adminUser,
                9, 9, 8, 9, 8,
                new BigDecimal("3.50"),
                new BigDecimal("92.50"),
                QualityGrade.A,
                VerificationStatus.VERIFIED,
                LocalDate.now().minusDays(2),
                "Premium quality harvest"
        );
        verifiedQualityA.setAssessmentId(301);
    }

    @Test
    @DisplayName("Unit: Valid match returns successfully with positive match score")
    void testValidMatch_Success() {
        when(userRepository.findById(5)).thenReturn(Optional.of(buyerUser1));
        when(requirementRepository.findById(101)).thenReturn(Optional.of(openRequirementA));
        when(qualityAssessmentRepository.findEligibleMatches(eq(1), any(), any(), eq(HarvestStatus.AVAILABLE), eq(VerificationStatus.VERIFIED), any()))
                .thenReturn(List.of(verifiedQualityA));

        BuyerRequirementMatchResponse response = matchingService.findMatchesForRequirement(5, 101, "best");

        assertThat(response).isNotNull();
        assertThat(response.getRequirementId()).isEqualTo(101);
        assertThat(response.getCropName()).isEqualTo("Tomato (Hybrid Red)");
        assertThat(response.getTotalMatches()).isEqualTo(1);

        MatchedHarvestDto match = response.getMatches().getFirst();
        assertThat(match.getHarvestId()).isEqualTo(201);
        assertThat(match.getFarmerName()).isEqualTo("Rajesh Patel");
        assertThat(match.getPricePerKg()).isEqualByComparingTo("26.00");
        assertThat(match.getQualityGrade()).isEqualTo(QualityGrade.A);
        assertThat(match.getQualityScore()).isEqualByComparingTo("92.50");
        assertThat(match.getQualityVerificationStatus()).isEqualTo(VerificationStatus.VERIFIED);
        assertThat(match.isLocationMatch()).isTrue();
        assertThat(match.getMatchScore()).isGreaterThan(0.0).isLessThanOrEqualTo(100.0);
    }

    @Test
    @DisplayName("Unit: Hard filter rejects wrong crop")
    void testWrongCrop_HardFilterRejects() {
        Harvest wrongCropHarvest = new Harvest(farmerUser, wheatCrop, new BigDecimal("1000.00"),
                new BigDecimal("550.00"), new BigDecimal("26.00"), LocalDate.now(), "Nashik", HarvestStatus.AVAILABLE);
        QualityAssessment qa = new QualityAssessment(wrongCropHarvest, adminUser, 9, 9, 9, 9, 9,
                BigDecimal.ZERO, new BigDecimal("95.00"), QualityGrade.A, VerificationStatus.VERIFIED, LocalDate.now(), "");

        boolean satisfied = matchingService.isHardFilterSatisfied(openRequirementA, wrongCropHarvest, qa);
        assertThat(satisfied).isFalse();
    }

    @Test
    @DisplayName("Unit: Hard filter rejects insufficient quantity")
    void testInsufficientQuantity_HardFilterRejects() {
        Harvest lowQtyHarvest = new Harvest(farmerUser, tomatoCrop, new BigDecimal("1000.00"),
                new BigDecimal("300.00"), // required is 400.00
                new BigDecimal("26.00"), LocalDate.now(), "Nashik", HarvestStatus.AVAILABLE);
        QualityAssessment qa = new QualityAssessment(lowQtyHarvest, adminUser, 9, 9, 9, 9, 9,
                BigDecimal.ZERO, new BigDecimal("95.00"), QualityGrade.A, VerificationStatus.VERIFIED, LocalDate.now(), "");

        boolean satisfied = matchingService.isHardFilterSatisfied(openRequirementA, lowQtyHarvest, qa);
        assertThat(satisfied).isFalse();
    }

    @Test
    @DisplayName("Unit: Hard filter rejects price exceeding buyer max price")
    void testPriceTooHigh_HardFilterRejects() {
        Harvest expensiveHarvest = new Harvest(farmerUser, tomatoCrop, new BigDecimal("1000.00"),
                new BigDecimal("550.00"),
                new BigDecimal("28.00"), // max is 27.00
                LocalDate.now(), "Nashik", HarvestStatus.AVAILABLE);
        QualityAssessment qa = new QualityAssessment(expensiveHarvest, adminUser, 9, 9, 9, 9, 9,
                BigDecimal.ZERO, new BigDecimal("95.00"), QualityGrade.A, VerificationStatus.VERIFIED, LocalDate.now(), "");

        boolean satisfied = matchingService.isHardFilterSatisfied(openRequirementA, expensiveHarvest, qa);
        assertThat(satisfied).isFalse();
    }

    @Test
    @DisplayName("Unit: Hard filter rejects PENDING quality status")
    void testPendingQuality_HardFilterRejects() {
        QualityAssessment pendingQa = new QualityAssessment(harvest1, adminUser, 9, 9, 9, 9, 9,
                BigDecimal.ZERO, new BigDecimal("95.00"), QualityGrade.A, VerificationStatus.PENDING, LocalDate.now(), "");

        boolean satisfied = matchingService.isHardFilterSatisfied(openRequirementA, harvest1, pendingQa);
        assertThat(satisfied).isFalse();
    }

    @Test
    @DisplayName("Unit: Hard filter rejects REJECTED quality status")
    void testRejectedQuality_HardFilterRejects() {
        QualityAssessment rejectedQa = new QualityAssessment(harvest1, adminUser, 9, 9, 9, 9, 9,
                BigDecimal.ZERO, new BigDecimal("95.00"), QualityGrade.A, VerificationStatus.REJECTED, LocalDate.now(), "");

        boolean satisfied = matchingService.isHardFilterSatisfied(openRequirementA, harvest1, rejectedQa);
        assertThat(satisfied).isFalse();
    }

    @Test
    @DisplayName("Unit: Quality Grade A requirement rejects Grade B harvest")
    void testRequirementA_RejectsGradeB() {
        QualityAssessment gradeBQa = new QualityAssessment(harvest1, adminUser, 8, 7, 7, 7, 7,
                new BigDecimal("5.00"), new BigDecimal("72.00"), QualityGrade.B, VerificationStatus.VERIFIED, LocalDate.now(), "");

        boolean satisfied = matchingService.isHardFilterSatisfied(openRequirementA, harvest1, gradeBQa);
        assertThat(satisfied).isFalse();
    }

    @Test
    @DisplayName("Unit: Quality Grade B requirement accepts Grade A and Grade B, rejects Grade C")
    void testRequirementB_AcceptsAAndB_RejectsC() {
        BuyerRequirement reqGradeB = new BuyerRequirement(
                buyerUser1, tomatoCrop, new BigDecimal("400.00"), new BigDecimal("30.00"),
                QualityGrade.B, "Nashik", LocalDate.now().plusDays(10), RequirementStatus.OPEN
        );

        QualityGrade gradeA = QualityGrade.A;
        QualityGrade gradeB = QualityGrade.B;
        QualityGrade gradeC = QualityGrade.C;

        assertThat(gradeA.satisfiesMinimum(reqGradeB.getMinQualityGrade())).isTrue();
        assertThat(gradeB.satisfiesMinimum(reqGradeB.getMinQualityGrade())).isTrue();
        assertThat(gradeC.satisfiesMinimum(reqGradeB.getMinQualityGrade())).isFalse();

        List<QualityGrade> acceptable = QualityGrade.getAcceptableGrades(QualityGrade.B);
        assertThat(acceptable).containsExactlyInAnyOrder(QualityGrade.A, QualityGrade.B);
    }

    @Test
    @DisplayName("Unit: Quality Grade C requirement accepts Grade A, Grade B, and Grade C")
    void testRequirementC_AcceptsAllGrades() {
        List<QualityGrade> acceptable = QualityGrade.getAcceptableGrades(QualityGrade.C);
        assertThat(acceptable).containsExactlyInAnyOrder(QualityGrade.A, QualityGrade.B, QualityGrade.C);

        assertThat(QualityGrade.A.satisfiesMinimum(QualityGrade.C)).isTrue();
        assertThat(QualityGrade.B.satisfiesMinimum(QualityGrade.C)).isTrue();
        assertThat(QualityGrade.C.satisfiesMinimum(QualityGrade.C)).isTrue();
    }

    @Test
    @DisplayName("Unit: Expired requirement throws BadRequestException and auto-updates status")
    void testExpiredRequirement_ThrowsBadRequest() {
        openRequirementA.setRequiredByDate(LocalDate.now().minusDays(1)); // past date
        when(userRepository.findById(5)).thenReturn(Optional.of(buyerUser1));
        when(requirementRepository.findById(101)).thenReturn(Optional.of(openRequirementA));

        assertThatThrownBy(() -> matchingService.findMatchesForRequirement(5, 101, "best"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("EXPIRED");

        verify(requirementRepository).save(argThat(r -> r.getStatus() == RequirementStatus.EXPIRED));
    }

    @Test
    @DisplayName("Unit: Cancelled requirement throws BadRequestException")
    void testCancelledRequirement_ThrowsBadRequest() {
        openRequirementA.setStatus(RequirementStatus.CANCELLED);
        when(userRepository.findById(5)).thenReturn(Optional.of(buyerUser1));
        when(requirementRepository.findById(101)).thenReturn(Optional.of(openRequirementA));

        assertThatThrownBy(() -> matchingService.findMatchesForRequirement(5, 101, "best"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("CANCELLED");
    }

    @Test
    @DisplayName("Unit: Ownership protection throws AccessDeniedException when another buyer accesses matches")
    void testOwnershipProtection_ThrowsAccessDenied() {
        when(userRepository.findById(6)).thenReturn(Optional.of(buyerUser2)); // Buyer 6
        when(requirementRepository.findById(101)).thenReturn(Optional.of(openRequirementA)); // Owned by Buyer 5

        assertThatThrownBy(() -> matchingService.findMatchesForRequirement(6, 101, "best"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("Unit: Non-buyer role throws AccessDeniedException")
    void testNonBuyerRole_ThrowsAccessDenied() {
        when(userRepository.findById(2)).thenReturn(Optional.of(farmerUser));

        assertThatThrownBy(() -> matchingService.findMatchesForRequirement(2, 101, "best"))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Only users with ROLE_BUYER");
    }

    @Test
    @DisplayName("Unit: Match score components and boundary testing")
    void testScoreCalculation_Boundaries() {
        BigDecimal maxPrice = new BigDecimal("30.00");

        // Price Score: at maxPrice -> baseline 10.0
        double priceAtMax = matchingService.calculatePriceScore(new BigDecimal("30.00"), maxPrice);
        assertThat(priceAtMax).isEqualTo(10.0);

        // Price Score: at 50% discount -> 10.0 + 0.5 * 20.0 = 20.0
        double priceDiscount = matchingService.calculatePriceScore(new BigDecimal("15.00"), maxPrice);
        assertThat(priceDiscount).isEqualTo(20.0);

        // Price Score: exceeds maxPrice -> 0.0
        double priceExceeds = matchingService.calculatePriceScore(new BigDecimal("35.00"), maxPrice);
        assertThat(priceExceeds).isEqualTo(0.0);

        // Quality Score: 100 -> 30.0
        double quality100 = matchingService.calculateQualityScore(new BigDecimal("100.00"));
        assertThat(quality100).isEqualTo(30.0);

        // Quality Score: 80 -> 24.0
        double quality80 = matchingService.calculateQualityScore(new BigDecimal("80.00"));
        assertThat(quality80).isEqualTo(24.0);

        // Quality Score: 60 -> 18.0
        double quality60 = matchingService.calculateQualityScore(new BigDecimal("60.00"));
        assertThat(quality60).isEqualTo(18.0);

        // Quantity Score: available == required -> 10.0
        double qtyEqual = matchingService.calculateQuantityScore(new BigDecimal("400.00"), new BigDecimal("400.00"));
        assertThat(qtyEqual).isEqualTo(10.0);

        // Quantity Score: available == 1.5 * required -> 15.0
        double qty1_5 = matchingService.calculateQuantityScore(new BigDecimal("600.00"), new BigDecimal("400.00"));
        assertThat(qty1_5).isEqualTo(15.0);

        // Quantity Score: available >= 2.0 * required -> 20.0
        double qty2_0 = matchingService.calculateQuantityScore(new BigDecimal("1000.00"), new BigDecimal("400.00"));
        assertThat(qty2_0).isEqualTo(20.0);

        // Location Score: match -> 20.0, different -> 10.0, no preference -> 15.0
        double locSame = matchingService.calculateLocationScore("Nashik, Maharashtra", "Nashik, Maharashtra");
        assertThat(locSame).isEqualTo(20.0);

        double locDiff = matchingService.calculateLocationScore("Pune, Maharashtra", "Amritsar, Punjab");
        assertThat(locDiff).isEqualTo(10.0);

        double locNone = matchingService.calculateLocationScore("Nashik, Maharashtra", null);
        assertThat(locNone).isEqualTo(15.0);

        // Total score boundaries: 0 <= total <= 100
        double totalPerfect = matchingService.calculateTotalScore(30.0, 30.0, 20.0, 20.0);
        assertThat(totalPerfect).isEqualTo(100.0);

        double totalZero = matchingService.calculateTotalScore(0.0, 0.0, 0.0, 0.0);
        assertThat(totalZero).isEqualTo(0.0);
    }

    @Test
    @DisplayName("Unit: Ranking order sorts by matchScore DESC, qualityScore DESC, price ASC, quantity DESC")
    void testRankingOrder_Deterministic() {
        Harvest h2 = new Harvest(farmerUser, tomatoCrop, new BigDecimal("1000.00"),
                new BigDecimal("600.00"), new BigDecimal("25.00"), LocalDate.now(), "Nashik", HarvestStatus.AVAILABLE);
        h2.setHarvestId(202);
        QualityAssessment qa2 = new QualityAssessment(h2, adminUser, 10, 10, 10, 10, 10,
                BigDecimal.ZERO, new BigDecimal("98.00"), QualityGrade.A, VerificationStatus.VERIFIED, LocalDate.now(), "");
        qa2.setAssessmentId(302);

        when(userRepository.findById(5)).thenReturn(Optional.of(buyerUser1));
        when(requirementRepository.findById(101)).thenReturn(Optional.of(openRequirementA));
        // Return qa1 (score ~88.75) and qa2 (score ~97.41)
        when(qualityAssessmentRepository.findEligibleMatches(any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of(verifiedQualityA, qa2));

        BuyerRequirementMatchResponse response = matchingService.findMatchesForRequirement(5, 101, "best");

        assertThat(response.getTotalMatches()).isEqualTo(2);
        // Candidate 2 (qa2) has higher quality and lower price, so its match score is higher -> ranks first
        assertThat(response.getMatches().get(0).getHarvestId()).isEqualTo(202);
        assertThat(response.getMatches().get(1).getHarvestId()).isEqualTo(201);
        assertThat(response.getMatches().get(0).getMatchScore()).isGreaterThanOrEqualTo(response.getMatches().get(1).getMatchScore());
    }

    @Test
    @DisplayName("Unit: Empty matches list when no eligible harvests pass hard criteria")
    void testNoMatches_ReturnsEmptyListWithTotalZero() {
        when(userRepository.findById(5)).thenReturn(Optional.of(buyerUser1));
        when(requirementRepository.findById(101)).thenReturn(Optional.of(openRequirementA));
        when(qualityAssessmentRepository.findEligibleMatches(any(), any(), any(), any(), any(), any()))
                .thenReturn(List.of());

        BuyerRequirementMatchResponse response = matchingService.findMatchesForRequirement(5, 101, "best");

        assertThat(response.getTotalMatches()).isEqualTo(0);
        assertThat(response.getMatches()).isEmpty();
    }
}
