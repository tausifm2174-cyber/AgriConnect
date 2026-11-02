package com.agriconnect.repository;

import com.agriconnect.entity.Harvest;
import com.agriconnect.entity.HarvestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for farmer harvests.
 */
@Repository
public interface HarvestRepository extends JpaRepository<Harvest, Integer> {

    List<Harvest> findByFarmer_UserIdOrderByCreatedAtDesc(Integer farmerUserId);

    Optional<Harvest> findByHarvestIdAndFarmer_UserId(Integer harvestId, Integer farmerUserId);

    long countByFarmer_UserId(Integer farmerUserId);

    long countByFarmer_UserIdAndStatus(Integer farmerUserId, HarvestStatus status);

    /**
     * Checks if orders reference this harvest without prematurely instantiating Order entities,
     * maintaining clean Phase boundaries while preserving foreign key integrity.
     */
    @Query(value = "SELECT COUNT(*) FROM orders WHERE harvest_id = :harvestId", nativeQuery = true)
    long countOrdersByHarvestId(@Param("harvestId") Integer harvestId);
}
