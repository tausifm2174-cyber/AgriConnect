package com.agriconnect;

import com.agriconnect.controller.AuthController;
import com.agriconnect.dto.AuthResponse;
import com.agriconnect.dto.LoginRequest;
import com.agriconnect.dto.RegisterRequest;
import com.agriconnect.dto.UserResponse;
import com.agriconnect.entity.Role;
import com.agriconnect.entity.UserStatus;
import com.agriconnect.security.CustomAccessDeniedHandler;
import com.agriconnect.security.CustomAuthenticationEntryPoint;
import com.agriconnect.security.CustomUserDetailsService;
import com.agriconnect.security.JwtTokenProvider;
import com.agriconnect.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false) // Unit test for controller logic & DTO validation
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    @MockBean
    private CustomAccessDeniedHandler customAccessDeniedHandler;

    @Test
    @DisplayName("POST /api/auth/register - Valid request returns 201 Created")
    void register_ValidRequest_ReturnsCreated() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Ramesh Patel",
                "ramesh@kisan.in",
                "+919811122233",
                "Password@123",
                Role.FARMER
        );

        AuthResponse authResponse = new AuthResponse(
                "mock-token-abc",
                1,
                "Ramesh Patel",
                "ramesh@kisan.in",
                "+919811122233",
                Role.FARMER,
                UserStatus.ACTIVE,
                "User registered successfully"
        );

        when(authService.register(any(RegisterRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mock-token-abc"))
                .andExpect(jsonPath("$.email").value("ramesh@kisan.in"))
                .andExpect(jsonPath("$.role").value("FARMER"))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/register - Invalid email format returns 400 Bad Request")
    void register_InvalidEmail_ReturnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Ramesh Patel",
                "not-an-email",
                "+919811122233",
                "Password@123",
                Role.FARMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.email").exists());
    }

    @Test
    @DisplayName("POST /api/auth/register - Password too short returns 400 Bad Request")
    void register_ShortPassword_ReturnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Ramesh Patel",
                "ramesh@kisan.in",
                "+919811122233",
                "123", // under 6 chars
                Role.FARMER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.errors.password").exists());
    }

    @Test
    @DisplayName("POST /api/auth/login - Valid credentials returns 200 OK with token")
    void login_ValidCredentials_ReturnsOk() throws Exception {
        LoginRequest request = new LoginRequest("ramesh@kisan.in", "Password@123");

        AuthResponse authResponse = new AuthResponse(
                "valid-token-xyz",
                1,
                "Ramesh Patel",
                "ramesh@kisan.in",
                "+919811122233",
                Role.FARMER,
                UserStatus.ACTIVE,
                "Authentication successful"
        );

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("valid-token-xyz"))
                .andExpect(jsonPath("$.email").value("ramesh@kisan.in"))
                .andExpect(jsonPath("$.role").value("FARMER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/login - Bad credentials returns 401 Unauthorized")
    void login_InvalidCredentials_ReturnsUnauthorized() throws Exception {
        LoginRequest request = new LoginRequest("ramesh@kisan.in", "WrongPass");

        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("GET /api/auth/me - Authenticated user returns profile details")
    @WithMockUser(username = "ramesh@kisan.in", roles = {"FARMER"})
    void getCurrentUser_Authenticated_ReturnsProfile() throws Exception {
        UserResponse userResponse = new UserResponse(
                1,
                "Ramesh Patel",
                "ramesh@kisan.in",
                "+919811122233",
                Role.FARMER,
                UserStatus.ACTIVE
        );

        when(authService.getCurrentUser("ramesh@kisan.in")).thenReturn(userResponse);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ramesh@kisan.in"))
                .andExpect(jsonPath("$.fullName").value("Ramesh Patel"))
                .andExpect(jsonPath("$.role").value("FARMER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/auth/logout - Returns 200 OK")
    void logout_ReturnsOk() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer sample-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(200))
                .andExpect(jsonPath("$.message").value("Logged out successfully"));
    }
}
