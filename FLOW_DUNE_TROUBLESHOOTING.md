# Flow + Dune Analytics Troubleshooting Guide

## Common Issues and Solutions

### 1. "Invalid EXTRACT field: EPOCH" Error

**Problem**: Dune's SQL engine doesn't support PostgreSQL's `EXTRACT(EPOCH FROM ...)` syntax.

**Solution**: Use Flow/Dune compatible time functions:
```sql
-- ❌ Don't use this:
EXTRACT(EPOCH FROM timestamp_column)

-- ✅ Use this instead:
UNIX_TIMESTAMP(timestamp_column)
date_part('epoch', timestamp_column)
```

### 2. Flow Event Data Structure Issues

**Problem**: Flow events in Dune have different structure than Ethereum events.

**Diagnosis Steps**:

1. **Run the diagnostic query first** (`00-flow-data-diagnostic.sql`):
```sql
SELECT * 
FROM flow.core.fact_events 
WHERE contract_address = 'YOUR_CONTRACT_ADDRESS'
LIMIT 5;
```

2. **Check available Flow tables**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema LIKE '%flow%';
```

3. **Identify correct event structure**:
```sql
SELECT 
    event_type,
    event_data,
    block_time
FROM flow.core.fact_events 
WHERE contract_address = 'YOUR_CONTRACT_ADDRESS'
    AND event_type LIKE '%Market%'
ORDER BY block_time DESC 
LIMIT 3;
```

### 3. JSON Data Extraction Issues

**Problem**: Different ways to extract JSON data in Flow events.

**Try these approaches in order**:

```sql
-- Method 1: Standard JSON_EXTRACT_SCALAR
json_extract_scalar(event_data, '$.marketId')

-- Method 2: Snowflake-style notation
event_data:marketId::varchar

-- Method 3: Quoted field names
event_data:"marketId"

-- Method 4: Array/object notation
event_data['marketId']
```

### 4. Flow Contract Address Format

**Problem**: Flow addresses have different format than Ethereum.

**Flow Address Format**: `0x1234567890abcdef` (without leading zeros)
**Ethereum Format**: `0x1234567890abcdef1234567890abcdef12345678`

**Solution**: Ensure your contract address matches Flow's format exactly.

### 5. Flow Event Names vs Ethereum

**Problem**: Flow events might have different naming conventions.

**Check your Flow contract events**:
```cadence
// Your contract should emit events like:
access(all) event MarketCreated(marketId: UInt64, question: String, ...)
access(all) event BetPlaced(marketId: UInt64, bettor: Address, ...)
```

**In Dune, these appear as**:
- `event_type = 'MarketCreated'`
- `event_type = 'BetPlaced'`

### 6. Time Handling in Flow

**Problem**: Flow timestamps might be in different formats.

**Solutions**:
```sql
-- If endTime is already unix timestamp:
CAST(event_data:endTime AS DOUBLE)

-- If endTime needs conversion:
UNIX_TIMESTAMP(event_data:endTime::timestamp)

-- For duration calculations:
(CAST(end_time AS DOUBLE) - UNIX_TIMESTAMP(block_time)) / 3600.0
```

### 7. Interval Syntax Issues

**Problem**: `INTERVAL '30d'` might not work in Dune.

**Solution**: Use standard interval syntax:
```sql
-- ❌ Avoid:
block_time >= CURRENT_DATE - INTERVAL '{{timeframe}}'

-- ✅ Use:
block_time >= current_date - interval '30 days'
-- or
block_time >= current_date - interval '7 days'
-- or
block_time >= current_date - interval '90 days'
```

### 8. Flow Table Structure

**Most likely Flow tables in Dune**:
- `flow.core.fact_events` - Event data
- `flow.core.fact_transactions` - Transaction data
- `flow.core.blocks` - Block information

**Query structure**:
```sql
SELECT *
FROM flow.core.fact_events
WHERE contract_address = 'YOUR_ADDRESS'
    AND event_type = 'MarketCreated'
    AND block_time >= current_date - interval '7 days';
