package com.agriconnect.repository;

import com.agriconnect.entity.QualityReassessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QualityReassessmentRepository extends JpaRepository<QualityReassessment, Integer> {

    List<QualityReassessment> findByQualityAssessment_AssessmentIdOrderByInspectedAtDesc(Integer assessmentId);

    List<QualityReassessment> findByHarvest_HarvestIdOrderByInspectedAtDesc(Integer harvestId);

    List<QualityReassessment> findAllByOrderByInspectedAtDesc();
}
