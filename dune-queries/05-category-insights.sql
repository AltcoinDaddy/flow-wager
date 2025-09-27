

WITH market_events AS (
  SELECT
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.question') as question,
    JSON_EXTRACT_SCALAR(event_data, '$.category') as category,
    JSON_EXTRACT_SCALAR(event_data, '$.endTime') as end_time,
    JSON_EXTRACT_SCALAR(event_data, '$.creator') as creator,
    block_time as created_at
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketCreated'
    AND block_time >= CURRENT_DATE - INTERVAL '90 days'
),

bet_events AS (
  SELECT
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.bettor') as bettor,
    CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DECIMAL(18,8)) as amount,
    JSON_EXTRACT_SCALAR(event_data, '$.option') as option,
    block_time as bet_time
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'BetPlaced'
    AND block_time >= CURRENT_DATE - INTERVAL '90 days'
),

resolution_events AS (
  SELECT
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.winningOption') as winning_option,
    block_time as resolution_time
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketResolved'
    AND block_time >= CURRENT_DATE - INTERVAL '90 days'
),

fee_events AS (
  SELECT
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DECIMAL(18,8)) as fee_amount
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'FeeCollected'
    AND block_time >= CURRENT_DATE - INTERVAL '90 days'
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

market_details AS (
  SELECT
    m.market_id,
    m.question,
    cn.category_name as category,
    m.created_at,
    CAST(m.end_time AS DECIMAL) as end_time_unix,

    -- Market duration in hours
    (CAST(m.end_time AS DECIMAL) - EXTRACT(EPOCH FROM m.created_at)) / 3600.0 as duration_hours,

    -- Resolution status
    CASE
      WHEN r.market_id IS NOT NULL THEN 'resolved'
      WHEN CAST(m.end_time AS DECIMAL) < EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) THEN 'ended_unresolved'
      ELSE 'active'
    END as resolution_status,

    -- Time to resolution (if resolved)
    CASE
      WHEN r.resolution_time IS NOT NULL
      THEN UNIX_TIMESTAMP(r.resolution_time) - CAST(m.end_time AS DOUBLE)
      ELSE NULL
    END as resolution_delay_seconds,

    r.resolution_time

  FROM market_events m
  LEFT JOIN category_names cn ON CAST(m.category AS INTEGER) = cn.category_id
  LEFT JOIN resolution_events r ON m.market_id = r.market_id
),

category_betting_stats AS (
  SELECT
    md.category,
    md.market_id,
    md.duration_hours,
    md.resolution_status,
    md.resolution_delay_seconds,

    -- Betting metrics
    COUNT(DISTINCT b.bettor) as unique_bettors,
    COUNT(b.market_id) as total_bets,
    COALESCE(SUM(b.amount), 0) as total_volume,
    COALESCE(AVG(b.amount), 0) as avg_bet_size,
    COALESCE(MAX(b.amount), 0) as max_bet_size,
    COALESCE(MIN(b.amount), 0) as min_bet_size,

    -- Time-based metrics
    CASE
      WHEN COUNT(b.market_id) > 0
      THEN (MAX(UNIX_TIMESTAMP(b.bet_time)) - MIN(UNIX_TIMESTAMP(b.bet_time))) / 3600.0
      ELSE 0
    END as betting_duration_hours,

    -- Fee metrics
    COALESCE(SUM(f.fee_amount), 0) as total_fees

  FROM market_details md
  LEFT JOIN bet_events b ON md.market_id = b.market_id
  LEFT JOIN fee_events f ON md.market_id = f.market_id
  GROUP BY
    md.category, md.market_id, md.duration_hours,
    md.resolution_status, md.resolution_delay_seconds
),

