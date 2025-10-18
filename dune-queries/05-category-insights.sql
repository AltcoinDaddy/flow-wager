-- Flow Wager Category Insights Query (Simplified for Dune Compatibility)
-- This query provides performance breakdown by market categories
-- Parameters: contract_address

WITH market_events AS (
  SELECT *
  FROM flow.core.fact_events
  WHERE contract_address = '{{contract_address}}'
    AND block_time >= current_date - interval '90' day
),

markets_created AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    COALESCE(json_extract_scalar(event_data, '$.category'), 'Unknown') as category,
    CAST(json_extract_scalar(event_data, '$.endTime') AS DOUBLE) as end_time,
    block_time as created_at
  FROM market_events
  WHERE event_type = 'MarketCreated'
),

markets_resolved AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    block_time as resolved_at
  FROM market_events
  WHERE event_type = 'MarketResolved'
),

category_bets AS (
  SELECT
    mc.category,
    json_extract_scalar(me.event_data, '$.marketId') as market_id,
    json_extract_scalar(me.event_data, '$.bettor') as bettor,
    CAST(json_extract_scalar(me.event_data, '$.amount') AS DOUBLE) as amount,
    me.block_time as bet_time
  FROM market_events me
  JOIN markets_created mc ON json_extract_scalar(me.event_data, '$.marketId') = mc.market_id
  WHERE me.event_type = 'BetPlaced'
),

category_fees AS (
  SELECT
    mc.category,
    CAST(json_extract_scalar(me.event_data, '$.amount') AS DOUBLE) as fee_amount
  FROM market_events me
  JOIN markets_created mc ON json_extract_scalar(me.event_data, '$.marketId') = mc.market_id
  WHERE me.event_type = 'FeeCollected'
),

category_success_rates AS (
  SELECT
    mc.category,
    COUNT(DISTINCT mc.market_id) as total_markets,
    COUNT(DISTINCT mr.market_id) as resolved_markets,
    CASE
      WHEN COUNT(DISTINCT mc.market_id) > 0
      THEN CAST(COUNT(DISTINCT mr.market_id) AS DOUBLE) / COUNT(DISTINCT mc.market_id)
      ELSE 0
    END as success_rate
  FROM markets_created mc
  LEFT JOIN markets_resolved mr ON mc.market_id = mr.market_id
  GROUP BY mc.category
),

category_resolution_times AS (
  SELECT
    mc.category,
    AVG(
      CASE
        WHEN mr.resolved_at IS NOT NULL AND mc.end_time IS NOT NULL
        THEN (unix_timestamp(mr.resolved_at) - mc.end_time) / 3600.0
        ELSE NULL
      END
    ) as avg_resolution_time
  FROM markets_created mc
  LEFT JOIN markets_resolved mr ON mc.market_id = mr.market_id
  WHERE mr.resolved_at IS NOT NULL AND mc.end_time IS NOT NULL
  GROUP BY mc.category
)

-- Main query combining all metrics
SELECT
  cb.category,
  CAST(SUM(cb.amount) AS VARCHAR) as volume,
  COUNT(DISTINCT cb.market_id) as markets,
  COUNT(DISTINCT cb.bettor) as unique_users,
  COUNT(*) as total_bets,
  CAST(AVG(cb.amount) AS VARCHAR) as avg_bet_size,
  COALESCE(csr.success_rate, 0) as success_rate,
  COALESCE(crt.avg_resolution_time, 0) as avg_resolution_time,
  CAST(SUM(cf.fee_amount) AS VARCHAR) as total_fees

FROM category_bets cb
LEFT JOIN category_success_rates csr ON cb.category = csr.category
LEFT JOIN category_resolution_times crt ON cb.category = crt.category
LEFT JOIN category_fees cf ON cb.category = cf.category
GROUP BY
  cb.category,
  csr.success_rate,
  crt.avg_resolution_time
HAVING SUM(cb.amount) > 0
ORDER BY SUM(cb.amount) DESC;
