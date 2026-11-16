package com.agriconnect.service;

import com.agriconnect.dto.CropPriceAnalyticsResponse;
import com.agriconnect.dto.MarketplacePriceSummaryResponse;
import com.agriconnect.dto.PriceHistoryResponse;
import com.agriconnect.dto.PriceTrendPoint;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.PriceHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Service orchestrating price history capture, role-based querying,
 * and academic DBMS aggregation analytics (Phase 11).
 */
@Service
public class PriceHistoryService {

    private static final Logger log = LoggerFactory.getLogger(PriceHistoryService.class);

    private final PriceHistoryRepository priceHistoryRepository;
    private final CropRepository cropRepository;
    private final FarmerProfileRepository farmerProfileRepository;

    public PriceHistoryService(PriceHistoryRepository priceHistoryRepository,
                               CropRepository cropRepository,
                               FarmerProfileRepository farmerProfileRepository) {
        this.priceHistoryRepository = priceHistoryRepository;
        this.cropRepository = cropRepository;
        this.farmerProfileRepository = farmerProfileRepository;
    }

    /**
     * Idempotently records a commercial transaction price history entry upon successful payment settlement.
     * Enforces duplicate prevention via Order ID uniqueness.
     */
    @Transactional
    public PriceHistoryResponse recordPriceForCompletedOrder(Order order) {
        if (order == null || order.getOrderId() == null) {
            log.warn("Cannot record price history: Order is null or lacks order ID.");
            return null;
        }

        // Idempotency check: if order already recorded, return existing entry
        if (priceHistoryRepository.existsByOrder_OrderId(order.getOrderId())) {
            log.info("Price history already recorded for Order #{}. Returning existing entry.", order.getOrderId());
            return priceHistoryRepository.findByOrder_OrderId(order.getOrderId())
                    .map(PriceHistoryResponse::fromEntity)
                    .orElse(null);
        }

        // Ensure order is not cancelled or rejected
        if (order.getOrderStatus() == OrderStatus.CANCELLED || order.getOrderStatus() == OrderStatus.REJECTED) {
            log.warn("Will not record price history for Order #{} due to terminal status {}",
                    order.getOrderId(), order.getOrderStatus());
            return null;
        }

        Harvest harvest = order.getHarvest();
        Crop crop = (harvest != null) ? harvest.getCrop() : null;
        if (crop == null) {
            log.warn("Cannot record price history for Order #{}: Associated crop could not be determined.", order.getOrderId());
            return null;
        }

        User farmer = (harvest != null) ? harvest.getFarmer() : null;
        User buyer = order.getBuyer();
        BigDecimal unitPrice = order.getAgreedPricePerKg();
        BigDecimal quantity = order.getQuantity();
        BigDecimal totalAmount = order.getTotalAmount();

        // Derive market location from farmer profile or default
        String marketLocation = "Direct Farm";
        if (farmer != null && farmer.getUserId() != null) {
            marketLocation = farmerProfileRepository.findById(farmer.getUserId())
                    .map(FarmerProfile::getFarmLocation)
                    .orElse("Direct Farm");
        }

        PriceHistory priceHistory = new PriceHistory(
                crop,
                PriceSourceType.TRANSACTION_SALE,
                order,
                farmer,
                buyer,
                quantity,
                unitPrice,
                totalAmount,
                unitPrice, // modal price
                unitPrice, // min price
                unitPrice, // max price
                marketLocation,
                LocalDate.now()
        );

        PriceHistory saved = priceHistoryRepository.save(priceHistory);
        log.info("Successfully recorded PriceHistory #{} for Order #{} (Crop: {}, Unit Price: ₹{}, Qty: {} kg)",
                saved.getPriceId(), order.getOrderId(), crop.getCropName(), unitPrice, quantity);

        return PriceHistoryResponse.fromEntity(saved);
    }

    /**
     * Retrieve historical sales records for a farmer with optional crop and date filters.
     */
    @Transactional(readOnly = true)
    public List<PriceHistoryResponse> getFarmerPriceHistory(Integer farmerUserId, Integer cropId,
                                                           LocalDate startDate, LocalDate endDate) {
        List<PriceHistory> records;

        boolean hasCrop = cropId != null && cropId > 0;
        boolean hasDateRange = startDate != null && endDate != null;

        if (hasCrop && hasDateRange) {
            records = priceHistoryRepository.findByFarmer_UserIdAndCrop_CropIdAndRecordedDateBetweenOrderByRecordedDateDesc(
                    farmerUserId, cropId, startDate, endDate);
        } else if (hasCrop) {
            records = priceHistoryRepository.findByFarmer_UserIdAndCrop_CropIdOrderByRecordedDateDesc(
                    farmerUserId, cropId);
        } else if (hasDateRange) {
            records = priceHistoryRepository.findByFarmer_UserIdAndRecordedDateBetweenOrderByRecordedDateDesc(
                    farmerUserId, startDate, endDate);
        } else {
            records = priceHistoryRepository.findByFarmer_UserIdOrderByRecordedDateDesc(farmerUserId);
        }

        return records.stream().map(PriceHistoryResponse::fromEntity).toList();
    }

