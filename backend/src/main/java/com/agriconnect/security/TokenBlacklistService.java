package com.agriconnect.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory thread-safe blacklist for invalidated JWT tokens upon logout.
 * Ensures logged-out tokens cannot access protected endpoints.
 */
@Service
public class TokenBlacklistService {

    private static final Logger log = LoggerFactory.getLogger(TokenBlacklistService.class);
    private final Map<String, Instant> blacklistedTokens = new ConcurrentHashMap<>();

    /**
     * Add token to blacklist until it naturally expires.
     */
    public void blacklistToken(String token, Instant expiresAt) {
        if (token != null && !token.isBlank()) {
            cleanExpiredTokens();
            blacklistedTokens.put(token, expiresAt != null ? expiresAt : Instant.now().plusSeconds(86400));
            log.debug("Token blacklisted successfully");
        }
    }

    /**
     * Check if token is blacklisted.
     */
    public boolean isBlacklisted(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        Instant expiresAt = blacklistedTokens.get(token);
        if (expiresAt == null) {
            return false;
        }
        if (expiresAt.isBefore(Instant.now())) {
            blacklistedTokens.remove(token);
            return false;
        }
        return true;
    }

    /**
     * Periodically clean expired tokens from the blacklist memory map.
     */
    private void cleanExpiredTokens() {
        Instant now = Instant.now();
        blacklistedTokens.entrySet().removeIf(entry -> entry.getValue().isBefore(now));
    }
}
