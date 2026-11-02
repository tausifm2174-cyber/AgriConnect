package com.agriconnect.repository;

import com.agriconnect.entity.HarvestStatus;
import com.agriconnect.entity.QualityAssessment;
import com.agriconnect.entity.QualityGrade;
import com.agriconnect.entity.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for Quality Assessments.
 * Supports assessment lookup by harvest, verification status filtering, count metrics,
 * and high-performance relational matching queries for the matching engine.
 */
@Repository
public interface QualityAssessmentRepository extends JpaRepository<QualityAssessment, Integer> {

    Optional<QualityAssessment> findByHarvest_HarvestId(Integer harvestId);

    boolean existsByHarvest_HarvestId(Integer harvestId);

    List<QualityAssessment> findByVerificationStatusOrderByAssessmentDateDesc(VerificationStatus verificationStatus);

    List<QualityAssessment> findAllByOrderByCreatedAtDesc();

    long countByVerificationStatus(VerificationStatus verificationStatus);

    /**
     * Efficient relational query for Phase 7 Quality-Aware Matching Engine.
     * Joins QualityAssessment -> Harvest -> Crop -> Farmer, filtering at the database layer by:
     * - Crop match (h.crop.cropId = :cropId)
     * - Available quantity >= required quantity (> 0)
     * - Price per kg <= buyer maximum price
     * - Harvest status = AVAILABLE
     * - Quality assessment verification status = VERIFIED
     * - Quality grade IN acceptable grades based on buyer minimum grade (A, B, C)
     */
    @Query("SELECT qa FROM QualityAssessment qa " +
           "JOIN FETCH qa.harvest h " +
           "JOIN FETCH h.crop c " +
           "JOIN FETCH h.farmer f " +
           "WHERE h.crop.cropId = :cropId " +
           "  AND h.availableQuantity >= :requiredQuantity " +
           "  AND h.availableQuantity > 0 " +
           "  AND h.pricePerKg <= :maxPricePerKg " +
           "  AND h.status = :harvestStatus " +
           "  AND qa.verificationStatus = :verificationStatus " +
           "  AND qa.qualityGrade IN :acceptableGrades")
    List<QualityAssessment> findEligibleMatches(
            @Param("cropId") Integer cropId,
            @Param("requiredQuantity") BigDecimal requiredQuantity,
            @Param("maxPricePerKg") BigDecimal maxPricePerKg,
            @Param("harvestStatus") HarvestStatus harvestStatus,
            @Param("verificationStatus") VerificationStatus verificationStatus,
            @Param("acceptableGrades") Collection<QualityGrade> acceptableGrades
    );
}