    /**
     * Retrieve price history for buyers with optional crop and date filters.
     */
    @Transactional(readOnly = true)
    public List<PriceHistoryResponse> getBuyerPriceHistory(Integer cropId, LocalDate startDate, LocalDate endDate) {
        List<PriceHistory> records;

        boolean hasCrop = cropId != null && cropId > 0;
        boolean hasDateRange = startDate != null && endDate != null;

        if (hasCrop && hasDateRange) {
            records = priceHistoryRepository.findByCrop_CropIdAndRecordedDateBetweenOrderByRecordedDateDesc(
                    cropId, startDate, endDate);
        } else if (hasCrop) {
            records = priceHistoryRepository.findByCrop_CropIdOrderByRecordedDateDesc(cropId);
        } else {
            records = priceHistoryRepository.findAllByOrderByRecordedDateDesc();
        }

        return records.stream().map(PriceHistoryResponse::fromEntity).toList();
    }

    /**
     * Retrieve all price history records for Admin with flexible filtering.
     */
    @Transactional(readOnly = true)
    public List<PriceHistoryResponse> getAllPriceHistory(Integer cropId, PriceSourceType sourceType,
                                                        LocalDate startDate, LocalDate endDate) {
        List<PriceHistory> records;

        boolean hasCrop = cropId != null && cropId > 0;
        boolean hasSource = sourceType != null;
        boolean hasDateRange = startDate != null && endDate != null;

        if (hasCrop && hasDateRange) {
            records = priceHistoryRepository.findByCrop_CropIdAndRecordedDateBetweenOrderByRecordedDateDesc(
                    cropId, startDate, endDate);
            if (hasSource) {
                records = records.stream().filter(r -> r.getSourceType() == sourceType).toList();
            }
        } else if (hasCrop && hasSource) {
            records = priceHistoryRepository.findByCrop_CropIdAndSourceTypeOrderByRecordedDateDesc(cropId, sourceType);
        } else if (hasCrop) {
            records = priceHistoryRepository.findByCrop_CropIdOrderByRecordedDateDesc(cropId);
        } else if (hasSource) {
            records = priceHistoryRepository.findBySourceTypeOrderByRecordedDateDesc(sourceType);
        } else {
            records = priceHistoryRepository.findAllByOrderByRecordedDateDesc();
        }

        return records.stream().map(PriceHistoryResponse::fromEntity).toList();
    }

    /**
     * Retrieve price history records for a specific crop.
     */
    @Transactional(readOnly = true)
    public List<PriceHistoryResponse> getCropPriceHistory(Integer cropId, LocalDate startDate, LocalDate endDate) {
        if (cropId == null) {
            throw new BadRequestException("Crop ID is required.");
        }
        if (!cropRepository.existsById(cropId)) {
            throw new ResourceNotFoundException("Crop not found with ID: " + cropId);
        }

        List<PriceHistory> records;
        if (startDate != null && endDate != null) {
            records = priceHistoryRepository.findByCrop_CropIdAndRecordedDateBetweenOrderByRecordedDateDesc(
                    cropId, startDate, endDate);
        } else {
            records = priceHistoryRepository.findByCrop_CropIdOrderByRecordedDateDesc(cropId);
        }

        return records.stream().map(PriceHistoryResponse::fromEntity).toList();
    }

