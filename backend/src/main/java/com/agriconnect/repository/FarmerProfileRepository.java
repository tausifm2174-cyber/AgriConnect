package com.agriconnect.repository;

import com.agriconnect.entity.FarmerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for 'farmer_profiles' table.
 */
@Repository
public interface FarmerProfileRepository extends JpaRepository<FarmerProfile, Integer> {
}
