package com.agriconnect.dto;

import com.agriconnect.entity.BuyerQualityFeedback;
import com.agriconnect.entity.FeedbackIssueType;
import com.agriconnect.entity.FeedbackReviewStatus;

import java.time.LocalDateTime;

public class BuyerQualityFeedbackResponse {

    private Integer feedbackId;
    private Integer orderId;
    private Integer buyerId;
    private String buyerName;
    private Integer harvestId;
    private String cropName;
    private Integer qualityAssessmentId;
    private Integer rating;
    private FeedbackIssueType issueType;
    private String comments;
    private FeedbackReviewStatus reviewStatus;
    private LocalDateTime submittedAt;

    public BuyerQualityFeedbackResponse() {
    }

    public BuyerQualityFeedbackResponse(BuyerQualityFeedback feedback) {
        if (feedback != null) {
            this.feedbackId = feedback.getFeedbackId();
            if (feedback.getOrder() != null) {
                this.orderId = feedback.getOrder().getOrderId();
            }
            if (feedback.getBuyer() != null) {
                this.buyerId = feedback.getBuyer().getUserId();
                this.buyerName = feedback.getBuyer().getFullName();
            }
            if (feedback.getHarvest() != null) {
                this.harvestId = feedback.getHarvest().getHarvestId();
                if (feedback.getHarvest().getCrop() != null) {
                    this.cropName = feedback.getHarvest().getCrop().getCropName();
                }
            }
            if (feedback.getQualityAssessment() != null) {
                this.qualityAssessmentId = feedback.getQualityAssessment().getAssessmentId();
            }
            this.rating = feedback.getRating();
            this.issueType = feedback.getIssueType();
            this.comments = feedback.getComments();
            this.reviewStatus = feedback.getReviewStatus();
            this.submittedAt = feedback.getSubmittedAt();
        }
    }

    public Integer getFeedbackId() {
        return feedbackId;
    }

    public void setFeedbackId(Integer feedbackId) {
        this.feedbackId = feedbackId;
    }

    public Integer getOrderId() {
        return orderId;
    }

    public void setOrderId(Integer orderId) {
        this.orderId = orderId;
    }

    public Integer getBuyerId() {
        return buyerId;
    }

    public void setBuyerId(Integer buyerId) {
        this.buyerId = buyerId;
    }

    public String getBuyerName() {
        return buyerName;
    }

    public void setBuyerName(String buyerName) {
        this.buyerName = buyerName;
    }

    public Integer getHarvestId() {
        return harvestId;
    }

    public void setHarvestId(Integer harvestId) {
        this.harvestId = harvestId;
    }

    public String getCropName() {
        return cropName;
    }

    public void setCropName(String cropName) {
        this.cropName = cropName;
    }

    public Integer getQualityAssessmentId() {
        return qualityAssessmentId;
    }

    public void setQualityAssessmentId(Integer qualityAssessmentId) {
        this.qualityAssessmentId = qualityAssessmentId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public FeedbackIssueType getIssueType() {
        return issueType;
    }

    public void setIssueType(FeedbackIssueType issueType) {
        this.issueType = issueType;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public FeedbackReviewStatus getReviewStatus() {
        return reviewStatus;
    }

    public void setReviewStatus(FeedbackReviewStatus reviewStatus) {
        this.reviewStatus = reviewStatus;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
}
