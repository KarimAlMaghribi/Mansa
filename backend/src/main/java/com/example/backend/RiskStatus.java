package com.example.backend;

/**
 * Possible publication states for a risk entry.
 */
public enum RiskStatus {
    /** Item is being prepared and not yet visible. */
    DRAFT,
    /** Item has been published and is visible to others. */
    PUBLISHED,
    /** An offer has been made based on this item. */
    DEAL,
    /** A formal agreement was reached. */
    AGREEMENT,
    /** Item has been withdrawn from the platform. */
    WITHDRAWN
}
