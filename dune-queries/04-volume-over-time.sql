-- Flow Wager Volume Over Time Query
-- This query provides historical volume and activity data for charts
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

-- Daily betting volume
daily_bets AS (
  SELECT
    DATE(block_time) as date,
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.bettor') as bettor,
    CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE) as amount,
    block_time
  FROM market_events
  WHERE event_type = 'BetPlaced'
),

-- Daily market creation
daily_markets AS (
  SELECT
    DATE(block_time) as date,
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.creator') as creator,
    block_time
  FROM market_events
  WHERE event_type = 'MarketCreated'
),

-- Daily market resolutions
daily_resolutions AS (
  SELECT
    DATE(block_time) as date,
    json_extract_scalar(event_data, '$.marketId') as market_id,
    block_time
  FROM market_events
  WHERE event_type = 'MarketResolved'
),

-- Daily user activity (unique users who placed bets)
daily_users AS (
  SELECT
    DATE(block_time) as date,
    COUNT(DISTINCT json_extract_scalar(event_data, '$.bettor')) as unique_users
  FROM market_events
  WHERE event_type = 'BetPlaced'
  GROUP BY DATE(block_time)
),

-- Daily fee collection
daily_fees AS (
  SELECT
    DATE(block_time) as date,
    SUM(CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE)) as total_fees
  FROM market_events
  WHERE event_type = 'FeeCollected'
  GROUP BY DATE(block_time)
),

-- All unique dates in our timeframe
all_dates AS (
  SELECT DISTINCT DATE(block_time) as date
  FROM market_events
  WHERE block_time >= (SELECT start_date FROM time_filter)

  UNION

  SELECT DATE(start_date) as date FROM time_filter
  WHERE DATE(start_date) NOT IN (
    SELECT DISTINCT DATE(block_time)
    FROM market_events
    WHERE block_time >= (SELECT start_date FROM time_filter)
  )
),

-- Aggregate daily metrics
daily_metrics AS (
  SELECT
    ad.date,

    -- Volume metrics
    COALESCE(SUM(db.amount), 0) as daily_volume,
    COUNT(db.market_id) as daily_bet_count,

    -- Market metrics
    COUNT(DISTINCT dm.market_id) as markets_created,
    COUNT(DISTINCT dr.market_id) as markets_resolved,

    -- User metrics
    COALESCE(MAX(du.unique_users), 0) as active_users,

    -- Fee metrics
    COALESCE(MAX(df.total_fees), 0) as fees_collected,

    -- Activity score (weighted by volume and user activity)
    COALESCE(SUM(db.amount), 0) + (COUNT(db.market_id) * 10) + (COALESCE(MAX(du.unique_users), 0) * 5) as activity_score

  FROM all_dates ad
  LEFT JOIN daily_bets db ON ad.date = db.date
  LEFT JOIN daily_markets dm ON ad.date = dm.date
  LEFT JOIN daily_resolutions dr ON ad.date = dr.date
  LEFT JOIN daily_users du ON ad.date = du.date
  LEFT JOIN daily_fees df ON ad.date = df.date
  GROUP BY ad.date
)

-- Final result set
SELECT
  CAST(date AS VARCHAR) as date,
  CAST(daily_volume AS VARCHAR) as volume,
  markets_created as markets,
  active_users as users,
  daily_bet_count as bets,
  markets_resolved as resolutions,
  CAST(fees_collected AS VARCHAR) as fees,
  activity_score
FROM daily_metrics
WHERE date >= (SELECT start_date FROM time_filter)
ORDER BY date ASC;
