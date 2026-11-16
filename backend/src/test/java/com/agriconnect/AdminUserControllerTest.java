package com.agriconnect;

import com.agriconnect.controller.AdminUserController;
import com.agriconnect.dto.AdminUserResponse;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.entity.UserStatus;
import com.agriconnect.exception.GlobalExceptionHandler;
import com.agriconnect.security.CustomUserDetails;
import com.agriconnect.security.JwtTokenProvider;
import com.agriconnect.service.AdminUserService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = {AdminUserController.class})
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminUserService adminUserService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private com.agriconnect.security.JwtAuthenticationFilter jwtAuthenticationFilter;

    private User adminUser;

    @BeforeEach
    void setUp() {
        adminUser = new User("System Admin", "admin@agriconnect.com", "9999999999", "secret", Role.ADMIN, UserStatus.ACTIVE);
        adminUser.setUserId(1);

        CustomUserDetails userDetails = new CustomUserDetails(adminUser);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("GET /api/admin/users: Returns 200 with list of users")
    void testGetUsers() throws Exception {
        AdminUserResponse user = new AdminUserResponse(10, "Kisan Kumar", "kisan@example.com", "9876543210",
                Role.FARMER, UserStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(adminUserService.getUsers(any(), any(), any())).thenReturn(List.of(user));

        mockMvc.perform(get("/api/admin/users?role=FARMER")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data[0].userId").value(10))
                .andExpect(jsonPath("$.data[0].fullName").value("Kisan Kumar"))
                .andExpect(jsonPath("$.data[0].role").value("FARMER"));
    }

    @Test
    @DisplayName("GET /api/admin/users/{id}: Returns 200 with single user details")
    void testGetUserById() throws Exception {
        AdminUserResponse user = new AdminUserResponse(20, "Buyer Corp", "buyer@example.com", "9876543211",
                Role.BUYER, UserStatus.ACTIVE, LocalDateTime.now(), LocalDateTime.now());

        when(adminUserService.getUserById(20)).thenReturn(user);

        mockMvc.perform(get("/api/admin/users/20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.data.userId").value(20))
                .andExpect(jsonPath("$.data.fullName").value("Buyer Corp"))
                .andExpect(jsonPath("$.data.role").value("BUYER"));
    }
}
