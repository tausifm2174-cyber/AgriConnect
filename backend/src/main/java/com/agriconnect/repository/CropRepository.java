package com.agriconnect.repository;

import com.agriconnect.entity.Crop;
import com.agriconnect.entity.CropCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for standard crop catalog.
 */
@Repository
public interface CropRepository extends JpaRepository<Crop, Integer> {

    List<Crop> findAllByOrderByCropNameAsc();

    Optional<Crop> findByCropNameIgnoreCase(String cropName);

    List<Crop> findByCategoryOrderByCropNameAsc(CropCategory category);
}
