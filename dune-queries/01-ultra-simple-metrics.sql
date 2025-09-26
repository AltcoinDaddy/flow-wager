-- Ultra Simple Flow Wager Metrics Query
-- This is the most basic possible query to get started with Flow + Dune
-- Test this first to ensure basic connectivity works

-- Simple event count by type
SELECT
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT DATE(block_time)) as active_days,
    MIN(block_time) as first_event,
    MAX(block_time) as last_event
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
    AND block_time >= CURRENT_DATE - INTERVAL '30' DAY
GROUP BY event_type
ORDER BY event_count DESC;