    /**
     * Computes academic DBMS aggregation analytics for a specific crop:
     * AVG, MIN, MAX, SUM(quantity), COUNT, trend classification, and time-series points.
     */
    @Transactional(readOnly = true)
    public CropPriceAnalyticsResponse getCropAnalytics(Integer cropId, LocalDate startDate, LocalDate endDate) {
        Crop crop = cropRepository.findById(cropId)
                .orElseThrow(() -> new ResourceNotFoundException("Crop not found with ID: " + cropId));

        boolean hasDateRange = startDate != null && endDate != null;

        BigDecimal avgPrice = hasDateRange
                ? priceHistoryRepository.findAveragePriceByCropIdAndDateRange(cropId, startDate, endDate)
                : priceHistoryRepository.findAveragePriceByCropId(cropId);

        BigDecimal minPrice = hasDateRange
                ? priceHistoryRepository.findMinPriceByCropIdAndDateRange(cropId, startDate, endDate)
                : priceHistoryRepository.findMinPriceByCropId(cropId);

        BigDecimal maxPrice = hasDateRange
                ? priceHistoryRepository.findMaxPriceByCropIdAndDateRange(cropId, startDate, endDate)
                : priceHistoryRepository.findMaxPriceByCropId(cropId);

        BigDecimal totalQty = hasDateRange
                ? priceHistoryRepository.findTotalQuantityByCropIdAndDateRange(cropId, startDate, endDate)
                : priceHistoryRepository.findTotalQuantityByCropId(cropId);

        long count = hasDateRange
                ? priceHistoryRepository.countByCropIdAndDateRange(cropId, startDate, endDate)
                : priceHistoryRepository.countByCropId(cropId);

        // Fetch recent records for trendline
        List<PriceHistory> historyRecords;
        if (hasDateRange) {
            historyRecords = priceHistoryRepository.findByCrop_CropIdAndRecordedDateBetweenOrderByRecordedDateDesc(
                    cropId, startDate, endDate);
        } else {
            historyRecords = priceHistoryRepository.findRecentByCropId(cropId, PageRequest.of(0, 30));
        }

        List<PriceTrendPoint> points = historyRecords.stream()
                .map(ph -> new PriceTrendPoint(
                        ph.getRecordedDate(),
                        ph.getEffectivePrice(),
                        ph.getSourceType(),
                        ph.getMarketLocation(),
                        ph.getQuantity()))
                .toList();

        BigDecimal latestPrice = points.isEmpty() ? null : points.get(0).getPrice();

        // Calculate recent trend direction
        String recentTrend = calculateTrend(points);

        // Scale roundings for display
        BigDecimal scaledAvg = avgPrice != null ? avgPrice.setScale(2, RoundingMode.HALF_UP) : null;
        BigDecimal scaledMin = minPrice != null ? minPrice.setScale(2, RoundingMode.HALF_UP) : null;
        BigDecimal scaledMax = maxPrice != null ? maxPrice.setScale(2, RoundingMode.HALF_UP) : null;
        BigDecimal scaledQty = totalQty != null ? totalQty.setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        return new CropPriceAnalyticsResponse(
                crop.getCropId(),
                crop.getCropName(),
                crop.getCategory() != null ? crop.getCategory().name() : null,
                scaledAvg,
                scaledMin,
                scaledMax,
                latestPrice != null ? latestPrice.setScale(2, RoundingMode.HALF_UP) : null,
                scaledQty,
                count,
                recentTrend,
                points
        );
    }

    /**
     * Aggregates platform-wide marketplace price summary and per-crop performance.
     */
    @Transactional(readOnly = true)
    public MarketplacePriceSummaryResponse getMarketplaceSummary(LocalDate startDate, LocalDate endDate) {
        List<Integer> distinctCropIds = priceHistoryRepository.findDistinctCropIds();

        List<CropPriceAnalyticsResponse> cropAnalyticsList = new ArrayList<>();
        BigDecimal overallTotalQuantity = BigDecimal.ZERO;
        long overallCount = 0;
        BigDecimal sumAveragePrices = BigDecimal.ZERO;
        int cropsWithPricing = 0;

        String highestPricedCrop = null;
        BigDecimal highestAvg = null;
        String lowestPricedCrop = null;
        BigDecimal lowestAvg = null;

        for (Integer cropId : distinctCropIds) {
            CropPriceAnalyticsResponse cropAnalytics = getCropAnalytics(cropId, startDate, endDate);
            cropAnalyticsList.add(cropAnalytics);

            if (cropAnalytics.getTotalQuantity() != null) {
                overallTotalQuantity = overallTotalQuantity.add(cropAnalytics.getTotalQuantity());
            }
            overallCount += cropAnalytics.getTransactionCount();

            if (cropAnalytics.getAveragePrice() != null) {
                cropsWithPricing++;
                sumAveragePrices = sumAveragePrices.add(cropAnalytics.getAveragePrice());

                if (highestAvg == null || cropAnalytics.getAveragePrice().compareTo(highestAvg) > 0) {
                    highestAvg = cropAnalytics.getAveragePrice();
                    highestPricedCrop = cropAnalytics.getCropName();
                }
                if (lowestAvg == null || cropAnalytics.getAveragePrice().compareTo(lowestAvg) < 0) {
                    lowestAvg = cropAnalytics.getAveragePrice();
                    lowestPricedCrop = cropAnalytics.getCropName();
                }
            }
        }

        BigDecimal overallAvg = (cropsWithPricing > 0)
                ? sumAveragePrices.divide(BigDecimal.valueOf(cropsWithPricing), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new MarketplacePriceSummaryResponse(
                overallCount,
                overallTotalQuantity.setScale(2, RoundingMode.HALF_UP),
                overallAvg,
                highestPricedCrop != null ? highestPricedCrop : "N/A",
                highestAvg,
                lowestPricedCrop != null ? lowestPricedCrop : "N/A",
                lowestAvg,
                cropAnalyticsList
        );
    }

    /**
     * Determines trend direction based on time-ordered points (ordered newest first).
     */
    private String calculateTrend(List<PriceTrendPoint> points) {
        if (points == null || points.size() < 2) {
            return "INSUFFICIENT_DATA";
        }

        BigDecimal latest = points.get(0).getPrice();
        BigDecimal previous = points.get(1).getPrice();

        if (latest == null || previous == null) {
            return "INSUFFICIENT_DATA";
        }

        int comparison = latest.compareTo(previous);
        if (comparison > 0) {
            return "UPWARD";
        } else if (comparison < 0) {
            return "DOWNWARD";
        } else {
            return "STABLE";
        }
    }
}
