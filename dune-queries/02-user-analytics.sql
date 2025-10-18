-- Flow Wager User Analytics Query
-- This query provides comprehensive user statistics for a specific address
-- Parameters: contract_address, user_address

WITH user_events AS (
  SELECT *
  FROM flow.core.fact_events
  WHERE contract_address = '{{contract_address}}'
    AND (
      json_extract_scalar(event_data, '$.bettor') = '{{user_address}}'
      OR json_extract_scalar(event_data, '$.creator') = '{{user_address}}'
      OR json_extract_scalar(event_data, '$.winner') = '{{user_address}}'
    )
),

user_bets AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.bettor') as bettor,
    CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE) as amount,
    json_extract_scalar(event_data, '$.option') as option,
    block_time as bet_time
  FROM user_events
  WHERE event_type = 'BetPlaced'
    AND json_extract_scalar(event_data, '$.bettor') = '{{user_address}}'
),

user_markets_created AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.category') as category,
    json_extract_scalar(event_data, '$.creator') as creator,
    block_time as created_at
  FROM user_events
  WHERE event_type = 'MarketCreated'
    AND json_extract_scalar(event_data, '$.creator') = '{{user_address}}'
),

user_winnings AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.winner') as winner,
    CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE) as amount,
    block_time as claimed_at
  FROM user_events
  WHERE event_type = 'WinningsClaimed'
    AND json_extract_scalar(event_data, '$.winner') = '{{user_address}}'
),

-- Get market resolutions to determine wins/losses
market_resolutions AS (
  SELECT
    json_extract_scalar(event_data, '$.marketId') as market_id,
    json_extract_scalar(event_data, '$.winningOption') as winning_option,
    block_time as resolved_at
  FROM flow.core.fact_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketResolved'
),

-- Determine bet outcomes
bet_outcomes AS (
  SELECT
    ub.*,
    mr.winning_option,
    mr.resolved_at,
    CASE
      WHEN mr.winning_option = ub.option THEN 'win'
      WHEN mr.winning_option IS NOT NULL AND mr.winning_option != ub.option THEN 'loss'
      ELSE 'pending'
    END as outcome,
    uw.amount as winnings_amount
  FROM user_bets ub
  LEFT JOIN market_resolutions mr ON ub.market_id = mr.market_id
  LEFT JOIN user_winnings uw ON ub.market_id = uw.market_id
),

-- Calculate streaks
bet_sequence AS (
  SELECT
    *,
    ROW_NUMBER() OVER (ORDER BY bet_time) as bet_sequence,
    LAG(outcome) OVER (ORDER BY bet_time) as prev_outcome
  FROM bet_outcomes
  WHERE outcome IN ('win', 'loss')
),

streak_groups AS (
  SELECT
    *,
    SUM(CASE WHEN outcome != prev_outcome OR prev_outcome IS NULL THEN 1 ELSE 0 END)
      OVER (ORDER BY bet_sequence) as streak_group
  FROM bet_sequence
),

streak_lengths AS (
  SELECT
    streak_group,
    outcome,
    COUNT(*) as streak_length
  FROM streak_groups
  GROUP BY streak_group, outcome
),

-- Category preferences
category_preferences AS (
  SELECT
    COALESCE(umc.category, 'Unknown') as category,
    COUNT(*) as bet_count,
    SUM(ub.amount) as total_volume
  FROM user_bets ub
  LEFT JOIN flow.core.fact_events fe ON
    fe.contract_address = '{{contract_address}}'
    AND fe.event_type = 'MarketCreated'
    AND json_extract_scalar(fe.event_data, '$.marketId') = ub.market_id
  LEFT JOIN user_markets_created umc ON ub.market_id = umc.market_id
  GROUP BY umc.category
),

-- User ranking calculation
all_users_stats AS (
  SELECT
    json_extract_scalar(event_data, '$.bettor') as user_address,
    COUNT(*) as total_bets,
    SUM(CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE)) as total_volume
  FROM flow.core.fact_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'BetPlaced'
  GROUP BY json_extract_scalar(event_data, '$.bettor')
),

user_ranking AS (
  SELECT
    user_address,
    total_volume,
    ROW_NUMBER() OVER (ORDER BY total_volume DESC) as rank
  FROM all_users_stats
)

-- Main user analytics query
SELECT
  '{{user_address}}' as user_id,

  -- Betting statistics
  COUNT(ub.market_id) as total_bets,
  COALESCE(SUM(ub.amount), 0) as total_volume,
  CASE
    WHEN COUNT(ub.market_id) > 0
    THEN COALESCE(SUM(ub.amount), 0) / COUNT(ub.market_id)
    ELSE 0
  END as avg_bet_size,

  -- Performance metrics
  CASE
    WHEN COUNT(CASE WHEN bo.outcome IN ('win', 'loss') THEN 1 END) > 0
    THEN CAST(COUNT(CASE WHEN bo.outcome = 'win' THEN 1 END) AS DOUBLE) /
         COUNT(CASE WHEN bo.outcome IN ('win', 'loss') THEN 1 END)
    ELSE 0
  END as win_rate,

  -- Profit/Loss calculation
  COALESCE(SUM(bo.winnings_amount), 0) - COALESCE(SUM(ub.amount), 0) as profit_loss,

  -- Market creation
  COUNT(DISTINCT umc.market_id) as markets_created,

  -- Longest winning streak
  COALESCE(MAX(CASE WHEN sl.outcome = 'win' THEN sl.streak_length END), 0) as longest_streak,

  -- Favorite category
  (
    SELECT category
    FROM category_preferences
    WHERE category IS NOT NULL
    ORDER BY bet_count DESC, total_volume DESC
    LIMIT 1
  ) as favorite_category,

  -- User rank
  COALESCE(ur.rank, 0) as user_rank

FROM user_bets ub
LEFT JOIN bet_outcomes bo ON ub.market_id = bo.market_id AND ub.bet_time = bo.bet_time
LEFT JOIN user_markets_created umc ON umc.creator = '{{user_address}}'
LEFT JOIN streak_lengths sl ON sl.outcome = 'win'
LEFT JOIN user_ranking ur ON ur.user_address = '{{user_address}}'
GROUP BY ur.rank;
