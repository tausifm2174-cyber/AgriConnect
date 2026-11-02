package com.agriconnect.service;

import com.agriconnect.dto.CropResponse;
import com.agriconnect.entity.Crop;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.CropRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service managing agricultural crops catalog.
 */
@Service
@Transactional(readOnly = true)
public class CropService {

    private final CropRepository cropRepository;

    public CropService(CropRepository cropRepository) {
        this.cropRepository = cropRepository;
    }

    public List<CropResponse> getAllCrops() {
        return cropRepository.findAllByOrderByCropNameAsc()
                .stream()
                .map(CropResponse::new)
                .toList();
    }

    public CropResponse getCropById(Integer cropId) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with ID: " + cropId));
        return new CropResponse(crop);
    }
}
