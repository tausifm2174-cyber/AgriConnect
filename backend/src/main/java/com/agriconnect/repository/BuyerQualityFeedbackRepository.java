package com.agriconnect.repository;

import com.agriconnect.entity.BuyerQualityFeedback;
import com.agriconnect.entity.FeedbackReviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BuyerQualityFeedbackRepository extends JpaRepository<BuyerQualityFeedback, Integer> {

    Optional<BuyerQualityFeedback> findByOrder_OrderId(Integer orderId);

    boolean existsByOrder_OrderId(Integer orderId);

    List<BuyerQualityFeedback> findByBuyer_UserIdOrderBySubmittedAtDesc(Integer buyerId);

    List<BuyerQualityFeedback> findByHarvest_HarvestIdOrderBySubmittedAtDesc(Integer harvestId);

    List<BuyerQualityFeedback> findByReviewStatusOrderBySubmittedAtDesc(FeedbackReviewStatus reviewStatus);

    List<BuyerQualityFeedback> findAllByOrderBySubmittedAtDesc();
}
