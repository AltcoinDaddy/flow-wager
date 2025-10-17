-- Flow Data Diagnostic Query (Single Statement)
-- This query helps understand the structure of Flow blockchain data in Dune
-- Use this first to understand how your contract events appear in Dune
-- Parameters: contract_address

SELECT
    event_type,
    COUNT(*) as event_count,
    MIN(block_time) as first_occurrence,
    MAX(block_time) as last_occurrence,
    -- Sample of event data to understand structure
    MAX(event_data) as sample_event_data
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
GROUP BY event_type
ORDER BY event_count DESC
