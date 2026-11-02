package com.agriconnect.dto;

/**
 * Detailed composite response for an administrative harvest inspection,
 * containing full harvest parameters alongside any existing quality assessment.
 */
public class HarvestQualityDetailResponse {

    private HarvestResponse harvest;
    private QualityAssessmentResponse assessment;

    public HarvestQualityDetailResponse() {
    }

    public HarvestQualityDetailResponse(HarvestResponse harvest, QualityAssessmentResponse assessment) {
        this.harvest = harvest;
        this.assessment = assessment;
    }

    public HarvestResponse getHarvest() {
        return harvest;
    }

    public void setHarvest(HarvestResponse harvest) {
        this.harvest = harvest;
    }

    public QualityAssessmentResponse getAssessment() {
        return assessment;
    }

    public void setAssessment(QualityAssessmentResponse assessment) {
        this.assessment = assessment;
    }
}
