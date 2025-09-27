
SELECT
    COUNT(*) as total_events,
    COUNT(DISTINCT tx_hash) as unique_transactions,
    MIN(block_time) as earliest_event,
    MAX(block_time) as latest_event,
    COUNT(DISTINCT DATE(block_time)) as active_days
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
    AND block_time >= current_date - interval '30 days'

UNION ALL

-- Get event type breakdown
SELECT
    event_type as total_events,
    COUNT(*) as unique_transactions,
    MIN(block_time) as earliest_event,
    MAX(block_time) as latest_event,
    1 as active_days
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
    AND block_time >= current_date - interval '30 days'
GROUP BY event_type
ORDER BY unique_transactions DESC
LIMIT 10;