```

## Step-by-Step Debugging Process

### Step 1: Verify Contract Data Exists
```sql
SELECT COUNT(*) as event_count
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}';
```

### Step 2: Check Event Types
```sql
SELECT DISTINCT event_type, COUNT(*) as count
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
GROUP BY event_type;
```

### Step 3: Examine Event Data Structure
```sql
SELECT 
    event_type,
    event_data,
    block_time
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
ORDER BY block_time DESC
LIMIT 5;
```

### Step 4: Test Data Extraction
```sql
SELECT 
    event_type,
    -- Try different extraction methods
    json_extract_scalar(event_data, '$.marketId') as method1,
    event_data:marketId::varchar as method2,
    event_data:"marketId" as method3
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketCreated'
LIMIT 3;
```

## Updated Query Templates

### Basic Market Count
```sql
SELECT COUNT(DISTINCT json_extract_scalar(event_data, '$.marketId')) as total_markets
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
    AND event_type = 'MarketCreated'
    AND block_time >= current_date - interval '30 days';
```

### Basic Volume Calculation
```sql
SELECT 
    SUM(CAST(json_extract_scalar(event_data, '$.amount') AS DOUBLE)) as total_volume
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
    AND event_type = 'BetPlaced'
    AND block_time >= current_date - interval '30 days';
```

### Active Users Count
```sql
SELECT COUNT(DISTINCT json_extract_scalar(event_data, '$.bettor')) as active_users
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
    AND event_type = 'BetPlaced'
    AND block_time >= current_date - interval '30 days';
```

## Flow Contract Event Requirements

Your Flow contract should emit these events for full analytics:

```cadence
access(all) event MarketCreated(
    marketId: UInt64,
    question: String,
    category: UInt8,
    optionA: String,
    optionB: String,
    endTime: UFix64,
    creator: Address,
    minBet: UFix64,
    maxBet: UFix64
)

access(all) event BetPlaced(
    marketId: UInt64,
    bettor: Address,
    amount: UFix64,
    option: String
)

access(all) event MarketResolved(
    marketId: UInt64,
    winningOption: String,
    resolver: Address
)
```

## Quick Test Queries

### Test 1: Basic Connection
```sql
SELECT 'Connection successful' as status, COUNT(*) as total_events
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}';
```

### Test 2: Recent Activity
```sql
SELECT 
    DATE(block_time) as date,
    COUNT(*) as events
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
    AND block_time >= current_date - interval '7 days'
GROUP BY DATE(block_time)
ORDER BY date DESC;
```

### Test 3: Event Data Sample
```sql
SELECT 
    event_type,
    event_data,
    block_time
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
ORDER BY block_time DESC
LIMIT 10;
```

## Environment Variable Setup

Update your `.env.local` with the working query IDs:

```env
# Start with simple queries first
NEXT_PUBLIC_DUNE_MARKET_METRICS_QUERY_ID=your_simple_query_id

# Test contract address (Flow format)
NEXT_PUBLIC_FLOWWAGER_CONTRACT_ADDRESS=0xfb16e84ea1882f67

# Dune API key
NEXT_PUBLIC_DUNE_API_KEY=your_api_key
```

## Support Resources

- **Flow Documentation**: https://developers.flow.com/
- **Dune Documentation**: https://docs.dune.com/
- **Flow Discord**: https://discord.gg/flow
- **Dune Discord**: https://discord.gg/dune

## Next Steps

1. Start with `00-flow-data-diagnostic.sql` to understand your data structure
2. Use `01-simple-market-metrics.sql` for basic testing
3. Gradually build up to more complex queries
4. Always test queries in Dune Studio before using in the app
5. Use the mock data fallback during development

Remember: The key is to start simple and build complexity gradually while ensuring each step works with Flow's specific data structure in Dune.