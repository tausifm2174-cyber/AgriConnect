package com.agriconnect.repository;

import com.agriconnect.entity.BuyerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Spring Data JPA repository for 'buyer_profiles' table.
 */
@Repository
public interface BuyerProfileRepository extends JpaRepository<BuyerProfile, Integer> {
}