category_aggregates AS (
  SELECT
    category,

    -- Market count metrics
    COUNT(*) as total_markets,
    COUNT(CASE WHEN resolution_status = 'resolved' THEN 1 END) as resolved_markets,
    COUNT(CASE WHEN resolution_status = 'active' THEN 1 END) as active_markets,
    COUNT(CASE WHEN resolution_status = 'ended_unresolved' THEN 1 END) as unresolved_markets,

    -- Volume and betting metrics
    SUM(total_volume) as category_volume,
    SUM(unique_bettors) as total_unique_bettors,
    SUM(total_bets) as total_bets,
    SUM(total_fees) as total_fees,

    -- Average metrics
    AVG(total_volume) as avg_market_volume,
    AVG(unique_bettors) as avg_market_participants,
    AVG(total_bets) as avg_bets_per_market,
    AVG(avg_bet_size) as avg_bet_size_category,
    AVG(duration_hours) as avg_market_duration_hours,

    -- Resolution metrics
    AVG(
      CASE
        WHEN resolution_delay_seconds IS NOT NULL
        THEN resolution_delay_seconds / 3600.0
        ELSE NULL
      END
    ) as avg_resolution_delay_hours,

    -- Success rate
    CASE
      WHEN COUNT(*) > 0
      THEN CAST(COUNT(CASE WHEN resolution_status = 'resolved' THEN 1 END) AS DOUBLE) / CAST(COUNT(*) AS DOUBLE)
      ELSE 0.0
    END as success_rate,

    -- Market engagement metrics
    AVG(betting_duration_hours) as avg_betting_duration_hours,
    MAX(total_volume) as highest_volume_market,
    MAX(unique_bettors) as most_participants_market,

    -- Volume distribution
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_volume) as median_volume,
    PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY total_volume) as q1_volume,
    PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY total_volume) as q3_volume,

    -- Recent activity (last 30 days)
    COUNT(CASE WHEN betting_duration_hours > 0 THEN 1 END) as markets_with_activity,
    SUM(CASE WHEN total_volume > 0 THEN total_volume ELSE 0 END) as active_volume

  FROM category_betting_stats
  WHERE category IS NOT NULL
  GROUP BY category
),

category_rankings AS (
  SELECT
    *,
    ROW_NUMBER() OVER (ORDER BY category_volume DESC) as volume_rank,
    ROW_NUMBER() OVER (ORDER BY total_markets DESC) as market_count_rank,
    ROW_NUMBER() OVER (ORDER BY success_rate DESC) as success_rate_rank,
    ROW_NUMBER() OVER (ORDER BY avg_market_participants DESC) as engagement_rank,

    -- Category performance score (weighted composite)
    (
      (category_volume * 0.3) +
      (total_unique_bettors * 0.25) +
      (success_rate * 1000 * 0.25) +
      (avg_market_participants * 100 * 0.2)
    ) as performance_score

  FROM category_aggregates
)

SELECT
  category,
  CAST(ROUND(category_volume, 2) AS STRING) as volume,
  total_markets as markets,
  ROUND(avg_market_duration_hours, 1) as avg_resolution_time,
  ROUND(success_rate, 3) as success_rate,

  -- Additional insights
  resolved_markets,
  active_markets,
  unresolved_markets,
  total_unique_bettors,
  total_bets,

  -- Performance metrics
  CAST(ROUND(avg_market_volume, 2) AS STRING) as avg_market_volume,
  ROUND(avg_market_participants, 1) as avg_participants_per_market,
  CAST(ROUND(avg_bet_size_category, 3) AS STRING) as avg_bet_size,

  -- Resolution insights
  ROUND(COALESCE(avg_resolution_delay_hours, 0), 1) as avg_resolution_delay_hours,
  ROUND(avg_betting_duration_hours, 1) as avg_betting_duration_hours,

  -- Volume distribution
  CAST(ROUND(median_volume, 2) AS STRING) as median_volume,
  CAST(ROUND(highest_volume_market, 2) AS STRING) as highest_volume_market,
  most_participants_market,

  -- Rankings and scores
  volume_rank,
  success_rate_rank,
  engagement_rank,
  ROUND(performance_score, 0) as performance_score,

  -- Activity indicators
  ROUND((CAST(markets_with_activity AS DOUBLE) / CAST(total_markets AS DOUBLE)) * 100, 1) as activity_rate_pct,
  CAST(ROUND(total_fees, 4) AS STRING) as total_fees_collected,

  -- Growth indicators (comparing to overall average)
  CASE
    WHEN avg_market_volume > (SELECT AVG(avg_market_volume) FROM category_aggregates) * 1.2
    THEN 'High Volume'
    WHEN success_rate > (SELECT AVG(success_rate) FROM category_aggregates) * 1.1
    THEN 'High Success Rate'
    WHEN avg_market_participants > (SELECT AVG(avg_market_participants) FROM category_aggregates) * 1.15
    THEN 'High Engagement'
    ELSE 'Standard'
  END as performance_tier

FROM category_rankings
ORDER BY performance_score DESC;
