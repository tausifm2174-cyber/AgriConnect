package com.agriconnect;

import com.agriconnect.controller.HealthController;
import com.agriconnect.dto.HealthResponse;
import com.agriconnect.service.HealthService;
import com.agriconnect.security.CustomAccessDeniedHandler;
import com.agriconnect.security.CustomAuthenticationEntryPoint;
import com.agriconnect.security.CustomUserDetailsService;
import com.agriconnect.security.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(HealthController.class)
@AutoConfigureMockMvc(addFilters = false)
class AgriConnectApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HealthService healthService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @MockBean
    private CustomAuthenticationEntryPoint customAuthenticationEntryPoint;

    @MockBean
    private CustomAccessDeniedHandler customAccessDeniedHandler;

    @Test
    void healthEndpointShouldReturnStatusUp() throws Exception {
        HealthResponse mockResponse = new HealthResponse(
                "UP",
                "AgriConnect",
                "Phase 1",
                "Connected (agriconnect_db)",
                LocalDateTime.now()
        );

        when(healthService.getSystemHealth()).thenReturn(mockResponse);

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.application").value("AgriConnect"))
                .andExpect(jsonPath("$.phase").value("Phase 1"))
                .andExpect(jsonPath("$.database").value("Connected (agriconnect_db)"));
    }
}
