package com.agriconnect.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing post-delivery quality feedback and complaints submitted by buyers.
 * Associated 1:1 with delivered orders, providing evidence for administrative quality reassessments.
 */
@Entity
@Table(name = "buyer_quality_feedback")
public class BuyerQualityFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "feedback_id")
    private Integer feedbackId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false, unique = true)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "harvest_id", nullable = false)
    private Harvest harvest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quality_assessment_id")
    private QualityAssessment qualityAssessment;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", nullable = false)
    private FeedbackIssueType issueType;

    @Column(name = "comments", nullable = false, length = 500)
    private String comments;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false)
    private FeedbackReviewStatus reviewStatus = FeedbackReviewStatus.PENDING_REVIEW;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    public BuyerQualityFeedback() {
    }

    public BuyerQualityFeedback(Order order, User buyer, Harvest harvest, QualityAssessment qualityAssessment,
                                Integer rating, FeedbackIssueType issueType, String comments) {
        this.order = order;
        this.buyer = buyer;
        this.harvest = harvest;
        this.qualityAssessment = qualityAssessment;
        this.rating = rating;
        this.issueType = issueType;
        this.comments = comments;
        this.reviewStatus = FeedbackReviewStatus.PENDING_REVIEW;
        this.submittedAt = LocalDateTime.now();
    }

    public Integer getFeedbackId() {
        return feedbackId;
    }

    public void setFeedbackId(Integer feedbackId) {
        this.feedbackId = feedbackId;
    }

    public Order getOrder() {
        return order;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public User getBuyer() {
        return buyer;
    }

    public void setBuyer(User buyer) {
        this.buyer = buyer;
    }

    public Harvest getHarvest() {
        return harvest;
    }

    public void setHarvest(Harvest harvest) {
        this.harvest = harvest;
    }

    public QualityAssessment getQualityAssessment() {
        return qualityAssessment;
    }

    public void setQualityAssessment(QualityAssessment qualityAssessment) {
        this.qualityAssessment = qualityAssessment;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
