-- MCP Automated Quoting System - Initial Data Seed
-- Created: 2026-01-13

-- ============================================================================
-- PRICING RULES - Vehicle Tiers
-- ============================================================================

INSERT INTO pricing_rules (vehicle_type, base_fare, per_km_rate, max_passengers, description) VALUES
('Standard Sedan', 50.00, 2.00, 4, 'Comfortable sedan for up to 4 passengers'),
('Executive Sedan', 60.00, 2.50, 4, 'Premium sedan with executive service'),
('Luxury Sedan', 80.00, 3.00, 4, 'Luxury sedan with premium amenities'),
('Executive MPV', 100.00, 3.80, 6, 'Executive MPV for up to 6 passengers'),
('Luxury MPV', 120.00, 4.50, 7, 'Luxury MPV with premium service')
ON CONFLICT (vehicle_type) DO UPDATE SET
    base_fare = EXCLUDED.base_fare,
    per_km_rate = EXCLUDED.per_km_rate,
    max_passengers = EXCLUDED.max_passengers,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- TIME MULTIPLIERS
-- ============================================================================

-- Peak Hours: Monday-Friday 7:00-10:00 (Morning Rush)
INSERT INTO time_multipliers (name, multiplier, day_of_week, start_time, end_time, priority) VALUES
('Peak Morning', 1.3, ARRAY[1,2,3,4,5], '07:00:00', '10:00:00', 10);

-- Peak Hours: Monday-Friday 16:00-19:00 (Evening Rush)
INSERT INTO time_multipliers (name, multiplier, day_of_week, start_time, end_time, priority) VALUES
('Peak Evening', 1.3, ARRAY[1,2,3,4,5], '16:00:00', '19:00:00', 10);

-- Standard Hours: Monday-Friday 10:00-16:00
INSERT INTO time_multipliers (name, multiplier, day_of_week, start_time, end_time, priority) VALUES
('Standard Daytime', 1.0, ARRAY[1,2,3,4,5], '10:00:00', '16:00:00', 5);

-- Standard Hours: Monday-Friday 19:00-22:00
INSERT INTO time_multipliers (name, multiplier, day_of_week, start_time, end_time, priority) VALUES
('Standard Evening', 1.0, ARRAY[1,2,3,4,5], '19:00:00', '22:00:00', 5);

-- Off-Peak: Monday-Friday Night (22:00-07:00)
INSERT INTO time_multipliers (name, multiplier, day_of_week, start_time, end_time, priority) VALUES
('Off-Peak Night Weekday', 0.9, ARRAY[1,2,3,4,5], '22:00:00', '23:59:59', 3);

INSERT INTO time_multipliers (name, multiplier, day_of_week, start_time, end_time, priority) VALUES
('Off-Peak Early Morning Weekday', 0.9, ARRAY[1,2,3,4,5], '00:00:00', '07:00:00', 3);

-- Off-Peak: Saturday All Day
INSERT INTO time_multipliers (name, multiplier, day_of_week, start_time, end_time, priority) VALUES
('Off-Peak Saturday', 0.9, ARRAY[6], '00:00:00', '23:59:59', 3);

-- Off-Peak: Sunday All Day
INSERT INTO time_multipliers (name, multiplier, day_of_week, start_time, end_time, priority) VALUES
('Off-Peak Sunday', 0.9, ARRAY[0], '00:00:00', '23:59:59', 3);

-- ============================================================================
-- ZONE CHARGES
-- ============================================================================

-- London Congestion Charge Zone
INSERT INTO zone_charges (zone_name, zone_type, charge_amount, applies_to, coordinates) VALUES
('London Congestion Charge Zone', 'congestion', 15.00, 'both', 
'{"type":"Polygon","coordinates":[[[-0.1276,51.5074],[-0.0878,51.5074],[-0.0878,51.5200],[-0.1276,51.5200],[-0.1276,51.5074]]]}');

-- London ULEZ (Ultra Low Emission Zone)
INSERT INTO zone_charges (zone_name, zone_type, charge_amount, applies_to, coordinates) VALUES
('London ULEZ', 'ulez', 12.50, 'both',
'{"type":"Polygon","coordinates":[[[-0.1500,51.4900],[-0.0500,51.4900],[-0.0500,51.5400],[-0.1500,51.5400],[-0.1500,51.4900]]]}');

-- Airport Fees
INSERT INTO zone_charges (zone_name, zone_type, charge_amount, applies_to, coordinates) VALUES
('Heathrow Airport', 'airport', 5.00, 'pickup', 
'{"type":"Point","coordinates":[-0.4543,51.4700]}');

INSERT INTO zone_charges (zone_name, zone_type, charge_amount, applies_to, coordinates) VALUES
('Gatwick Airport', 'airport', 5.00, 'pickup',
'{"type":"Point","coordinates":[-0.1903,51.1537]}');

INSERT INTO zone_charges (zone_name, zone_type, charge_amount, applies_to, coordinates) VALUES
('Stansted Airport', 'airport', 5.00, 'pickup',
'{"type":"Point","coordinates":[0.2350,51.8860]}');

INSERT INTO zone_charges (zone_name, zone_type, charge_amount, applies_to, coordinates) VALUES
('Luton Airport', 'airport', 5.00, 'pickup',
'{"type":"Point","coordinates":[-0.3683,51.8747]}');

INSERT INTO zone_charges (zone_name, zone_type, charge_amount, applies_to, coordinates) VALUES
('London City Airport', 'airport', 5.00, 'pickup',
'{"type":"Point","coordinates":[0.0553,51.5053]}');

-- ============================================================================
-- ANALYTICS VIEWS (Optional - for reporting)
-- ============================================================================

-- View for quote statistics
CREATE OR REPLACE VIEW quote_statistics AS
SELECT 
    DATE(created_at) as quote_date,
    COUNT(*) as total_quotes,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_quotes,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_quotes,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_quotes,
    AVG(total_amount) as avg_quote_amount,
    SUM(CASE WHEN status = 'accepted' THEN total_amount ELSE 0 END) as total_revenue,
    AVG(calculation_time_ms) as avg_calculation_time_ms
FROM quotes
GROUP BY DATE(created_at)
ORDER BY quote_date DESC;

-- View for supervised mode approval statistics
CREATE OR REPLACE VIEW supervised_mode_stats AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_quotes,
    COUNT(CASE WHEN status = 'approved' AND suggested_amount = approved_amount THEN 1 END) as approved_as_is,
    COUNT(CASE WHEN status = 'approved' AND suggested_amount != approved_amount THEN 1 END) as modified,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected,
    AVG(EXTRACT(EPOCH FROM (approved_at - created_at))) as avg_approval_time_seconds
FROM quotes
WHERE pricing_mode = 'supervised'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- View for vehicle type performance
CREATE OR REPLACE VIEW vehicle_performance AS
SELECT 
    vehicle_type,
    COUNT(*) as total_quotes,
    COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted,
    ROUND(COUNT(CASE WHEN status = 'accepted' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as acceptance_rate,
    AVG(total_amount) as avg_amount,
    SUM(CASE WHEN status = 'accepted' THEN total_amount ELSE 0 END) as total_revenue
FROM quotes
GROUP BY vehicle_type
ORDER BY total_revenue DESC;

