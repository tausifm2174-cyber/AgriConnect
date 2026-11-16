package com.agriconnect;

import com.agriconnect.dto.CropPriceAnalyticsResponse;
import com.agriconnect.dto.MarketplacePriceSummaryResponse;
import com.agriconnect.dto.PriceHistoryResponse;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.CropRepository;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.PriceHistoryRepository;
import com.agriconnect.service.PriceHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PriceHistoryServiceTest {

    @Mock
    private PriceHistoryRepository priceHistoryRepository;

    @Mock
    private CropRepository cropRepository;

    @Mock
    private FarmerProfileRepository farmerProfileRepository;

    @InjectMocks
    private PriceHistoryService priceHistoryService;

    private Crop wheat;
    private Crop rice;
    private User farmer;
    private User buyer;
    private Harvest harvest;
    private Order order;
    private PriceHistory priceHistory;

    @BeforeEach
    void setUp() {
        wheat = new Crop();
        wheat.setCropId(1);
        wheat.setCropName("Wheat");
        wheat.setCategory(CropCategory.CEREAL);

        rice = new Crop();
        rice.setCropId(2);
        rice.setCropName("Rice");
        rice.setCategory(CropCategory.CEREAL);

        farmer = new User("farmer1@test.com", "pass", "Farmer One", "9876543210", Role.FARMER, UserStatus.ACTIVE);
        farmer.setUserId(2);

        buyer = new User("buyer1@test.com", "pass", "Buyer One", "9876543211", Role.BUYER, UserStatus.ACTIVE);
        buyer.setUserId(5);

        harvest = new Harvest();
        harvest.setHarvestId(10);
        harvest.setCrop(wheat);
        harvest.setFarmer(farmer);

        order = new Order();
        order.setOrderId(100);
        order.setBuyer(buyer);
        order.setHarvest(harvest);
        order.setOrderStatus(OrderStatus.CONFIRMED);
        order.setQuantity(new BigDecimal("500.00"));
        order.setAgreedPricePerKg(new BigDecimal("28.50"));
        order.setTotalAmount(new BigDecimal("14250.00"));

        priceHistory = new PriceHistory(
                wheat,
                PriceSourceType.TRANSACTION_SALE,
                order,
                farmer,
                buyer,
                new BigDecimal("500.00"),
                new BigDecimal("28.50"),
                new BigDecimal("14250.00"),
                new BigDecimal("28.50"),
                new BigDecimal("28.50"),
                new BigDecimal("28.50"),
                "Nashik Farm",
                LocalDate.now()
        );
        priceHistory.setPriceId(1);
    }

    @Test
    @DisplayName("Record Price: Successfully record transaction price history for confirmed order")
    void recordPriceForCompletedOrder_success() {
        when(priceHistoryRepository.existsByOrder_OrderId(100)).thenReturn(false);
        when(farmerProfileRepository.findById(2)).thenReturn(Optional.of(
                new FarmerProfile(farmer, "Nashik Farm", new BigDecimal("5.5"), 8)));
        when(priceHistoryRepository.save(any(PriceHistory.class))).thenReturn(priceHistory);

        PriceHistoryResponse response = priceHistoryService.recordPriceForCompletedOrder(order);

        assertThat(response).isNotNull();
        assertThat(response.getCropName()).isEqualTo("Wheat");
        assertThat(response.getUnitPrice()).isEqualByComparingTo("28.50");
        assertThat(response.getQuantity()).isEqualByComparingTo("500.00");
        assertThat(response.getSourceType()).isEqualTo(PriceSourceType.TRANSACTION_SALE);
        verify(priceHistoryRepository).save(any(PriceHistory.class));
    }

    @Test
    @DisplayName("Record Price: Idempotent - returns existing record if already processed")
    void recordPriceForCompletedOrder_alreadyExists() {
        when(priceHistoryRepository.existsByOrder_OrderId(100)).thenReturn(true);
        when(priceHistoryRepository.findByOrder_OrderId(100)).thenReturn(Optional.of(priceHistory));

        PriceHistoryResponse response = priceHistoryService.recordPriceForCompletedOrder(order);

        assertThat(response).isNotNull();
        assertThat(response.getPriceId()).isEqualTo(1);
        verify(priceHistoryRepository, never()).save(any(PriceHistory.class));
    }

    @Test
    @DisplayName("Record Price: Ignores CANCELLED or REJECTED orders")
    void recordPriceForCompletedOrder_cancelledOrRejected() {
        order.setOrderStatus(OrderStatus.CANCELLED);
        PriceHistoryResponse response = priceHistoryService.recordPriceForCompletedOrder(order);
        assertThat(response).isNull();
        verify(priceHistoryRepository, never()).save(any(PriceHistory.class));

        order.setOrderStatus(OrderStatus.REJECTED);
        PriceHistoryResponse responseRejected = priceHistoryService.recordPriceForCompletedOrder(order);
        assertThat(responseRejected).isNull();
        verify(priceHistoryRepository, never()).save(any(PriceHistory.class));
    }

    @Test
    @DisplayName("Farmer Query: Retrieve farmer sales history with filters")
    void getFarmerPriceHistory_withFilters() {
        when(priceHistoryRepository.findByFarmer_UserIdAndCrop_CropIdOrderByRecordedDateDesc(2, 1))
                .thenReturn(List.of(priceHistory));

        List<PriceHistoryResponse> results = priceHistoryService.getFarmerPriceHistory(2, 1, null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getFarmerId()).isEqualTo(2);
        assertThat(results.get(0).getCropId()).isEqualTo(1);
    }

    @Test
    @DisplayName("Buyer Query: Retrieve crop market pricing")
    void getBuyerPriceHistory_success() {
        when(priceHistoryRepository.findByCrop_CropIdOrderByRecordedDateDesc(1))
                .thenReturn(List.of(priceHistory));

        List<PriceHistoryResponse> results = priceHistoryService.getBuyerPriceHistory(1, null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getCropName()).isEqualTo("Wheat");
    }

    @Test
    @DisplayName("Admin Query: Retrieve all pricing with source filter")
    void getAllPriceHistory_adminFilter() {
        when(priceHistoryRepository.findBySourceTypeOrderByRecordedDateDesc(PriceSourceType.TRANSACTION_SALE))
                .thenReturn(List.of(priceHistory));

        List<PriceHistoryResponse> results = priceHistoryService.getAllPriceHistory(null, PriceSourceType.TRANSACTION_SALE, null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getSourceType()).isEqualTo(PriceSourceType.TRANSACTION_SALE);
    }

    @Test
    @DisplayName("Crop Query: Not found throws ResourceNotFoundException")
    void getCropPriceHistory_cropNotFound() {
        when(cropRepository.existsById(999)).thenReturn(false);

        assertThatThrownBy(() -> priceHistoryService.getCropPriceHistory(999, null, null))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Crop not found with ID: 999");
    }

    @Test
    @DisplayName("Analytics: Calculate DBMS aggregate metrics and price trend for crop")
    void getCropAnalytics_success() {
        when(cropRepository.findById(1)).thenReturn(Optional.of(wheat));
        when(priceHistoryRepository.findAveragePriceByCropId(1)).thenReturn(new BigDecimal("28.50"));
        when(priceHistoryRepository.findMinPriceByCropId(1)).thenReturn(new BigDecimal("25.00"));
        when(priceHistoryRepository.findMaxPriceByCropId(1)).thenReturn(new BigDecimal("32.00"));
        when(priceHistoryRepository.findTotalQuantityByCropId(1)).thenReturn(new BigDecimal("2500.00"));
        when(priceHistoryRepository.countByCropId(1)).thenReturn(5L);

        PriceHistory olderRecord = new PriceHistory(wheat, PriceSourceType.TRANSACTION_SALE, null, farmer, buyer,
                new BigDecimal("500"), new BigDecimal("26.00"), new BigDecimal("13000"),
                new BigDecimal("26.00"), new BigDecimal("26.00"), new BigDecimal("26.00"),
                "Pune Mandi", LocalDate.now().minusDays(3));

        when(priceHistoryRepository.findRecentByCropId(eq(1), any(Pageable.class)))
                .thenReturn(List.of(priceHistory, olderRecord));

        CropPriceAnalyticsResponse analytics = priceHistoryService.getCropAnalytics(1, null, null);

        assertThat(analytics).isNotNull();
        assertThat(analytics.getCropName()).isEqualTo("Wheat");
        assertThat(analytics.getAveragePrice()).isEqualByComparingTo("28.50");
        assertThat(analytics.getMinimumPrice()).isEqualByComparingTo("25.00");
        assertThat(analytics.getMaximumPrice()).isEqualByComparingTo("32.00");
        assertThat(analytics.getTotalQuantity()).isEqualByComparingTo("2500.00");
        assertThat(analytics.getTransactionCount()).isEqualTo(5L);
        assertThat(analytics.getRecentTrend()).isEqualTo("UPWARD");
        assertThat(analytics.getTrendPoints()).hasSize(2);
    }

    @Test
    @DisplayName("Marketplace Summary: Calculate platform-wide pricing summary")
    void getMarketplaceSummary_success() {
        when(priceHistoryRepository.findDistinctCropIds()).thenReturn(List.of(1, 2));

        when(cropRepository.findById(1)).thenReturn(Optional.of(wheat));
        when(priceHistoryRepository.findAveragePriceByCropId(1)).thenReturn(new BigDecimal("30.00"));
        when(priceHistoryRepository.findMinPriceByCropId(1)).thenReturn(new BigDecimal("28.00"));
        when(priceHistoryRepository.findMaxPriceByCropId(1)).thenReturn(new BigDecimal("32.00"));
        when(priceHistoryRepository.findTotalQuantityByCropId(1)).thenReturn(new BigDecimal("1000.00"));
        when(priceHistoryRepository.countByCropId(1)).thenReturn(2L);
        when(priceHistoryRepository.findRecentByCropId(eq(1), any(Pageable.class))).thenReturn(List.of(priceHistory));

        PriceHistory riceRecord = new PriceHistory(rice, PriceSourceType.MARKET_MANDI, null, null, null,
                null, null, null, new BigDecimal("45.00"), new BigDecimal("40.00"), new BigDecimal("50.00"),
                "Karnal Mandi", LocalDate.now());
        when(cropRepository.findById(2)).thenReturn(Optional.of(rice));
        when(priceHistoryRepository.findAveragePriceByCropId(2)).thenReturn(new BigDecimal("45.00"));
        when(priceHistoryRepository.findMinPriceByCropId(2)).thenReturn(new BigDecimal("40.00"));
        when(priceHistoryRepository.findMaxPriceByCropId(2)).thenReturn(new BigDecimal("50.00"));
        when(priceHistoryRepository.findTotalQuantityByCropId(2)).thenReturn(new BigDecimal("500.00"));
        when(priceHistoryRepository.countByCropId(2)).thenReturn(1L);
        when(priceHistoryRepository.findRecentByCropId(eq(2), any(Pageable.class))).thenReturn(List.of(riceRecord));

        MarketplacePriceSummaryResponse summary = priceHistoryService.getMarketplaceSummary(null, null);

        assertThat(summary).isNotNull();
        assertThat(summary.getOverallTransactionCount()).isEqualTo(3L);
        assertThat(summary.getOverallTotalQuantity()).isEqualByComparingTo("1500.00");
        assertThat(summary.getOverallAveragePrice()).isEqualByComparingTo("37.50");
        assertThat(summary.getHighestPricedCrop()).isEqualTo("Rice");
        assertThat(summary.getLowestPricedCrop()).isEqualTo("Wheat");
        assertThat(summary.getCropAnalytics()).hasSize(2);
    }
}
