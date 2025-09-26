-- Flow Wager User Analytics Query
-- This query provides detailed analytics for individual users on the prediction market platform
-- Query ID: Replace with your actual Dune query ID after creation

WITH user_bets AS (
  SELECT
    JSON_EXTRACT_SCALAR(event_data, '$.bettor') as user_address,
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DECIMAL(18,8)) as bet_amount,
    JSON_EXTRACT_SCALAR(event_data, '$.option') as bet_option,
    block_time,
    tx_hash
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'BetPlaced'
    AND JSON_EXTRACT_SCALAR(event_data, '$.bettor') = '{{user_address}}'
),

user_market_creations AS (
  SELECT
    JSON_EXTRACT_SCALAR(event_data, '$.creator') as user_address,
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.category') as category,
    block_time
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketCreated'
    AND JSON_EXTRACT_SCALAR(event_data, '$.creator') = '{{user_address}}'
),

market_resolutions AS (
  SELECT
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    JSON_EXTRACT_SCALAR(event_data, '$.winningOption') as winning_option,
    block_time as resolution_time
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketResolved'
),

user_winnings AS (
  SELECT
    JSON_EXTRACT_SCALAR(event_data, '$.winner') as user_address,
    JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
    CAST(JSON_EXTRACT_SCALAR(event_data, '$.amount') AS DECIMAL(18,8)) as winning_amount,
    block_time
  FROM flow_events
  WHERE contract_address = '{{contract_address}}'
    AND event_type = 'WinningsClaimed'
    AND JSON_EXTRACT_SCALAR(event_data, '$.winner') = '{{user_address}}'
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

user_bet_outcomes AS (
  SELECT
    ub.user_address,
    ub.market_id,
    ub.bet_amount,
    ub.bet_option,
    ub.block_time as bet_time,
    mr.winning_option,
    CASE
      WHEN mr.winning_option = ub.bet_option THEN 'win'
      WHEN mr.winning_option IS NOT NULL AND mr.winning_option != ub.bet_option THEN 'loss'
      ELSE 'pending'
    END as outcome,
    COALESCE(uw.winning_amount, 0) as payout
  FROM user_bets ub
  LEFT JOIN market_resolutions mr ON ub.market_id = mr.market_id
  LEFT JOIN user_winnings uw ON ub.market_id = uw.market_id AND ub.user_address = uw.user_address
),

bet_streaks AS (
  SELECT
    user_address,
    outcome,
    COUNT(*) as streak_length,
    ROW_NUMBER() OVER (PARTITION BY user_address ORDER BY COUNT(*) DESC) as streak_rank
  FROM (
    SELECT
      user_address,
      outcome,
      SUM(CASE WHEN outcome != LAG(outcome) OVER (PARTITION BY user_address ORDER BY bet_time) THEN 1 ELSE 0 END)
        OVER (PARTITION BY user_address ORDER BY bet_time) as streak_group
    FROM user_bet_outcomes
    WHERE outcome IN ('win', 'loss')
    ORDER BY bet_time
  ) streak_groups
  WHERE outcome = 'win'
  GROUP BY user_address, outcome, streak_group
),

user_category_preferences AS (
  SELECT
    umc.user_address,
    cn.category_name,
    COUNT(*) as markets_in_category,
    ROW_NUMBER() OVER (PARTITION BY umc.user_address ORDER BY COUNT(*) DESC) as category_rank
  FROM user_market_creations umc
  LEFT JOIN category_names cn ON CAST(umc.category AS INTEGER) = cn.category_id
  GROUP BY umc.user_address, cn.category_name
),

betting_category_preferences AS (
  SELECT
    ub.user_address,
    cn.category_name,
    COUNT(*) as bets_in_category,
    SUM(ub.bet_amount) as volume_in_category,
    ROW_NUMBER() OVER (PARTITION BY ub.user_address ORDER BY COUNT(*) DESC) as bet_category_rank
  FROM user_bets ub
  LEFT JOIN (
    SELECT
      JSON_EXTRACT_SCALAR(event_data, '$.marketId') as market_id,
      JSON_EXTRACT_SCALAR(event_data, '$.category') as category
    FROM flow_events
    WHERE contract_address = '{{contract_address}}'
      AND event_type = 'MarketCreated'
  ) mc ON ub.market_id = mc.market_id
  LEFT JOIN category_names cn ON CAST(mc.category AS INTEGER) = cn.category_id
  GROUP BY ub.user_address, cn.category_name
),

user_rankings AS (
  SELECT
    user_address,
    total_winnings - total_bets as net_profit,
    ROW_NUMBER() OVER (ORDER BY (total_winnings - total_bets) DESC) as profit_rank
  FROM (
    SELECT
      ub.user_address,
      SUM(ub.bet_amount) as total_bets,
      SUM(ub.payout) as total_winnings
    FROM user_bet_outcomes ub
    GROUP BY ub.user_address
  ) user_totals
)

-- Main user analytics query
SELECT
  '{{user_address}}' as user_id,

  -- Betting Statistics
  COUNT(DISTINCT ubo.market_id) as total_bets,
  COALESCE(SUM(ubo.bet_amount), 0) as total_volume,
  COALESCE(AVG(ubo.bet_amount), 0) as avg_bet_size,

  -- Win/Loss Statistics
  COUNT(CASE WHEN ubo.outcome = 'win' THEN 1 END) as total_wins,
  COUNT(CASE WHEN ubo.outcome = 'loss' THEN 1 END) as total_losses,
  CASE
    WHEN COUNT(CASE WHEN outcome IN ('win', 'loss') THEN 1 END) > 0
    THEN CAST(COUNT(CASE WHEN outcome = 'win' THEN 1 END) AS DOUBLE) /
         CAST(COUNT(CASE WHEN outcome IN ('win', 'loss') THEN 1 END) AS DOUBLE)
    ELSE 0.0
  END as win_rate,

  -- Financial Performance
  COALESCE(SUM(ubo.payout), 0) as total_winnings,
  COALESCE(SUM(ubo.payout) - SUM(ubo.bet_amount), 0) as profit_loss,

  -- Market Creation
  COALESCE(
    (SELECT COUNT(*) FROM user_market_creations WHERE user_address = '{{user_address}}'),
    0
  ) as markets_created,

  -- Favorite Category (based on betting activity)
  COALESCE(
    (SELECT category_name FROM betting_category_preferences
     WHERE user_address = '{{user_address}}' AND bet_category_rank = 1),
    'Unknown'
  ) as favorite_category,

  -- Longest Win Streak
  COALESCE(
    (SELECT MAX(streak_length) FROM bet_streaks
     WHERE user_address = '{{user_address}}' AND outcome = 'win'),
    0
  ) as longest_streak,

  -- User Rank
  COALESCE(
    (SELECT profit_rank FROM user_rankings
     WHERE user_address = '{{user_address}}'),
    0
  ) as user_rank

FROM user_bet_outcomes ubo
WHERE ubo.user_address = '{{user_address}}'

UNION ALL

-- Return empty row if user has no activity
SELECT
  '{{user_address}}' as user_id,
  0 as total_bets,
  0 as total_volume,
  0 as avg_bet_size,
  0 as total_wins,
  0 as total_losses,
  0 as win_rate,
  0 as total_winnings,
  0 as profit_loss,
  0 as markets_created,
  'Sports' as favorite_category,
  0 as longest_streak,
  0 as user_rank
WHERE NOT EXISTS (
  SELECT 1 FROM user_bet_outcomes WHERE user_address = '{{user_address}}'
)
LIMIT 1;
