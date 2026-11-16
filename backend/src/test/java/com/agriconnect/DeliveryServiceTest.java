package com.agriconnect;

import com.agriconnect.dto.CreateDeliveryRequest;
import com.agriconnect.dto.DeliveryResponse;
import com.agriconnect.dto.UpdateDeliveryStatusRequest;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.BuyerProfileRepository;
import com.agriconnect.repository.DeliveryRepository;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.OrderRepository;
import com.agriconnect.service.DeliveryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DeliveryServiceTest {

    @Mock
    private DeliveryRepository deliveryRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private BuyerProfileRepository buyerProfileRepository;

    @Mock
    private FarmerProfileRepository farmerProfileRepository;

    @InjectMocks
    private DeliveryService deliveryService;

    private User buyer;
    private User otherBuyer;
    private User farmer;
    private User otherFarmer;
    private Crop crop;
    private Harvest harvest;
    private Order order;
    private Delivery delivery;

    @BeforeEach
    void setUp() {
        buyer = new User();
        buyer.setUserId(10);
        buyer.setFullName("Buyer One");
        buyer.setEmail("buyer1@market.com");
        buyer.setRole(Role.BUYER);
        buyer.setStatus(UserStatus.ACTIVE);

        otherBuyer = new User();
        otherBuyer.setUserId(11);
        otherBuyer.setFullName("Buyer Two");
        otherBuyer.setEmail("buyer2@market.com");
        otherBuyer.setRole(Role.BUYER);
        otherBuyer.setStatus(UserStatus.ACTIVE);

        farmer = new User();
        farmer.setUserId(20);
        farmer.setFullName("Farmer One");
        farmer.setEmail("farmer1@kisan.com");
        farmer.setRole(Role.FARMER);
        farmer.setStatus(UserStatus.ACTIVE);

        otherFarmer = new User();
        otherFarmer.setUserId(21);
        otherFarmer.setFullName("Farmer Two");
        otherFarmer.setEmail("farmer2@kisan.com");
        otherFarmer.setRole(Role.FARMER);
        otherFarmer.setStatus(UserStatus.ACTIVE);

        crop = new Crop();
        crop.setCropId(1);
        crop.setCropName("Tomato (Hybrid Red)");
        crop.setCategory(CropCategory.VEGETABLE);

        harvest = new Harvest();
        harvest.setHarvestId(100);
        harvest.setFarmer(farmer);
        harvest.setCrop(crop);
        harvest.setAvailableQuantity(new BigDecimal("500.00"));
        harvest.setPricePerKg(new BigDecimal("25.00"));

        order = new Order();
        order.setOrderId(501);
        order.setBuyer(buyer);
        order.setHarvest(harvest);
        order.setQuantity(new BigDecimal("100.00"));
        order.setAgreedPricePerKg(new BigDecimal("25.00"));
        order.setTotalAmount(new BigDecimal("2500.00"));
        order.setOrderStatus(OrderStatus.ACCEPTED);

        delivery = new Delivery();
        delivery.setDeliveryId(1);
        delivery.setOrder(order);
        delivery.setDeliveryStatus(DeliveryStatus.PENDING);
        delivery.setDeliveryAddress("123 Market Yard, APMC, Pune");
        delivery.setTrackingNumber("TRK-20261116-ORD501-1001");
        delivery.setCreatedAt(LocalDateTime.now());
    }

    // -------------------------------------------------------------------
    // 1. Delivery Creation & Validation
    // -------------------------------------------------------------------

    @Test
    @DisplayName("1. Delivery creation for valid order succeeds and transitions ACCEPTED order to CONFIRMED")
    void testCreateDelivery_Success_TransitionsAcceptedToConfirmed() {
        CreateDeliveryRequest request = new CreateDeliveryRequest(
                501, "123 Market Yard, APMC, Pune", "MH-12-AB-1234", null, "Handle carefully"
        );

        when(orderRepository.findByIdForUpdate(501)).thenReturn(Optional.of(order));
        when(deliveryRepository.existsByOrder_OrderId(501)).thenReturn(false);
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(invocation -> {
            Delivery d = invocation.getArgument(0);
            d.setDeliveryId(99);
            return d;
        });

        DeliveryResponse response = deliveryService.createDelivery(10, Role.BUYER, request);

        assertThat(response).isNotNull();
        assertThat(response.getDeliveryId()).isEqualTo(99);
        assertThat(response.getDeliveryStatus()).isEqualTo(DeliveryStatus.PENDING);
        assertThat(response.getDeliveryAddress()).isEqualTo("123 Market Yard, APMC, Pune");
        assertThat(response.getTrackingNumber()).startsWith("TRK-");

        // Verify order status transitioned from ACCEPTED to CONFIRMED
        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.CONFIRMED);
        verify(orderRepository).save(order);
        verify(deliveryRepository).save(any(Delivery.class));
    }

    @Test
    @DisplayName("2. Delivery creation for nonexistent order throws ResourceNotFoundException")
    void testCreateDelivery_NonexistentOrder_ThrowsNotFound() {
        CreateDeliveryRequest request = new CreateDeliveryRequest(
                999, "Some Address", null, null, null
        );

        when(orderRepository.findByIdForUpdate(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deliveryService.createDelivery(10, Role.BUYER, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Order not found with ID: 999");
    }

    @Test
    @DisplayName("3. Duplicate delivery creation for same order throws BadRequestException")
    void testCreateDelivery_DuplicateOrder_ThrowsBadRequest() {
        CreateDeliveryRequest request = new CreateDeliveryRequest(
                501, "123 Market Yard, APMC, Pune", null, null, null
        );

        when(orderRepository.findByIdForUpdate(501)).thenReturn(Optional.of(order));
        when(deliveryRepository.existsByOrder_OrderId(501)).thenReturn(true);

        assertThatThrownBy(() -> deliveryService.createDelivery(10, Role.BUYER, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Duplicate delivery creation is prevented");
    }

    @Test
    @DisplayName("4. Delivery creation for CANCELLED or REJECTED order throws BadRequestException")
    void testCreateDelivery_CancelledOrder_ThrowsBadRequest() {
        order.setOrderStatus(OrderStatus.CANCELLED);
        CreateDeliveryRequest request = new CreateDeliveryRequest(501, "Address", null, null, null);

        when(orderRepository.findByIdForUpdate(501)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> deliveryService.createDelivery(10, Role.BUYER, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("order status is CANCELLED");
    }

    @Test
    @DisplayName("5. Delivery creation with missing or blank address throws BadRequestException")
    void testCreateDelivery_MissingAddress_ThrowsBadRequest() {
        CreateDeliveryRequest request = new CreateDeliveryRequest(501, "   ", null, null, null);

        assertThatThrownBy(() -> deliveryService.createDelivery(10, Role.BUYER, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Delivery address is required");
    }

    // -------------------------------------------------------------------
    // 2. Multi-tenant Ownership & IDOR Protection
    // -------------------------------------------------------------------

    @Test
    @DisplayName("6. Buyer cannot create delivery for another buyer's order (throws AccessDeniedException)")
    void testCreateDelivery_ForeignBuyer_ThrowsAccessDenied() {
        CreateDeliveryRequest request = new CreateDeliveryRequest(501, "Address", null, null, null);

        when(orderRepository.findByIdForUpdate(501)).thenReturn(Optional.of(order));
        when(deliveryRepository.existsByOrder_OrderId(501)).thenReturn(false);

        assertThatThrownBy(() -> deliveryService.createDelivery(11, Role.BUYER, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("7. Farmer can create delivery for own order, but foreign farmer is blocked")
    void testCreateDelivery_ForeignFarmer_ThrowsAccessDenied() {
        CreateDeliveryRequest request = new CreateDeliveryRequest(501, "Address", null, null, null);

        when(orderRepository.findByIdForUpdate(501)).thenReturn(Optional.of(order));
        when(deliveryRepository.existsByOrder_OrderId(501)).thenReturn(false);

        // Foreign farmer (user 21) attempts creation on farmer 20's order
        assertThatThrownBy(() -> deliveryService.createDelivery(21, Role.FARMER, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("8. Buyer can view own delivery")
    void testGetBuyerDeliveryById_Success() {
        when(deliveryRepository.findById(1)).thenReturn(Optional.of(delivery));

        DeliveryResponse response = deliveryService.getBuyerDeliveryById(10, 1);

        assertThat(response).isNotNull();
        assertThat(response.getDeliveryId()).isEqualTo(1);
        assertThat(response.getOrderId()).isEqualTo(501);
    }

    @Test
    @DisplayName("9. Buyer cannot view another buyer's delivery (throws AccessDeniedException)")
    void testGetBuyerDeliveryById_ForeignBuyer_ThrowsAccessDenied() {
        when(deliveryRepository.findById(1)).thenReturn(Optional.of(delivery));

        assertThatThrownBy(() -> deliveryService.getBuyerDeliveryById(11, 1))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("10. Farmer can view own delivery")
    void testGetFarmerDeliveryById_Success() {
        when(deliveryRepository.findById(1)).thenReturn(Optional.of(delivery));

        DeliveryResponse response = deliveryService.getFarmerDeliveryById(20, 1);

        assertThat(response).isNotNull();
        assertThat(response.getDeliveryId()).isEqualTo(1);
    }

    @Test
    @DisplayName("11. Farmer cannot view another farmer's delivery (throws AccessDeniedException)")
    void testGetFarmerDeliveryById_ForeignFarmer_ThrowsAccessDenied() {
        when(deliveryRepository.findById(1)).thenReturn(Optional.of(delivery));

        assertThatThrownBy(() -> deliveryService.getFarmerDeliveryById(21, 1))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    // -------------------------------------------------------------------
    // 3. Status Workflow & Atomic Order Synchronization
    // -------------------------------------------------------------------

    @Test
    @DisplayName("12. Farmer ships delivery: updates delivery to SHIPPED and order to SHIPPED atomically")
    void testShipDelivery_Success_UpdatesOrderToShipped() {
        order.setOrderStatus(OrderStatus.CONFIRMED);
        delivery.setDeliveryStatus(DeliveryStatus.PENDING);

        when(deliveryRepository.findByIdForUpdate(1)).thenReturn(Optional.of(delivery));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> i.getArgument(0));

        UpdateDeliveryStatusRequest request = new UpdateDeliveryStatusRequest(
                "TRK-UPDATED-99", "MH-14-CC-5678", "Dispatched via Express Cold Chain"
        );

        DeliveryResponse response = deliveryService.shipDelivery(20, 1, request);

        assertThat(response.getDeliveryStatus()).isEqualTo(DeliveryStatus.SHIPPED);
        assertThat(response.getDispatchedAt()).isNotNull();
        assertThat(response.getTrackingNumber()).isEqualTo("TRK-UPDATED-99");
        assertThat(response.getVehicleNumber()).isEqualTo("MH-14-CC-5678");

        // Verify order status atomically updated to SHIPPED
        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.SHIPPED);
        verify(orderRepository).save(order);
        verify(deliveryRepository).save(delivery);
    }

    @Test
    @DisplayName("13. Foreign farmer cannot ship delivery (throws AccessDeniedException)")
    void testShipDelivery_ForeignFarmer_ThrowsAccessDenied() {
        when(deliveryRepository.findByIdForUpdate(1)).thenReturn(Optional.of(delivery));

        assertThatThrownBy(() -> deliveryService.shipDelivery(21, 1, null))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("14. Invalid transition directly to DELIVERED when order is not SHIPPED throws BadRequestException")
    void testDeliver_WhenNotShipped_ThrowsBadRequest() {
        delivery.setDeliveryStatus(DeliveryStatus.PENDING);
        order.setOrderStatus(OrderStatus.CONFIRMED);

        when(deliveryRepository.findByIdForUpdate(1)).thenReturn(Optional.of(delivery));

        assertThatThrownBy(() -> deliveryService.markAsDelivered(20, Role.FARMER, 1, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot transition");
    }

    @Test
    @DisplayName("15. Mark as DELIVERED: updates delivery to DELIVERED and order to DELIVERED atomically")
    void testMarkAsDelivered_Success_UpdatesOrderToDelivered() {
        delivery.setDeliveryStatus(DeliveryStatus.SHIPPED);
        order.setOrderStatus(OrderStatus.SHIPPED);

        when(deliveryRepository.findByIdForUpdate(1)).thenReturn(Optional.of(delivery));
        when(deliveryRepository.save(any(Delivery.class))).thenAnswer(i -> i.getArgument(0));

        UpdateDeliveryStatusRequest request = new UpdateDeliveryStatusRequest(null, null, "Received in good condition");

        DeliveryResponse response = deliveryService.markAsDelivered(20, Role.FARMER, 1, request);

        assertThat(response.getDeliveryStatus()).isEqualTo(DeliveryStatus.DELIVERED);
        assertThat(response.getDeliveredAt()).isNotNull();

        // Verify order status atomically updated to DELIVERED
        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.DELIVERED);
        verify(orderRepository).save(order);
        verify(deliveryRepository).save(delivery);
    }

    @Test
    @DisplayName("16. Invalid backward transition: DELIVERED cannot transition back to SHIPPED")
    void testShipDelivery_WhenAlreadyDelivered_ThrowsBadRequest() {
        delivery.setDeliveryStatus(DeliveryStatus.DELIVERED);
        order.setOrderStatus(OrderStatus.DELIVERED);

        when(deliveryRepository.findByIdForUpdate(1)).thenReturn(Optional.of(delivery));

        assertThatThrownBy(() -> deliveryService.shipDelivery(20, 1, null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot transition from DELIVERED to SHIPPED");
    }

    // -------------------------------------------------------------------
    // 4. Admin Functionality
    // -------------------------------------------------------------------

    @Test
    @DisplayName("17. Admin can view all deliveries and filter by status")
    void testAdminGetAllDeliveries_Success() {
        when(deliveryRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(delivery));

        List<DeliveryResponse> all = deliveryService.getAllDeliveries(null);
        assertThat(all).hasSize(1);

        when(deliveryRepository.findByDeliveryStatusOrderByCreatedAtDesc(DeliveryStatus.PENDING))
                .thenReturn(List.of(delivery));

        List<DeliveryResponse> pendingOnly = deliveryService.getAllDeliveries(DeliveryStatus.PENDING);
        assertThat(pendingOnly).hasSize(1);
    }

    @Test
    @DisplayName("18. Admin can view single delivery audit record")
    void testAdminGetDeliveryById_Success() {
        when(deliveryRepository.findById(1)).thenReturn(Optional.of(delivery));

        DeliveryResponse response = deliveryService.getAdminDeliveryById(1);
        assertThat(response).isNotNull();
        assertThat(response.getDeliveryId()).isEqualTo(1);
    }
}
