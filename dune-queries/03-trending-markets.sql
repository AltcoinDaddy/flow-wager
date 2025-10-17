-- Flow Wager Trending Markets Query
-- This query identifies the most popular active markets by volume and activity
-- Parameters: contract_address, limit

WITH market_events AS (
  SELECT *
  FROM flow.core.fact_events
  WHERE contract_address = '{{contract_address}}'
    AND block_time >= current_date - interval '30' day
),

markets_created AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.question') as question,
    json_extract_scalar(event_data, '$.category') as category,
    json_extract_scalar(event_data, '$.optionA') as option_a,
    json_extract_scalar(event_data, '$.optionB') as option_b,
    CAST(json_extract_scalar(event_data, '$.endTime') AS DOUBLE) as end_time,
    json_extract_scalar(event_data, '$.creator') as creator,
    block_time as created_at
  FROM market_events
  WHERE event_type = 'MarketCreated'
),

markets_resolved AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.winningOption') as winning_option,
    block_time as resolved_at
  FROM market_events
  WHERE event_type = 'MarketResolved'
),

-- Only consider active (unresolved) markets
active_markets AS (
  SELECT mc.*
  FROM markets_created mc
  LEFT JOIN markets_resolved mr ON mc.market_id = mr.market_id
  WHERE mr.market_id IS NULL  -- Not resolved yet
    AND mc.end_time > unix_timestamp(current_timestamp)  -- Not expired
),

-- Calculate betting activity for each market
market_activity AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    COUNT(*) as total_bets,
    COUNT(DISTINCT json_extract_scalar(event_data, '$.bettor')) as unique_participants,
    SUM(CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE)) as total_volume,
    AVG(CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE)) as avg_bet_size,
    MAX(block_time) as last_activity,
    -- Activity score: recent activity weighted higher
    SUM(
      CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE) *
      EXP(-1.0 * (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) - UNIX_TIMESTAMP(block_time)) / 86400.0)
    ) as activity_score
  FROM market_events
  WHERE event_type = 'BetPlaced'
  GROUP BY json_extract_scalar(event_data, '$.marketId')
),

-- Calculate option distribution for odds
option_distribution AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.option') as chosen_option,
    COUNT(*) as option_bets,
    SUM(CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE)) as option_volume
  FROM market_events
  WHERE event_type = 'BetPlaced'
  GROUP BY
    json_extract_scalar(event_data, '$.marketId'),
    json_extract_scalar(event_data, '$.option')
),

-- Calculate implied probabilities
market_odds AS (
  SELECT
    market_id,
    SUM(option_volume) as total_market_volume,
    MAX(CASE WHEN chosen_option = am.option_a THEN option_volume END) as option_a_volume,
    MAX(CASE WHEN chosen_option = am.option_b THEN option_volume END) as option_b_volume
  FROM option_distribution od
  JOIN active_markets am ON od.market_id = am.market_id
  GROUP BY market_id
),

-- Final trending calculation
trending_score AS (
  SELECT
    am.*,
    COALESCE(ma.total_bets, 0) as total_bets,
    COALESCE(ma.unique_participants, 0) as participants,
    COALESCE(ma.total_volume, 0) as volume,
    COALESCE(ma.avg_bet_size, 0) as avg_bet_size,
    COALESCE(ma.last_activity, am.created_at) as last_activity,
    COALESCE(ma.activity_score, 0) as activity_score,

    -- Calculate implied probability for option A
    CASE
      WHEN COALESCE(mo.total_market_volume, 0) > 0
      THEN COALESCE(mo.option_a_volume, 0) / mo.total_market_volume
      ELSE 0.5
    END as odds_probability,

    -- Trending score combines volume, participants, and recency
    (
      COALESCE(ma.total_volume, 0) * 0.4 +  -- 40% volume weight
      COALESCE(ma.unique_participants, 0) * 50 * 0.3 +  -- 30% participants weight (scaled)
      COALESCE(ma.activity_score, 0) * 0.3  -- 30% recency weight
    ) as trending_score

  FROM active_markets am
  LEFT JOIN market_activity ma ON am.market_id = ma.market_id
  LEFT JOIN market_odds mo ON am.market_id = mo.market_id
)

-- Return top trending markets
SELECT
  market_id,
  question,
  category,
  option_a,
  option_b,
  CAST(volume AS VARCHAR) as volume,
  participants,
  FROM_UNIXTIME(end_time) as end_date,
  odds_probability,
  trending_score,
  -- Additional metrics for sorting/filtering
  total_bets,
  CAST(avg_bet_size AS VARCHAR) as avg_bet_size,
  last_activity
FROM trending_score
WHERE volume > 0  -- Only markets with actual betting activity
ORDER BY trending_score DESC
LIMIT {{limit}};
