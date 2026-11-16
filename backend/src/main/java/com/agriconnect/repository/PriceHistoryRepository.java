package com.agriconnect.repository;

import com.agriconnect.entity.PriceHistory;
import com.agriconnect.entity.PriceSourceType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PriceHistoryRepository extends JpaRepository<PriceHistory, Integer> {

    // Farmer-specific price history
    List<PriceHistory> findByFarmer_UserIdOrderByRecordedDateDesc(Integer farmerId);

    List<PriceHistory> findByFarmer_UserIdAndCrop_CropIdOrderByRecordedDateDesc(Integer farmerId, Integer cropId);

    List<PriceHistory> findByFarmer_UserIdAndRecordedDateBetweenOrderByRecordedDateDesc(
            Integer farmerId, LocalDate startDate, LocalDate endDate);

    List<PriceHistory> findByFarmer_UserIdAndCrop_CropIdAndRecordedDateBetweenOrderByRecordedDateDesc(
            Integer farmerId, Integer cropId, LocalDate startDate, LocalDate endDate);

    // Buyer-specific historical purchase prices
    List<PriceHistory> findByBuyer_UserIdOrderByRecordedDateDesc(Integer buyerId);

    List<PriceHistory> findByBuyer_UserIdAndCrop_CropIdOrderByRecordedDateDesc(Integer buyerId, Integer cropId);

    // Crop-specific historical price records
    List<PriceHistory> findByCrop_CropIdOrderByRecordedDateDesc(Integer cropId);

    List<PriceHistory> findByCrop_CropIdAndRecordedDateBetweenOrderByRecordedDateDesc(
            Integer cropId, LocalDate startDate, LocalDate endDate);

    // Filter by source type
    List<PriceHistory> findBySourceTypeOrderByRecordedDateDesc(PriceSourceType sourceType);

    List<PriceHistory> findByCrop_CropIdAndSourceTypeOrderByRecordedDateDesc(Integer cropId, PriceSourceType sourceType);

    long countBySourceType(PriceSourceType sourceType);

    // Global ordering
    List<PriceHistory> findAllByOrderByRecordedDateDesc();

    // Order lookup & duplicate prevention
    Optional<PriceHistory> findByOrder_OrderId(Integer orderId);

    boolean existsByOrder_OrderId(Integer orderId);

    // Distinct crops in price history
    @Query("SELECT DISTINCT ph.crop.cropId FROM PriceHistory ph ORDER BY ph.crop.cropId")
    List<Integer> findDistinctCropIds();

    // Recent records for trend analysis (using Pageable)
    @Query("SELECT ph FROM PriceHistory ph WHERE ph.crop.cropId = :cropId ORDER BY ph.recordedDate DESC, ph.priceId DESC")
    List<PriceHistory> findRecentByCropId(@Param("cropId") Integer cropId, Pageable pageable);

    // -------------------------------------------------------------
    // Aggregate SQL/JPA Analytical Queries (Academic DBMS Focus)
    // -------------------------------------------------------------

    @Query("SELECT AVG(COALESCE(ph.unitPrice, ph.modalPricePerKg)) FROM PriceHistory ph WHERE ph.crop.cropId = :cropId")
    BigDecimal findAveragePriceByCropId(@Param("cropId") Integer cropId);

    @Query("SELECT MIN(COALESCE(ph.unitPrice, ph.minPricePerKg)) FROM PriceHistory ph WHERE ph.crop.cropId = :cropId")
    BigDecimal findMinPriceByCropId(@Param("cropId") Integer cropId);

    @Query("SELECT MAX(COALESCE(ph.unitPrice, ph.maxPricePerKg)) FROM PriceHistory ph WHERE ph.crop.cropId = :cropId")
    BigDecimal findMaxPriceByCropId(@Param("cropId") Integer cropId);

    @Query("SELECT COALESCE(SUM(ph.quantity), 0) FROM PriceHistory ph WHERE ph.crop.cropId = :cropId")
    BigDecimal findTotalQuantityByCropId(@Param("cropId") Integer cropId);

    @Query("SELECT COUNT(ph) FROM PriceHistory ph WHERE ph.crop.cropId = :cropId")
    long countByCropId(@Param("cropId") Integer cropId);

    // Aggregates with date range filtering
    @Query("SELECT AVG(COALESCE(ph.unitPrice, ph.modalPricePerKg)) FROM PriceHistory ph " +
           "WHERE ph.crop.cropId = :cropId AND ph.recordedDate BETWEEN :startDate AND :endDate")
    BigDecimal findAveragePriceByCropIdAndDateRange(
            @Param("cropId") Integer cropId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT MIN(COALESCE(ph.unitPrice, ph.minPricePerKg)) FROM PriceHistory ph " +
           "WHERE ph.crop.cropId = :cropId AND ph.recordedDate BETWEEN :startDate AND :endDate")
    BigDecimal findMinPriceByCropIdAndDateRange(
            @Param("cropId") Integer cropId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT MAX(COALESCE(ph.unitPrice, ph.maxPricePerKg)) FROM PriceHistory ph " +
           "WHERE ph.crop.cropId = :cropId AND ph.recordedDate BETWEEN :startDate AND :endDate")
    BigDecimal findMaxPriceByCropIdAndDateRange(
            @Param("cropId") Integer cropId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COALESCE(SUM(ph.quantity), 0) FROM PriceHistory ph " +
           "WHERE ph.crop.cropId = :cropId AND ph.recordedDate BETWEEN :startDate AND :endDate")
    BigDecimal findTotalQuantityByCropIdAndDateRange(
            @Param("cropId") Integer cropId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(ph) FROM PriceHistory ph " +
           "WHERE ph.crop.cropId = :cropId AND ph.recordedDate BETWEEN :startDate AND :endDate")
    long countByCropIdAndDateRange(
            @Param("cropId") Integer cropId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Platform-wide aggregates
    @Query("SELECT COALESCE(SUM(ph.quantity), 0) FROM PriceHistory ph")
    BigDecimal findOverallTotalQuantity();

    @Query("SELECT COALESCE(SUM(ph.totalAmount), 0) FROM PriceHistory ph")
    BigDecimal findOverallTotalAmount();

    @Query("SELECT AVG(COALESCE(ph.unitPrice, ph.modalPricePerKg)) FROM PriceHistory ph")
    BigDecimal findOverallAveragePrice();
}
