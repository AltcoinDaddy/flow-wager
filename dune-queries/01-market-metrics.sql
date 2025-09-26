-- Flow Wager Market Metrics Query
-- This query provides comprehensive metrics about prediction markets on Flow blockchain
-- Query ID: Replace with your actual Dune query ID after creation

WITH market_events AS (
  SELECT
    block_time,
    tx_hash,
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.question') as question,
    JSON_EXTRACT_SCALAR(event_data, '$.category') as category,
    JSON_EXTRACT_SCALAR(event_data, '$.endTime') as end_time,
    JSON_EXTRACT_SCALAR(event_data, '$.creator') as creator,
    JSON_EXTRACT_SCALAR(event_data, '$.minBet') as min_bet,
    JSON_EXTRACT_SCALAR(event_data, '$.maxBet') as max_bet
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketCreated'
    AND block_time >= CURRENT_DATE - INTERVAL '{{timeframe}}'
),

bet_events AS (
  SELECT
    block_time,
    tx_hash,
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.bettor') as bettor,
    CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DECIMAL(18,8)) as amount,
    JSON_EXTRACT_SCALAR(event_data, '$.option') as option
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'BetPlaced'
    AND block_time >= CURRENT_DATE - INTERVAL '{{timeframe}}'
),

resolution_events AS (
  SELECT
    block_time,
    tx_hash,
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.winningOption') as winning_option,
    JSON_EXTRACT_SCALAR(event_data, '$.resolver') as resolver
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketResolved'
    AND block_time >= CURRENT_DATE - INTERVAL '{{timeframe}}'
),

fee_events AS (
  SELECT
    block_time,
    tx_hash,
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DECIMAL(18,8)) as fee_amount
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'FeeCollected'
    AND block_time >= CURRENT_DATE - INTERVAL '{{timeframe}}'
),

category_names AS (
  SELECT 0 as category_id, 'Sports' as category_name
  UNION ALL SELECT 1, 'Entertainment'
  UNION ALL SELECT 2, 'Technology'
  UNION ALL SELECT 3, 'Economics'
  UNION ALL SELECT 4, 'Weather'
  UNION ALL SELECT 5, 'Crypto'
  UNION ALL SELECT 6, 'Politics'
  UNION ALL SELECT 7, 'Breaking News'
  UNION ALL SELECT 8, 'Other'
),

market_stats AS (
  SELECT
    m.market_id,
    m.question,
    cn.category_name,
    COUNT(DISTINCT b.bettor) as unique_bettors,
    COALESCE(SUM(b.amount), 0) as total_volume,
    COUNT(b.tx_hash) as total_bets,
    CASE WHEN r.market_id IS NOT NULL THEN 1 ELSE 0 END as is_resolved,
    CAST(m.end_time AS DECIMAL) as end_time_unix,
    CAST(m.end_time AS DOUBLE) - UNIX_TIMESTAMP(m.block_time) as duration_seconds
  FROM market_events m
  LEFT JOIN bet_events b ON m.market_id = b.market_id
  LEFT JOIN resolution_events r ON m.market_id = r.market_id
  LEFT JOIN category_names cn ON CAST(m.category AS INTEGER) = cn.category_id
  GROUP BY 1,2,3,4,8,9
)

-- Main metrics output
SELECT
  COUNT(DISTINCT market_id) as total_markets,
  COALESCE(SUM(total_volume), 0) as total_volume,
  COUNT(DISTINCT CASE WHEN total_bets > 0 THEN market_id END) as markets_with_activity,
  COUNT(DISTINCT CASE WHEN is_resolved = 1 THEN market_id END) as successful_resolutions,
  AVG(duration_seconds / 3600.0) as avg_duration_hours,
  (
    SELECT category_name
    FROM market_stats
    GROUP BY category_name
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) as top_category,
  COALESCE(
    (SELECT SUM(fee_amount) FROM fee_events),
    0
  ) as total_fees,
  COUNT(DISTINCT
    CASE WHEN total_bets > 0
    THEN (SELECT COUNT(DISTINCT bettor) FROM bet_events WHERE market_id IN (SELECT market_id FROM market_stats))
    END
  ) as active_users

FROM market_stats

UNION ALL

-- Category breakdown
SELECT
  NULL as total_markets,
  NULL as total_volume,
  NULL as markets_with_activity,
  NULL as successful_resolutions,
  NULL as avg_duration_hours,
  category_name as top_category,
  NULL as total_fees,
  NULL as active_users
FROM (
  SELECT
    category_name,
    COUNT(*) as market_count,
    SUM(total_volume) as category_volume,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
  FROM market_stats
  WHERE category_name IS NOT NULL
  GROUP BY category_name
  ORDER BY market_count DESC
  LIMIT 10
) category_stats
WHERE rn <= 10;
