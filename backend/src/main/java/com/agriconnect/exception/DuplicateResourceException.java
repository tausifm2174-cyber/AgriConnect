package com.agriconnect.exception;

/**
 * Thrown when attempting to register a unique constraint duplicate (e.g. duplicate email or phone).
 */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
