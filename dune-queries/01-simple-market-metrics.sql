-- Simple Flow Wager Market Metrics Test Query
-- This is a basic test query to validate Dune connection and Flow data structure
-- Use this first to ensure your contract data is accessible in Dune
-- Parameters: contract_address

-- Basic connection test - count total events
SELECT
  'Total Events' as metric,
  COUNT(*) as value,
  MIN(block_time) as earliest_event,
  MAX(block_time) as latest_event
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'

UNION ALL

-- Count events by type
SELECT
  CONCAT('Events: ', event_type) as metric,
  COUNT(*) as value,
  MIN(block_time) as earliest_event,
  MAX(block_time) as latest_event
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
GROUP BY event_type

UNION ALL

-- Simple market count (last 30 days)
SELECT
  'Markets Created (30d)' as metric,
  COUNT(*) as value,
  NULL as earliest_event,
  NULL as latest_event
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
  AND event_type = 'MarketCreated'
  AND block_time >= current_date - interval '30' day

UNION ALL

-- Simple bet count (last 30 days)
SELECT
  'Bets Placed (30d)' as metric,
  COUNT(*) as value,
  NULL as earliest_event,
  NULL as latest_event
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
  AND event_type = 'BetPlaced'
  AND block_time >= current_date - interval '30' day

UNION ALL

-- Simple volume calculation (last 30 days)
SELECT
  'Total Volume (30d)' as metric,
  CAST(SUM(CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE)) AS BIGINT) as value,
  NULL as earliest_event,
  NULL as latest_event
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
  AND event_type = 'BetPlaced'
  AND block_time >= current_date - interval '30' day
  AND json_extract_scalar(event_data, '$.amount') IS NOT NULL

ORDER BY metric;
