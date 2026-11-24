package com.agriconnect.dto;

import com.agriconnect.entity.FeedbackIssueType;
import jakarta.validation.constraints.*;

public class SubmitBuyerFeedbackRequest {

    @NotNull(message = "Quality rating is required.")
    @Min(value = 1, message = "Rating must be at least 1.")
    @Max(value = 5, message = "Rating cannot exceed 5.")
    private Integer rating;

    @NotNull(message = "Issue type classification is required.")
    private FeedbackIssueType issueType;

    @NotBlank(message = "Feedback comments are required.")
    @Size(max = 500, message = "Comments cannot exceed 500 characters.")
    private String comments;

    public SubmitBuyerFeedbackRequest() {
    }

    public SubmitBuyerFeedbackRequest(Integer rating, FeedbackIssueType issueType, String comments) {
        this.rating = rating;
        this.issueType = issueType;
        this.comments = comments;
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
}
