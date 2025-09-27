
WITH market_events AS (
  SELECT
    block_time,
    tx_hash,
    block_number,
    -- Flow events might be structured differently, adjust these paths as needed
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.question') as question,
    cast(json_extract_scalar(event_data, '$.category') as int) as category,
    cast(json_extract_scalar(event_data, '$.endTime') as double) as end_time,
    json_extract_scalar(event_data, '$.creator') as creator
  FROM flow.core.fact_events
  WHERE contract_address = '{{contract_address}}'
    AND event_name = 'MarketCreated'
    AND block_time >= current_date - interval '{{timeframe}}'
),

bet_events AS (
  SELECT
    block_time,
    tx_hash,
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.bettor') as bettor,
    cast(json_extract_scalar(event_data, '$.amount') as double) as amount,
    json_extract_scalar(event_data, '$.option') as option
  FROM flow.core.fact_events
  WHERE contract_address = '{{contract_address}}'
    AND event_name = 'BetPlaced'
    AND block_time >= current_date - interval '{{timeframe}}'
    AND json_extract_scalar(event_data, '$.amount') IS NOT NULL
),

resolution_events AS (
  SELECT
    block_time,
    tx_hash,
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.winningOption') as winning_option
  FROM flow.core.fact_events
  WHERE contract_address = '{{contract_address}}'
    AND event_name = 'MarketResolved'
    AND block_time >= current_date - interval '{{timeframe}}'
),

-- Category mapping
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

-- Market statistics
market_stats AS (
  SELECT
    m.market_id,
    m.question,
    cn.category_name,
    COUNT(DISTINCT b.bettor) as unique_bettors,
    COALESCE(SUM(b.amount), 0) as total_volume,
    COUNT(b.tx_hash) as total_bets,
    CASE WHEN r.market_id IS NOT NULL THEN 1 ELSE 0 END as is_resolved,
    m.end_time,
    -- Calculate duration in hours (end_time is unix timestamp)
    CASE
      WHEN m.end_time > 0
      THEN (m.end_time - date_part('epoch', m.block_time)) / 3600.0
      ELSE 0
    END as duration_hours
  FROM market_events m
  LEFT JOIN bet_events b ON m.market_id = b.market_id
  LEFT JOIN resolution_events r ON m.market_id = r.market_id
  LEFT JOIN category_names cn ON m.category = cn.category_id
  GROUP BY m.market_id, m.question, cn.category_name, m.end_time, m.block_time, r.market_id
),

-- Calculate active users across all markets
active_users_calc AS (
  SELECT COUNT(DISTINCT bettor) as total_active_users
  FROM bet_events
  WHERE amount > 0
)

-- Main metrics output
SELECT
  COUNT(DISTINCT market_id) as total_markets,
  COALESCE(SUM(total_volume), 0) as total_volume,
  COUNT(DISTINCT CASE WHEN total_bets > 0 THEN market_id END) as markets_with_activity,
  COUNT(DISTINCT CASE WHEN is_resolved = 1 THEN market_id END) as successful_resolutions,
  COALESCE(AVG(duration_hours), 0) as avg_duration_hours,

  -- Get most popular category
  (
    SELECT category_name
    FROM market_stats
    WHERE category_name IS NOT NULL
    GROUP BY category_name
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ) as top_category,

  -- Calculate total fees (assuming 2.5% of volume)
  COALESCE(SUM(total_volume) * 0.025, 0) as total_fees,

  -- Get active users count
  (SELECT total_active_users FROM active_users_calc) as active_users

FROM market_stats

UNION ALL

-- Category breakdown (top 5 categories)
SELECT
  NULL as total_markets,
  SUM(total_volume) as total_volume,
  NULL as markets_with_activity,
  NULL as successful_resolutions,
  NULL as avg_duration_hours,
  category_name as top_category,
  NULL as total_fees,
  NULL as active_users
FROM market_stats
WHERE category_name IS NOT NULL
GROUP BY category_name
ORDER BY SUM(total_volume) DESC
LIMIT 5;
