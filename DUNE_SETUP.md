# Dune Analytics Integration Setup Guide

This guide will walk you through setting up Dune Analytics integration for your Flow Wager prediction market platform.

## Overview

Dune Analytics provides powerful blockchain data analytics capabilities. This integration gives you:

- **Platform Metrics**: Total markets, volume, user activity
- **User Analytics**: Individual user performance and statistics  
- **Market Insights**: Trending markets and category analysis
- **Financial Tracking**: Fee collection and revenue metrics
- **Real-time Dashboards**: Interactive charts and visualizations

## Prerequisites

1. **Dune Analytics Account**: Sign up at [dune.com](https://dune.com)
2. **Flow Wager Contract**: Deployed on Flow blockchain
3. **API Access**: Dune Pro subscription for API access ($390/month)

## Step 1: Create Dune Account & Get API Key

1. Go to [dune.com](https://dune.com) and create an account
2. Subscribe to Dune Pro plan for API access
3. Navigate to Settings → API Keys
4. Generate a new API key
5. Save this key - you'll need it for configuration

## Step 2: Create SQL Queries in Dune

You need to create 5 custom queries in Dune. Use the SQL files in `/dune-queries/` folder:

### Query 1: Market Metrics (`01-market-metrics.sql`)
- **Purpose**: Overall platform statistics
- **Parameters**: `contract_address`, `timeframe`
- **Returns**: Total markets, volume, users, success rates

### Query 2: User Analytics (`02-user-analytics.sql`)  
- **Purpose**: Individual user performance
- **Parameters**: `contract_address`, `user_address`
- **Returns**: User stats, win rate, profit/loss, rankings

### Query 3: Trending Markets (`03-trending-markets.sql`)
- **Purpose**: Most popular active markets
- **Parameters**: `contract_address`, `limit`
- **Returns**: Top markets by activity and volume

### Query 4: Volume Over Time (`04-volume-over-time.sql`)
- **Purpose**: Historical volume and activity data
- **Parameters**: `contract_address`, `timeframe`
- **Returns**: Daily metrics for charts

### Query 5: Category Insights (`05-category-insights.sql`)
- **Purpose**: Performance breakdown by market category
- **Parameters**: `contract_address`
- **Returns**: Category-specific metrics and comparisons

### Creating Queries in Dune:

1. **Log into Dune Studio**
2. **Click "New Query"**
3. **Copy SQL from each file**
4. **Replace placeholder values**:
   - Update `flow_events` table references to match Flow blockchain data structure
   - Adjust event names to match your contract events
   - Modify JSON extraction paths based on your event data structure

5. **Test each query** with sample parameters
6. **Save and note the Query ID** (you'll need these for configuration)

## Step 3: Configure Environment Variables

Add these variables to your `.env.local` file:

```env
# Dune Analytics Configuration
NEXT_PUBLIC_DUNE_API_KEY=your_dune_api_key_here

# Query IDs (replace with your actual Dune query IDs)
NEXT_PUBLIC_DUNE_MARKET_METRICS_QUERY_ID=1234567
NEXT_PUBLIC_DUNE_USER_ANALYTICS_QUERY_ID=1234568
NEXT_PUBLIC_DUNE_TRENDING_MARKETS_QUERY_ID=1234569
NEXT_PUBLIC_DUNE_VOLUME_OVER_TIME_QUERY_ID=1234570
NEXT_PUBLIC_DUNE_CATEGORY_INSIGHTS_QUERY_ID=1234571

# Your Flow contract address
NEXT_PUBLIC_FLOWWAGER_CONTRACT_ADDRESS=0xfb16e84ea1882f67

# Optional: Custom API base URL
NEXT_PUBLIC_DUNE_API_BASE_URL=https://api.dune.com/api/v1
```

## Step 4: Flow Event Structure

Your Flow contract needs to emit events that match the expected structure. Here are the required events:

### MarketCreated Event
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
```

### BetPlaced Event
```cadence
access(all) event BetPlaced(
    marketId: UInt64,
    bettor: Address,
    amount: UFix64,
    option: String
)
```

### MarketResolved Event
```cadence
access(all) event MarketResolved(
    marketId: UInt64,
    winningOption: String,
    resolver: Address
)
```

### FeeCollected Event
```cadence
access(all) event FeeCollected(
    marketId: UInt64,
    amount: UFix64
)
```

### WinningsClaimed Event
```cadence
access(all) event WinningsClaimed(
    marketId: UInt64,
    winner: Address,
    amount: UFix64
)
```

## Step 5: Test the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Analytics Dashboard**:
   ```
   http://localhost:3000/admin/analytics
   ```

3. **Check for data loading**:
   - If queries are configured correctly, you'll see real data
   - If not configured, mock data will be displayed
   - Check browser console for any API errors

## Step 6: Verify API Connection

The analytics service includes connection testing:

```typescript
import { duneAnalytics } from '@/lib/dune-analytics';

const testConnection = async () => {
  const isConnected = await duneAnalytics.testConnection();
  console.log('Dune API Connected:', isConnected);
};
```

## Troubleshooting

### Common Issues:

1. **"Query not found" errors**
   - Verify query IDs in environment variables
   - Ensure queries are saved and public in Dune

2. **"Invalid API key" errors**
   - Check API key in environment variables
   - Verify Dune Pro subscription is active

3. **No data returned**
   - Verify contract address matches your deployment
   - Check event names match your Flow contract
   - Ensure your contract has been active and has events

4. **Rate limiting**
   - Dune has API rate limits
   - Implement caching for production use
   - Consider upgrading Dune plan for higher limits

### Flow-Specific Considerations:

Since Flow blockchain data structure might differ from Ethereum, you may need to adjust:

1. **Event Data Structure**: Flow events may have different JSON structure
2. **Block Time Format**: Flow block timestamps might use different format
3. **Address Format**: Flow addresses have different format than Ethereum

### Mock Data Fallback

The integration includes comprehensive mock data that activates when:
- Dune API is unavailable
- Queries are not configured
- API limits are exceeded

This ensures your analytics dashboard always works during development.

## Production Deployment

### Environment Variables for Production:

1. **Secure API Key Storage**: Use your deployment platform's secret management
2. **Query IDs**: Update with production query IDs
3. **Contract Address**: Use mainnet contract address
4. **Caching**: Implement Redis or similar for API response caching

### Performance Optimization:

1. **Query Caching**: Cache results for 5-10 minutes
2. **Background Updates**: Use webhooks or scheduled jobs for data updates
3. **Error Handling**: Implement comprehensive error handling and fallbacks

## Cost Considerations

### Dune Pricing (as of 2024):
- **Free Tier**: Query creation only, no API access
- **Pro Plan**: $390/month, includes API access
- **Enterprise**: Custom pricing for high-volume usage

### Query Optimization:
- Limit time ranges to reduce query costs
- Use efficient SQL with proper indexing
- Cache results to minimize API calls

## Support and Resources

### Dune Resources:
- [Dune Documentation](https://docs.dune.com)
- [Dune Discord Community](https://discord.gg/dune)
- [SQL Tutorial](https://docs.dune.com/getting-started/queries)

### Flow Resources:
- [Flow Documentation](https://developers.flow.com)
- [Cadence Language Guide](https://cadence-lang.org)
- [Flow Community Discord](https://discord.gg/flow)

## Analytics Features Overview

Once configured, you'll have access to:

### Platform Dashboard
- Total markets and volume
- Active user metrics
- Success rates and trends
- Category performance
- Revenue tracking

### User Analytics
- Individual user profiles
- Win/loss statistics
- Betting patterns
- User rankings
- Performance trends

### Market Insights
- Trending markets
- Category analysis
- Volume patterns
- Market lifecycle tracking
- Prediction accuracy

### Visual Components
- Interactive charts using Recharts
- Real-time data updates
- Mobile-responsive design
- Export capabilities
- Custom time ranges

This integration transforms your Flow Wager platform into a data-driven prediction market with comprehensive analytics capabilities.