-- Flow Wager Volume Over Time Query
-- This query provides daily volume, market creation, and user activity metrics
-- Query ID: Replace with your actual Dune query ID after creation

WITH date_series AS (
  SELECT
    DATE_SUB(CURRENT_DATE, INTERVAL n DAY) as date
  FROM UNNEST(SEQUENCE(0,
    CASE
      WHEN '{{timeframe}}' = '7d' THEN 6
      WHEN '{{timeframe}}' = '30d' THEN 29
      WHEN '{{timeframe}}' = '90d' THEN 89
      ELSE 29
    END
  )) as t(n)
),

daily_bets AS (
  SELECT
    DATE(block_time) as date,
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.bettor') as bettor,
    CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DECIMAL(18,8)) as amount
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'BetPlaced'
    AND DATE(block_time) >= CURRENT_DATE - INTERVAL
      CASE
        WHEN '{{timeframe}}' = '7d' THEN 7
        WHEN '{{timeframe}}' = '30d' THEN 30
        WHEN '{{timeframe}}' = '90d' THEN 90
        ELSE 30
      END DAY
),

daily_markets AS (
  SELECT
    DATE(block_time) as date,
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.creator') as creator
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketCreated'
    AND DATE(block_time) >= CURRENT_DATE - INTERVAL
      CASE
        WHEN '{{timeframe}}' = '7d' THEN 7
        WHEN '{{timeframe}}' = '30d' THEN 30
        WHEN '{{timeframe}}' = '90d' THEN 90
        ELSE 30
      END DAY
),

daily_resolutions AS (
  SELECT
    DATE(block_time) as date,
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketResolved'
    AND DATE(block_time) >= CURRENT_DATE - INTERVAL
      CASE
        WHEN '{{timeframe}}' = '7d' THEN 7
        WHEN '{{timeframe}}' = '30d' THEN 30
        WHEN '{{timeframe}}' = '90d' THEN 90
        ELSE 30
      END DAY
),

daily_fees AS (
  SELECT
    DATE(block_time) as date,
    CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DECIMAL(18,8)) as fee_amount
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'FeeCollected'
    AND DATE(block_time) >= CURRENT_DATE - INTERVAL
      CASE
        WHEN '{{timeframe}}' = '7d' THEN 7
        WHEN '{{timeframe}}' = '30d' THEN 30
        WHEN '{{timeframe}}' = '90d' THEN 90
        ELSE 30
      END DAY
),

daily_aggregates AS (
  SELECT
    ds.date,

    -- Volume metrics
    COALESCE(SUM(db.amount), 0) as daily_volume,
    COUNT(DISTINCT db.market_id) as active_markets,
    COUNT(DISTINCT db.bettor) as active_users,
    COUNT(db.amount) as total_bets,

    -- Market lifecycle metrics
    COUNT(DISTINCT dm.market_id) as new_markets,
    COUNT(DISTINCT dr.market_id) as resolved_markets,

    -- Fee metrics
    COALESCE(SUM(df.fee_amount), 0) as daily_fees,

    -- Average bet size
    CASE
      WHEN COUNT(db.amount) > 0
      THEN SUM(db.amount) / COUNT(db.amount)
      ELSE 0
    END as avg_bet_size

  FROM date_series ds
  LEFT JOIN daily_bets db ON ds.date = db.date
  LEFT JOIN daily_markets dm ON ds.date = dm.date
  LEFT JOIN daily_resolutions dr ON ds.date = dr.date
  LEFT JOIN daily_fees df ON ds.date = df.date
  GROUP BY ds.date
),

cumulative_metrics AS (
  SELECT
    date,
    daily_volume,
    active_markets,
    active_users,
    total_bets,
    new_markets,
    resolved_markets,
    daily_fees,
    avg_bet_size,

    -- Cumulative metrics
    SUM(daily_volume) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) as cumulative_volume,
    SUM(new_markets) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) as cumulative_markets,
    SUM(daily_fees) OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) as cumulative_fees,

    -- Moving averages (7-day)
    AVG(daily_volume) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as volume_7d_ma,
    AVG(active_users) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as users_7d_ma,

    -- Day-over-day growth
    LAG(daily_volume) OVER (ORDER BY date) as prev_day_volume,
    LAG(active_users) OVER (ORDER BY date) as prev_day_users,

    -- Week-over-week comparison
    LAG(daily_volume, 7) OVER (ORDER BY date) as week_ago_volume,
    LAG(active_users, 7) OVER (ORDER BY date) as week_ago_users

  FROM daily_aggregates
)

SELECT
  DATE_FORMAT(date, '%Y-%m-%d') as date,
  CAST(ROUND(daily_volume, 2) AS STRING) as volume,
  active_markets as markets,
  active_users as users,
  total_bets as bets,
  new_markets,
  resolved_markets,
  CAST(ROUND(daily_fees, 4) AS STRING) as fees,
  CAST(ROUND(avg_bet_size, 2) AS STRING) as avg_bet_size,

  -- Growth metrics
  CASE
    WHEN prev_day_volume > 0
    THEN ROUND(((daily_volume - prev_day_volume) / prev_day_volume) * 100, 1)
    ELSE NULL
  END as volume_change_pct,

  CASE
    WHEN prev_day_users > 0
    THEN ROUND(((active_users - prev_day_users) / CAST(prev_day_users AS DOUBLE)) * 100, 1)
    ELSE NULL
  END as users_change_pct,

  -- Week-over-week growth
  CASE
    WHEN week_ago_volume > 0
    THEN ROUND(((daily_volume - week_ago_volume) / week_ago_volume) * 100, 1)
    ELSE NULL
  END as volume_wow_change_pct,

  -- Moving averages
  CAST(ROUND(volume_7d_ma, 2) AS STRING) as volume_7d_avg,
  ROUND(users_7d_ma, 1) as users_7d_avg,

  -- Cumulative metrics
  CAST(ROUND(cumulative_volume, 2) AS STRING) as cumulative_volume,
  cumulative_markets,
  CAST(ROUND(cumulative_fees, 4) AS STRING) as cumulative_fees,

  -- Activity indicators
  CASE
    WHEN daily_volume > volume_7d_ma * 1.5 THEN 'High Volume'
    WHEN active_users > users_7d_ma * 1.3 THEN 'High Activity'
    WHEN new_markets > 2 THEN 'High Market Creation'
    WHEN daily_volume = 0 AND active_users = 0 THEN 'No Activity'
    ELSE 'Normal'
  END as activity_level,

  -- Day of week
  DATE_FORMAT(date, '%W') as day_of_week,

  -- Weekend indicator
  CASE
    WHEN DAYOFWEEK(date) IN (1, 7) THEN TRUE
    ELSE FALSE
  END as is_weekend

FROM cumulative_metrics
ORDER BY date ASC;
