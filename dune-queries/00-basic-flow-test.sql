
SELECT
    COUNT(*) as total_events,
    'Contract found in Dune' as status
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'

UNION ALL

-- Test 2: Show recent events (any events from your contract)
SELECT
    1 as total_events,
    event_type as status
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
    AND block_time >= current_date - interval '30 days'
GROUP BY event_type
ORDER BY total_events DESC
LIMIT 10;
