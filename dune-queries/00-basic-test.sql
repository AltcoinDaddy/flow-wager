-- Basic Flow Contract Test Query
-- This is the simplest possible query to test your Flow contract data in Dune
-- Parameters: contract_address

SELECT
    COUNT(*) as total_events,
    COUNT(DISTINCT event_type) as unique_event_types,
    MIN(block_time) as earliest_event,
    MAX(block_time) as latest_event
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
