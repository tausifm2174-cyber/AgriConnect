package com.agriconnect.exception;

/**
 * Thrown when an entity cannot be found.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
