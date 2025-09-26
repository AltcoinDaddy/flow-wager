-- Flow Data Structure Diagnostic Query
-- Use this query to understand how Flow events are structured in Dune
-- This will help you adapt the other queries to work with your specific contract

-- First, let's see what Flow tables are available
-- Uncomment one section at a time to test

-- SECTION 1: Explore available Flow tables
-- SELECT table_name, table_schema
-- FROM information_schema.tables
-- WHERE table_schema LIKE '%flow%'
-- LIMIT 20;

-- SECTION 2: Look for your contract events (replace with your contract address)
SELECT
    block_time,
    block_number,
    tx_hash,
    event_index,
    event_type,
    contract_address,
    event_data,
    -- Try to see the structure of event_data
    json_extract_scalar(event_data, '$.marketId') as market_id_attempt1,
    json_extract_scalar(event_data, '$.market_id') as market_id_attempt2,
    json_extract(event_data, '$.marketId') as market_id_attempt3
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
    AND block_time >= current_date - interval '7 days'
ORDER BY block_time DESC
LIMIT 10;

-- SECTION 3: Check specific event types (uncomment to test)
-- SELECT DISTINCT event_type, COUNT(*) as event_count
-- FROM flow.core.fact_events
-- WHERE contract_address = '{{contract_address}}'
--     AND block_time >= current_date - interval '30 days'
-- GROUP BY event_type
-- ORDER BY event_count DESC;

-- SECTION 4: Detailed look at MarketCreated events
-- SELECT
--     block_time,
--     tx_hash,
--     event_data,
--     -- Try different ways to extract data
--     json_extract_scalar(event_data, '$.marketId') as market_id,
--     json_extract_scalar(event_data, '$.question') as question,
--     json_extract_scalar(event_data, '$.category') as category,
--     json_extract_scalar(event_data, '$.endTime') as end_time,
--     json_extract_scalar(event_data, '$.creator') as creator
-- FROM flow.core.fact_events
-- WHERE contract_address = '{{contract_address}}'
--     AND event_type = 'MarketCreated'
--     AND block_time >= current_date - interval '30 days'
-- ORDER BY block_time DESC
-- LIMIT 5;

-- SECTION 5: Check if it's fact_transactions instead
-- SELECT
--     block_time,
--     tx_hash,
--     transaction_result,
--     events
-- FROM flow.core.fact_transactions
-- WHERE array_contains(authorizers, '{{contract_address}}')
--     AND block_time >= current_date - interval '7 days'
-- ORDER BY block_time DESC
-- LIMIT 5;
