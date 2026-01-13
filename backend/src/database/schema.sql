-- MCP Automated Quoting System - PostgreSQL Schema
-- Created: 2026-01-13

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PRICING RULES TABLES
-- ============================================================================

-- Vehicle tiers and base pricing
CREATE TABLE IF NOT EXISTS pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_type VARCHAR(100) NOT NULL UNIQUE,
    base_fare DECIMAL(10, 2) NOT NULL,
    per_km_rate DECIMAL(10, 2) NOT NULL,
    min_charge DECIMAL(10, 2) DEFAULT 0,
    max_passengers INTEGER NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Time-based multipliers
CREATE TABLE IF NOT EXISTS time_multipliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    multiplier DECIMAL(4, 2) NOT NULL,
    day_of_week INTEGER[], -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    priority INTEGER DEFAULT 0, -- Higher priority wins if overlapping
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Zone charges (Congestion, ULEZ, Airports, etc.)
CREATE TABLE IF NOT EXISTS zone_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zone_name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50) NOT NULL, -- 'congestion', 'ulez', 'airport', 'custom'
    charge_amount DECIMAL(10, 2) NOT NULL,
    applies_to VARCHAR(20) DEFAULT 'both', -- 'pickup', 'dropoff', 'both'
    coordinates JSONB, -- GeoJSON polygon for zone boundaries
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- QUOTES AND BOOKINGS
-- ============================================================================

-- Quote history
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    enquiry_id VARCHAR(100), -- Reference to Redis enquiry
    
    -- Customer details
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_email VARCHAR(255),
    
    -- Journey details
    pickup_location TEXT NOT NULL,
    pickup_lat DECIMAL(10, 7),
    pickup_lng DECIMAL(10, 7),
    dropoff_location TEXT NOT NULL,
    dropoff_lat DECIMAL(10, 7),
    dropoff_lng DECIMAL(10, 7),
    pickup_datetime TIMESTAMP NOT NULL,
    
    -- Vehicle and passengers
    vehicle_type VARCHAR(100) NOT NULL,
    passengers INTEGER,
    luggage INTEGER,
    
    -- Distance and duration
    distance_km DECIMAL(10, 2) NOT NULL,
    duration_minutes INTEGER,
    
    -- Pricing breakdown
    base_fare DECIMAL(10, 2) NOT NULL,
    distance_charge DECIMAL(10, 2) NOT NULL,
    zone_charges JSONB, -- Array of applied zone charges
    time_multiplier DECIMAL(4, 2) DEFAULT 1.0,
    time_multiplier_name VARCHAR(50),
    subtotal DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- Quote status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'modified', 'rejected', 'sent', 'accepted', 'expired'
    pricing_mode VARCHAR(50), -- 'supervised', 'hybrid', 'auto', 'manual'
    
    -- Supervised mode fields
    suggested_amount DECIMAL(10, 2), -- Original calculated amount
    approved_amount DECIMAL(10, 2), -- Final approved amount (may differ)
    approved_by VARCHAR(100),
    approved_at TIMESTAMP,
    modification_reason TEXT,
    
    -- Validity
    valid_until TIMESTAMP,
    
    -- Metadata
    calculation_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    accepted_at TIMESTAMP
);

-- Bookings (confirmed quotes)
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    quote_id UUID REFERENCES quotes(id),
    
    -- Customer details
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    
    -- Journey details (copied from quote)
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    pickup_datetime TIMESTAMP NOT NULL,
    vehicle_type VARCHAR(100) NOT NULL,
    passengers INTEGER,
    
    -- Pricing
    quoted_amount DECIMAL(10, 2) NOT NULL,
    final_amount DECIMAL(10, 2), -- May differ if adjusted
    payment_status VARCHAR(50) DEFAULT 'pending',
    
    -- Status
    status VARCHAR(50) DEFAULT 'confirmed', -- 'confirmed', 'in_progress', 'completed', 'cancelled'
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_enquiry_id ON quotes(enquiry_id);
CREATE INDEX idx_quotes_customer_phone ON quotes(customer_phone);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_pickup_datetime ON quotes(pickup_datetime);

CREATE INDEX idx_bookings_booking_number ON bookings(booking_number);
CREATE INDEX idx_bookings_quote_id ON bookings(quote_id);
CREATE INDEX idx_bookings_customer_phone ON bookings(customer_phone);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_pickup_datetime ON bookings(pickup_datetime);

