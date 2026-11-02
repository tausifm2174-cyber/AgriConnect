package com.agriconnect.repository;

import com.agriconnect.entity.BuyerRequirement;
import com.agriconnect.entity.RequirementStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for BuyerRequirement entity.
 * Provides ownership-aware and status-filtered queries on 'buyer_requirements' table.
 */
@Repository
public interface BuyerRequirementRepository extends JpaRepository<BuyerRequirement, Integer> {

    /**
     * Retrieve all buyer requirements for a specific buyer, newest first.
     */
    List<BuyerRequirement> findByBuyer_UserIdOrderByCreatedAtDesc(Integer buyerUserId);

    /**
     * Retrieve buyer requirements for a specific buyer filtered by status, newest first.
     */
    List<BuyerRequirement> findByBuyer_UserIdAndStatusOrderByCreatedAtDesc(Integer buyerUserId, RequirementStatus status);

    /**
     * Find a specific requirement ensuring ownership match.
     */
    Optional<BuyerRequirement> findByRequirementIdAndBuyer_UserId(Integer requirementId, Integer buyerUserId);

    /**
     * Count total requirements posted by a buyer.
     */
    long countByBuyer_UserId(Integer buyerUserId);

    /**
     * Count requirements posted by a buyer with a specific status.
     */
    long countByBuyer_UserIdAndStatus(Integer buyerUserId, RequirementStatus status);

    /**
     * Find all requirements across buyers by status (e.g. for matching engine in future phases).
     */
    List<BuyerRequirement> findByStatusOrderByCreatedAtDesc(RequirementStatus status);
}
