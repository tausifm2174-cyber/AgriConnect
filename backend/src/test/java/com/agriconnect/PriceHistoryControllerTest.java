package com.agriconnect;

import com.agriconnect.controller.AdminPriceHistoryController;
import com.agriconnect.controller.BuyerPriceHistoryController;
import com.agriconnect.controller.FarmerPriceHistoryController;
import com.agriconnect.controller.PriceHistoryController;
import com.agriconnect.dto.CropPriceAnalyticsResponse;
import com.agriconnect.dto.MarketplacePriceSummaryResponse;
import com.agriconnect.dto.PriceHistoryResponse;
import com.agriconnect.dto.PriceTrendPoint;
import com.agriconnect.entity.PriceSourceType;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.exception.GlobalExceptionHandler;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.security.JwtAuthenticationFilter;
import com.agriconnect.security.JwtTokenProvider;
import com.agriconnect.service.PriceHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {
        FarmerPriceHistoryController.class,
        BuyerPriceHistoryController.class,
        AdminPriceHistoryController.class,
        PriceHistoryController.class
})
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PriceHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PriceHistoryService priceHistoryService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    private PriceHistoryResponse sampleRecord;
    private CropPriceAnalyticsResponse sampleAnalytics;
    private MarketplacePriceSummaryResponse sampleSummary;

    @BeforeEach
    void setUp() {
        sampleRecord = new PriceHistoryResponse();
        sampleRecord.setPriceId(1);
        sampleRecord.setCropId(1);
        sampleRecord.setCropName("Wheat");
        sampleRecord.setSourceType(PriceSourceType.TRANSACTION_SALE);
        sampleRecord.setUnitPrice(new BigDecimal("28.50"));
        sampleRecord.setQuantity(new BigDecimal("500.00"));
        sampleRecord.setRecordedDate(LocalDate.now());

        PriceTrendPoint point = new PriceTrendPoint(
                LocalDate.now(), new BigDecimal("28.50"), PriceSourceType.TRANSACTION_SALE, "Direct Farm", new BigDecimal("500.00"));

        sampleAnalytics = new CropPriceAnalyticsResponse(
                1, "Wheat", "GRAIN",
                new BigDecimal("28.50"), new BigDecimal("25.00"), new BigDecimal("32.00"),
                new BigDecimal("28.50"), new BigDecimal("500.00"), 1L, "STABLE", List.of(point)
        );

        sampleSummary = new MarketplacePriceSummaryResponse(
                5L, new BigDecimal("2500.00"), new BigDecimal("35.00"),
                "Rice", new BigDecimal("45.00"), "Wheat", new BigDecimal("28.50"), List.of(sampleAnalytics)
        );
    }

    private void authenticateUser(int userId, String username, Role role) {
        User user = new User(username + "@test.com", "pass", "Full Name", "9876543210", role, com.agriconnect.entity.UserStatus.ACTIVE);
        user.setUserId(userId);
        CustomUserDetails userDetails = new CustomUserDetails(user);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Test
    @DisplayName("Farmer Controller: GET /api/farmer/price-history returns 200 OK")
    void getFarmerPriceHistory_success() throws Exception {
        authenticateUser(2, "farmer1", Role.FARMER);
        when(priceHistoryService.getFarmerPriceHistory(eq(2), isNull(), isNull(), isNull()))
                .thenReturn(List.of(sampleRecord));

        mockMvc.perform(get("/api/farmer/price-history")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].cropName").value("Wheat"))
                .andExpect(jsonPath("$.data[0].unitPrice").value(28.50));
    }

    @Test
    @DisplayName("Buyer Controller: GET /api/buyer/price-history returns 200 OK")
    void getBuyerPriceHistory_success() throws Exception {
        authenticateUser(5, "buyer1", Role.BUYER);
        when(priceHistoryService.getBuyerPriceHistory(isNull(), isNull(), isNull()))
                .thenReturn(List.of(sampleRecord));

        mockMvc.perform(get("/api/buyer/price-history")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].cropName").value("Wheat"));
    }

    @Test
    @DisplayName("Buyer Controller: GET /api/buyer/price-history/analytics/{cropId} returns 200 OK")
    void getBuyerCropAnalytics_success() throws Exception {
        authenticateUser(5, "buyer1", Role.BUYER);
        when(priceHistoryService.getCropAnalytics(eq(1), isNull(), isNull()))
                .thenReturn(sampleAnalytics);

        mockMvc.perform(get("/api/buyer/price-history/analytics/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.cropName").value("Wheat"))
                .andExpect(jsonPath("$.data.averagePrice").value(28.50))
                .andExpect(jsonPath("$.data.recentTrend").value("STABLE"));
    }

    @Test
    @DisplayName("Admin Controller: GET /api/admin/price-history/summary returns 200 OK")
    void getAdminMarketplaceSummary_success() throws Exception {
        authenticateUser(1, "admin", Role.ADMIN);
        when(priceHistoryService.getMarketplaceSummary(isNull(), isNull()))
                .thenReturn(sampleSummary);

        mockMvc.perform(get("/api/admin/price-history/summary")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.overallTransactionCount").value(5))
                .andExpect(jsonPath("$.data.highestPricedCrop").value("Rice"));
    }

    @Test
    @DisplayName("Universal Controller: GET /api/price-history/crop/{cropId} returns 200 OK")
    void getUniversalCropPriceHistory_success() throws Exception {
        when(priceHistoryService.getCropPriceHistory(eq(1), isNull(), isNull()))
                .thenReturn(List.of(sampleRecord));

        mockMvc.perform(get("/api/price-history/crop/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].cropName").value("Wheat"));
    }
}
