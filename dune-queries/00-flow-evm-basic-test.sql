-- Flow EVM Basic Test Query
-- This query tests access to Flow EVM blockchain data in Dune
-- Based on Flow EVM table structure: flow_evm.blocks, flow_evm.transactions, flow_evm.logs
-- Parameters: contract_address

SELECT
    'Contract Events Found' as test_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT block_number) as unique_blocks,
    MIN(block_time) as earliest_event,
    MAX(block_time) as latest_event
FROM flow_evm.logs
WHERE address = lower('{{contract_address}}')
    AND block_time >= current_date - interval '30' day

UNION ALL

SELECT
    'Recent Event Topics' as test_type,
    COUNT(DISTINCT topic0) as unique_topics,
    NULL as unique_blocks,
    NULL as earliest_event,
    NULL as latest_event
FROM flow_evm.logs
WHERE address = lower('{{contract_address}}')
    AND block_time >= current_date - interval '30' day
    AND topic0 IS NOT NULL

UNION ALL

SELECT
    'Transaction Activity' as test_type,
    COUNT(DISTINCT tx_hash) as unique_transactions,
    NULL as unique_blocks,
    NULL as earliest_event,
    NULL as latest_event
FROM flow_evm.logs
WHERE address = lower('{{contract_address}}')
    AND block_time >= current_date - interval '30' day

ORDER BY test_type
