package com.agriconnect.exception;

/**
 * Thrown when client input fails business validation.
 */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
