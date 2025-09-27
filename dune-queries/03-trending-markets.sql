

WITH market_events AS (
  SELECT
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.question') as question,
    JSON_EXTRACT_SCALAR(event_data, '$.category') as category,
    JSON_EXTRACT_SCALAR(event_data, '$.optionA') as option_a,
    JSON_EXTRACT_SCALAR(event_data, '$.optionB') as option_b,
    JSON_EXTRACT_SCALAR(event_data, '$.endTime') as end_time,
    JSON_EXTRACT_SCALAR(event_data, '$.creator') as creator,
    block_time as created_at
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketCreated'
    AND block_time >= CURRENT_DATE - INTERVAL '30 days'
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
    AND block_time >= CURRENT_DATE - INTERVAL '30 days'
),

resolution_events AS (
  SELECT
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.winningOption') as winning_option,
    block_time as resolution_time
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketResolved'
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

market_activity AS (
  SELECT
    m.market_id,
    m.question,
    cn.category_name as category,
    m.option_a,
    m.option_b,
    m.end_time,
    m.created_at,

    -- Volume metrics
    COALESCE(SUM(b.amount), 0) as total_volume,
    COUNT(DISTINCT b.bettor) as unique_participants,
    COUNT(b.market_id) as total_bets,

    -- Recent activity (last 7 days)
    COALESCE(SUM(CASE WHEN b.bet_time >= CURRENT_DATE - INTERVAL '7 days' THEN b.amount ELSE 0 END), 0) as recent_volume,
    COUNT(DISTINCT CASE WHEN b.bet_time >= CURRENT_DATE - INTERVAL '7 days' THEN b.bettor END) as recent_participants,

    -- Betting distribution
    COALESCE(SUM(CASE WHEN b.option = m.option_a THEN b.amount ELSE 0 END), 0) as option_a_volume,
    COALESCE(SUM(CASE WHEN b.option = m.option_b THEN b.amount ELSE 0 END), 0) as option_b_volume,

    -- Market status
    CASE
      WHEN r.market_id IS NOT NULL THEN 'resolved'
      WHEN CAST(m.end_time AS DOUBLE) < UNIX_TIMESTAMP(NOW()) THEN 'ended'
      ELSE 'active'
    END as market_status,

    -- Time until end (in hours)
    CASE
      WHEN CAST(m.end_time AS DOUBLE) > UNIX_TIMESTAMP(NOW())
      THEN (CAST(m.end_time AS DOUBLE) - UNIX_TIMESTAMP(NOW())) / 3600.0
      ELSE 0
    END as hours_until_end

  FROM market_events m
  LEFT JOIN bet_events b ON m.market_id = b.market_id
  LEFT JOIN resolution_events r ON m.market_id = r.market_id
  LEFT JOIN category_names cn ON CAST(m.category AS INTEGER) = cn.category_id
  GROUP BY
    m.market_id, m.question, cn.category_name, m.option_a, m.option_b,
    m.end_time, m.created_at, r.market_id
),

market_scores AS (
  SELECT
    *,
    -- Calculate odds/probability for option A
    CASE
      WHEN (option_a_volume + option_b_volume) > 0
      THEN option_a_volume / (option_a_volume + option_b_volume)
      ELSE 0.5
    END as odds_probability,

    -- Trending score based on recent activity, volume, and participants
    (
      (recent_volume * 0.4) +
      (recent_participants * 10.0 * 0.3) +
      (total_volume * 0.2) +
      (unique_participants * 5.0 * 0.1)
    ) as trending_score,

    -- Volume velocity (volume per day since creation)
    CASE
      WHEN (UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(created_at)) / 86400.0 > 0
      THEN total_volume / ((UNIX_TIMESTAMP(NOW()) - UNIX_TIMESTAMP(created_at)) / 86400.0)
      ELSE 0
    END as volume_velocity

  FROM market_activity
),

filtered_markets AS (
  SELECT
    market_id,
    question,
    category,
    option_a,
    option_b,
    DATE_FORMAT(FROM_UNIXTIME(CAST(end_time AS BIGINT)), '%Y-%m-%d %H:%i:%s') as end_date,
    total_volume as volume,
    unique_participants as participants,
    odds_probability,
    trending_score,
    market_status,
    hours_until_end,
    volume_velocity,

    -- Ranking metrics
    ROW_NUMBER() OVER (ORDER BY trending_score DESC) as trending_rank,
    ROW_NUMBER() OVER (ORDER BY total_volume DESC) as volume_rank,
    ROW_NUMBER() OVER (ORDER BY unique_participants DESC) as participation_rank

  FROM market_scores
  WHERE
    -- Only include markets with some activity or very recent creation
    (total_volume > 0 OR created_at >= CURRENT_DATE - INTERVAL '3 days')
    -- Exclude resolved markets older than 7 days
    AND NOT (market_status = 'resolved' AND created_at < CURRENT_DATE - INTERVAL '7 days')
)

SELECT
  market_id,
  question,
  category,
  CAST(volume AS STRING) as volume,
  participants,
  end_date,
  option_a,
  option_b,
  ROUND(odds_probability, 3) as odds_probability,

  -- Add activity indicators
  CASE
    WHEN market_status = 'active' AND hours_until_end < 24 THEN 'Ending Soon'
    WHEN trending_rank <= 3 THEN 'Hot'
    WHEN volume_rank <= 5 THEN 'High Volume'
    WHEN participation_rank <= 5 THEN 'Popular'
    WHEN market_status = 'resolved' THEN 'Recently Resolved'
    ELSE ''
  END as activity_label,

  market_status,
  ROUND(hours_until_end, 1) as hours_until_end

FROM filtered_markets
ORDER BY trending_score DESC
LIMIT {{limit}};
