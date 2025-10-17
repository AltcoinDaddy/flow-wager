-- Flow EVM Diagnostic Query
-- This query helps understand the structure of Flow EVM contract events in Dune
-- Use this to identify your contract's event signatures and data structure
-- Parameters: contract_address

WITH contract_events AS (
  SELECT
    block_number,
    block_time,
    tx_hash,
    topic0,
    topic1,
    topic2,
    topic3,
    data,
    address
  FROM flow_evm.logs
  WHERE address = lower('{{contract_address}}')
    AND block_time >= current_date - interval '30' day
),

event_signatures AS (
  SELECT
    topic0,
    COUNT(*) as event_count,
    MIN(block_time) as first_seen,
    MAX(block_time) as last_seen,
    -- Try to decode common event signatures
    CASE
      WHEN topic0 = '0x...' THEN 'MarketCreated' -- Replace with actual event signature hash
      WHEN topic0 = '0x...' THEN 'BetPlaced'     -- Replace with actual event signature hash
      WHEN topic0 = '0x...' THEN 'MarketResolved' -- Replace with actual event signature hash
      ELSE 'Unknown Event'
    END as event_name
  FROM contract_events
  WHERE topic0 IS NOT NULL
  GROUP BY topic0
)

SELECT
  es.topic0 as event_signature,
  es.event_name,
  es.event_count,
  es.first_seen,
  es.last_seen,
  -- Sample event data
  (
    SELECT data
    FROM contract_events ce
    WHERE ce.topic0 = es.topic0
    ORDER BY block_time DESC
    LIMIT 1
  ) as sample_data,
  -- Sample additional topics
  (
    SELECT topic1
    FROM contract_events ce
    WHERE ce.topic0 = es.topic0
      AND topic1 IS NOT NULL
    ORDER BY block_time DESC
    LIMIT 1
  ) as sample_topic1,
  (
    SELECT topic2
    FROM contract_events ce
    WHERE ce.topic0 = es.topic0
      AND topic2 IS NOT NULL
    ORDER BY block_time DESC
    LIMIT 1
  ) as sample_topic2

FROM event_signatures es
ORDER BY es.event_count DESC
