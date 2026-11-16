package com.agriconnect;

import com.agriconnect.dto.CreatePaymentRequest;
import com.agriconnect.dto.PaymentResponse;
import com.agriconnect.dto.PaymentSummaryDto;
import com.agriconnect.dto.UpdatePaymentStatusRequest;
import com.agriconnect.entity.*;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.exception.ResourceNotFoundException;
import com.agriconnect.repository.BuyerProfileRepository;
import com.agriconnect.repository.FarmerProfileRepository;
import com.agriconnect.repository.OrderRepository;
import com.agriconnect.repository.PaymentRepository;
import com.agriconnect.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private BuyerProfileRepository buyerProfileRepository;

    @Mock
    private FarmerProfileRepository farmerProfileRepository;

    @Mock
    private com.agriconnect.service.PriceHistoryService priceHistoryService;

    @InjectMocks
    private PaymentService paymentService;

    private User buyer;
    private User otherBuyer;
    private User farmer;
    private User otherFarmer;
    private Crop crop;
    private Harvest harvest;
    private Order order;
    private Payment payment;

    @BeforeEach
    void setUp() {
        buyer = new User("buyer@example.com", "pass", "Test Buyer", "9876543210", Role.BUYER, UserStatus.ACTIVE);
        buyer.setUserId(10);

        otherBuyer = new User("otherbuyer@example.com", "pass", "Other Buyer", "9876543219", Role.BUYER, UserStatus.ACTIVE);
        otherBuyer.setUserId(20);

        farmer = new User("farmer@example.com", "pass", "Test Farmer", "9123456780", Role.FARMER, UserStatus.ACTIVE);
        farmer.setUserId(30);

        otherFarmer = new User("otherfarmer@example.com", "pass", "Other Farmer", "9123456789", Role.FARMER, UserStatus.ACTIVE);
        otherFarmer.setUserId(40);

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
        order.setOrderId(50);
        order.setBuyer(buyer);
        order.setHarvest(harvest);
        order.setQuantity(new BigDecimal("100.00"));
        order.setAgreedPricePerKg(new BigDecimal("25.00"));
        order.setTotalAmount(new BigDecimal("2500.00"));
        order.setOrderStatus(OrderStatus.ACCEPTED);
        order.setRemarks("Initial order");

        payment = new Payment();
        payment.setPaymentId(500);
        payment.setOrder(order);
        payment.setAmount(new BigDecimal("1000.00"));
        payment.setPaymentMethod(PaymentMethod.UPI);
        payment.setPaymentStatus(PaymentStatus.PENDING);
        payment.setTransactionReference("TXN-TEST-1234");
        payment.setRemarks("Advance payment");
    }

    @Test
    @DisplayName("Create Payment: Success when buyer pays for ACCEPTED order and order transitions to CONFIRMED")
    void createPayment_Success() {
        CreatePaymentRequest request = new CreatePaymentRequest(50, new BigDecimal("2500.00"),
                PaymentMethod.UPI, "TXN-TEST-9999", "Full payment");

        when(orderRepository.findByIdForUpdate(50)).thenReturn(Optional.of(order));
        when(paymentRepository.sumCompletedAmountByOrderId(50)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.existsByTransactionReference("TXN-TEST-9999")).thenReturn(false);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setPaymentId(501);
            return p;
        });

        PaymentResponse response = paymentService.createPayment(10, Role.BUYER, request);

        assertThat(response).isNotNull();
        assertThat(response.getPaymentId()).isEqualTo(501);
        assertThat(response.getAmount()).isEqualByComparingTo(new BigDecimal("2500.00"));
        assertThat(response.getPaymentStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(response.getTransactionReference()).isEqualTo("TXN-TEST-9999");
        assertThat(order.getOrderStatus()).isEqualTo(OrderStatus.CONFIRMED);

        verify(orderRepository).save(order);
        verify(paymentRepository).save(any(Payment.class));
    }

    @Test
    @DisplayName("Create Payment: Fails when order is not found")
    void createPayment_OrderNotFound() {
        CreatePaymentRequest request = new CreatePaymentRequest(999, new BigDecimal("1000.00"),
                PaymentMethod.BANK_TRANSFER, null, "Pay");

        when(orderRepository.findByIdForUpdate(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.createPayment(10, Role.BUYER, request))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Order not found with ID: 999");
    }

    @Test
    @DisplayName("Create Payment: Fails with 403 AccessDenied when buyer does not own the order")
    void createPayment_AccessDeniedForDifferentBuyer() {
        CreatePaymentRequest request = new CreatePaymentRequest(50, new BigDecimal("1000.00"),
                PaymentMethod.BANK_TRANSFER, null, "Pay");

        when(orderRepository.findByIdForUpdate(50)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentService.createPayment(20, Role.BUYER, request))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("Create Payment: Fails when order is CANCELLED")
    void createPayment_FailsWhenOrderCancelled() {
        order.setOrderStatus(OrderStatus.CANCELLED);
        CreatePaymentRequest request = new CreatePaymentRequest(50, new BigDecimal("1000.00"),
                PaymentMethod.UPI, null, "Pay");

        when(orderRepository.findByIdForUpdate(50)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentService.createPayment(10, Role.BUYER, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("because order status is CANCELLED");
    }

    @Test
    @DisplayName("Create Payment: Fails when order is PENDING (not yet accepted by farmer)")
    void createPayment_FailsWhenOrderPending() {
        order.setOrderStatus(OrderStatus.PENDING);
        CreatePaymentRequest request = new CreatePaymentRequest(50, new BigDecimal("1000.00"),
                PaymentMethod.UPI, null, "Pay");

        when(orderRepository.findByIdForUpdate(50)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> paymentService.createPayment(10, Role.BUYER, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("The order must first be accepted by the farmer");
    }

    @Test
    @DisplayName("Create Payment: Fails when order is already fully paid")
    void createPayment_FailsWhenAlreadyFullyPaid() {
        CreatePaymentRequest request = new CreatePaymentRequest(50, new BigDecimal("500.00"),
                PaymentMethod.UPI, null, "Pay extra");

        when(orderRepository.findByIdForUpdate(50)).thenReturn(Optional.of(order));
        when(paymentRepository.sumCompletedAmountByOrderId(50)).thenReturn(new BigDecimal("2500.00"));

        assertThatThrownBy(() -> paymentService.createPayment(10, Role.BUYER, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("is already fully paid");
    }

    @Test
    @DisplayName("Create Payment: Fails when payment amount exceeds remaining balance")
    void createPayment_FailsWhenAmountExceedsBalance() {
        CreatePaymentRequest request = new CreatePaymentRequest(50, new BigDecimal("2000.00"),
                PaymentMethod.UPI, null, "Pay too much");

        when(orderRepository.findByIdForUpdate(50)).thenReturn(Optional.of(order));
        when(paymentRepository.sumCompletedAmountByOrderId(50)).thenReturn(new BigDecimal("1000.00"));

        assertThatThrownBy(() -> paymentService.createPayment(10, Role.BUYER, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("exceeds remaining balance");
    }

    @Test
    @DisplayName("Create Payment: Fails when duplicate transaction reference is provided")
    void createPayment_FailsWhenDuplicateTxnRef() {
        CreatePaymentRequest request = new CreatePaymentRequest(50, new BigDecimal("500.00"),
                PaymentMethod.UPI, "TXN-EXISTING", "Pay");

        when(orderRepository.findByIdForUpdate(50)).thenReturn(Optional.of(order));
        when(paymentRepository.sumCompletedAmountByOrderId(50)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.existsByTransactionReference("TXN-EXISTING")).thenReturn(true);

        assertThatThrownBy(() -> paymentService.createPayment(10, Role.BUYER, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Transaction reference 'TXN-EXISTING' already exists");
    }

    @Test
    @DisplayName("Get Buyer Payments: Returns list of payments for buyer")
    void getBuyerPayments_Success() {
        when(paymentRepository.findByOrder_Buyer_UserIdOrderByPaymentDateDesc(10))
                .thenReturn(List.of(payment));

        List<PaymentResponse> results = paymentService.getBuyerPayments(10);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getPaymentId()).isEqualTo(500);
        assertThat(results.get(0).getOrderId()).isEqualTo(50);
    }

    @Test
    @DisplayName("Get Buyer Payment By ID: Fails with 403 when buyer does not own the payment")
    void getBuyerPaymentById_AccessDenied() {
        when(paymentRepository.findById(500)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.getBuyerPaymentById(20, 500))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("Get Farmer Payments: Returns payments for farmer's produce")
    void getFarmerPayments_Success() {
        when(paymentRepository.findByOrder_Harvest_Farmer_UserIdOrderByPaymentDateDesc(30))
                .thenReturn(List.of(payment));

        List<PaymentResponse> results = paymentService.getFarmerPayments(30);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getFarmerId()).isEqualTo(30);
    }

    @Test
    @DisplayName("Get Farmer Payment By ID: Fails with 403 when farmer does not own the produce")
    void getFarmerPaymentById_AccessDenied() {
        when(paymentRepository.findById(500)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.getFarmerPaymentById(40, 500))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied");
    }

    @Test
    @DisplayName("Update Payment Status: Admin transitions PENDING to COMPLETED successfully")
    void updatePaymentStatus_PendingToCompleted() {
        UpdatePaymentStatusRequest request = new UpdatePaymentStatusRequest(PaymentStatus.COMPLETED, "Settled");

        when(paymentRepository.findById(500)).thenReturn(Optional.of(payment));
        when(paymentRepository.sumCompletedAmountByOrderId(50)).thenReturn(BigDecimal.ZERO);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.updatePaymentStatus(1, Role.ADMIN, 500, request);

        assertThat(response).isNotNull();
        assertThat(payment.getPaymentStatus()).isEqualTo(PaymentStatus.COMPLETED);
        assertThat(payment.getRemarks()).isEqualTo("Settled");
        verify(paymentRepository).save(payment);
    }

    @Test
    @DisplayName("Update Payment Status: Admin transitions COMPLETED to REFUNDED successfully")
    void updatePaymentStatus_CompletedToRefunded() {
        payment.setPaymentStatus(PaymentStatus.COMPLETED);
        UpdatePaymentStatusRequest request = new UpdatePaymentStatusRequest(PaymentStatus.REFUNDED, "Customer return");

        when(paymentRepository.findById(500)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PaymentResponse response = paymentService.updatePaymentStatus(1, Role.ADMIN, 500, request);

        assertThat(response).isNotNull();
        assertThat(payment.getPaymentStatus()).isEqualTo(PaymentStatus.REFUNDED);
        verify(paymentRepository).save(payment);
    }

    @Test
    @DisplayName("Update Payment Status: Fails when transitioning from REFUNDED (terminal state)")
    void updatePaymentStatus_FailsFromTerminalState() {
        payment.setPaymentStatus(PaymentStatus.REFUNDED);
        UpdatePaymentStatusRequest request = new UpdatePaymentStatusRequest(PaymentStatus.COMPLETED, "Revert");

        when(paymentRepository.findById(500)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.updatePaymentStatus(1, Role.ADMIN, 500, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot transition from REFUNDED to COMPLETED");
    }

    @Test
    @DisplayName("Update Payment Status: Fails when backward transition from COMPLETED to PENDING")
    void updatePaymentStatus_FailsBackwardTransition() {
        payment.setPaymentStatus(PaymentStatus.COMPLETED);
        UpdatePaymentStatusRequest request = new UpdatePaymentStatusRequest(PaymentStatus.PENDING, "Revert");

        when(paymentRepository.findById(500)).thenReturn(Optional.of(payment));

        assertThatThrownBy(() -> paymentService.updatePaymentStatus(1, Role.ADMIN, 500, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot transition from COMPLETED to PENDING");
    }

    @Test
    @DisplayName("Get Order Payment Summary: Returns accurate balance and settlement status")
    void getOrderPaymentSummary_Success() {
        payment.setPaymentStatus(PaymentStatus.COMPLETED);
        when(orderRepository.findById(50)).thenReturn(Optional.of(order));
        when(paymentRepository.findByOrder_OrderIdOrderByPaymentDateDesc(50)).thenReturn(List.of(payment));
        when(paymentRepository.sumCompletedAmountByOrderId(50)).thenReturn(new BigDecimal("1000.00"));

        PaymentSummaryDto summary = paymentService.getOrderPaymentSummary(10, Role.BUYER, 50);

        assertThat(summary).isNotNull();
        assertThat(summary.getOrderId()).isEqualTo(50);
        assertThat(summary.getOrderTotal()).isEqualByComparingTo(new BigDecimal("2500.00"));
        assertThat(summary.getTotalPaid()).isEqualByComparingTo(new BigDecimal("1000.00"));
        assertThat(summary.getRemainingBalance()).isEqualByComparingTo(new BigDecimal("1500.00"));
        assertThat(summary.isFullyPaid()).isFalse();
        assertThat(summary.getPayments()).hasSize(1);
    }
}
