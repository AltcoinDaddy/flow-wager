-- Flow Wager Platform Market Metrics Query
-- This query provides comprehensive platform statistics for the specified timeframe
-- Parameters: contract_address, timeframe (7d, 30d, 90d)

WITH time_filter AS (
  SELECT
    CASE
      WHEN '{{timeframe}}' = '7d' THEN current_date - interval '7' day
      WHEN '{{timeframe}}' = '30d' THEN current_date - interval '30' day
      WHEN '{{timeframe}}' = '90d' THEN current_date - interval '90' day
      ELSE current_date - interval '30' day
    END as start_date
),

market_events AS (
  SELECT *
  FROM flow.core.fact_events
  WHERE contract_address = '{{contract_address}}'
    AND block_time >= (SELECT start_date FROM time_filter)
),

markets_created AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.question') as question,
    json_extract_scalar(event_data, '$.category') as category,
    json_extract_scalar(event_data, '$.endTime') as end_time,
    json_extract_scalar(event_data, '$.creator') as creator,
    block_time as created_at
  FROM market_events
  WHERE event_type = 'MarketCreated'
),

bets_placed AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.bettor') as bettor,
    CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE) as amount,
    json_extract_scalar(event_data, '$.option') as option,
    block_time as bet_time
  FROM market_events
  WHERE event_type = 'BetPlaced'
),

markets_resolved AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.winningOption') as winning_option,
    json_extract_scalar(event_data, '$.resolver') as resolver,
    block_time as resolved_at
  FROM market_events
  WHERE event_type = 'MarketResolved'
),

fees_collected AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE) as fee_amount,
    block_time as fee_time
  FROM market_events
  WHERE event_type = 'FeeCollected'
),

market_durations AS (
  SELECT
    mc.market_id,
    mc.category,
    CASE
      WHEN mr.resolved_at IS NOT NULL AND mc.end_time IS NOT NULL
      THEN (UNIX_TIMESTAMP(mr.resolved_at) - CAST(mc.end_time AS DOUBLE)) / 3600.0
      ELSE NULL
    END as duration_hours
  FROM markets_created mc
  LEFT JOIN markets_resolved mr ON mc.market_id = mr.market_id
),

category_stats AS (
  SELECT
    COALESCE(mc.category, 'Unknown') as category,
    COUNT(DISTINCT mc.market_id) as market_count,
    COALESCE(SUM(bp.amount), 0) as total_volume,
    COUNT(DISTINCT bp.bettor) as unique_bettors
  FROM markets_created mc
  LEFT JOIN bets_placed bp ON mc.market_id = bp.market_id
  GROUP BY mc.category
)

-- Main metrics query
SELECT
  -- Basic counts
  COUNT(DISTINCT mc.market_id) as total_markets,
  COUNT(DISTINCT bp.bettor) as active_users,
  COUNT(DISTINCT mr.market_id) as successful_resolutions,

  -- Volume metrics
  COALESCE(SUM(bp.amount), 0) as total_volume,
  COALESCE(SUM(fc.fee_amount), 0) as total_fees,
  CASE
    WHEN COUNT(DISTINCT bp.bettor) > 0
    THEN COALESCE(SUM(bp.amount), 0) / COUNT(DISTINCT bp.bettor)
    ELSE 0
  END as avg_volume_per_user,

  -- Duration metrics
  AVG(md.duration_hours) as avg_duration,

  -- Success rate
  CASE
    WHEN COUNT(DISTINCT mc.market_id) > 0
    THEN CAST(COUNT(DISTINCT mr.market_id) AS DOUBLE) / COUNT(DISTINCT mc.market_id)
    ELSE 0
  END as success_rate,

  -- Top category
  (
    SELECT category
    FROM category_stats
    ORDER BY total_volume DESC
    LIMIT 1
  ) as top_category

FROM markets_created mc
LEFT JOIN bets_placed bp ON mc.market_id = bp.market_id
LEFT JOIN markets_resolved mr ON mc.market_id = mr.market_id
LEFT JOIN fees_collected fc ON mc.market_id = fc.market_id
LEFT JOIN market_durations md ON mc.market_id = md.market_id

UNION ALL

-- Category breakdown (returned as additional rows)
SELECT
  NULL as total_markets,
  NULL as active_users,
  NULL as successful_resolutions,
  cs.total_volume,
  NULL as total_fees,
  NULL as avg_volume_per_user,
  NULL as avg_duration,
  NULL as success_rate,
  cs.category as top_category
FROM category_stats cs
ORDER BY cs.total_volume DESC;
