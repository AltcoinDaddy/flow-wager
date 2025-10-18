# 🚀 Dune Analytics Quick Start Guide

Get your Flow Wager analytics up and running in 15 minutes!

## ⚡ Prerequisites

- [ ] Dune Pro subscription ($390/month) - **Required for API access**
- [ ] Flow Wager contract deployed on Flow blockchain
- [ ] Node.js and npm installed

## 🔧 Step 1: Environment Setup (2 minutes)

1. **Copy environment template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Get your Dune API key:**
   - Go to [dune.com/settings/api](https://dune.com/settings/api)
   - Generate a new API key
   - Copy the key

3. **Update `.env.local`:**
   ```env
   NEXT_PUBLIC_DUNE_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_FLOWWAGER_CONTRACT_ADDRESS=0xfb16e84ea1882f67
   ```

## 🧪 Step 2: Test Connection (1 minute)

Run the setup script to validate your configuration:

```bash
npm run setup:dune
```

This will check:
- ✅ Environment variables
- ✅ Dune API connection
- ✅ SQL query files

## 📊 Step 3: Create Your First Query (5 minutes)

### Option A: Start with Diagnostic Query (Recommended)

1. **Go to [Dune Studio](https://dune.com/queries)**
2. **Click "New Query"**
3. **Copy and paste this diagnostic SQL:**

```sql
-- Test query to verify Flow data access
SELECT
  'Total Events' as metric,
  COUNT(*) as value,
  MIN(block_time) as earliest_event,
  MAX(block_time) as latest_event
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'

UNION ALL

SELECT
  CONCAT('Events: ', event_type) as metric,
  COUNT(*) as value,
  MIN(block_time) as earliest_event,
  MAX(block_time) as latest_event
FROM flow.core.fact_events
WHERE contract_address = '{{contract_address}}'
GROUP BY event_type
ORDER BY metric;
```

4. **Add parameter:**
   - Click "Parameters" 
   - Add `contract_address` with your Flow contract address
   - Example: `0xfb16e84ea1882f67`

5. **Run the query** to verify data exists
6. **Save the query** and note the Query ID (in the URL)

### Option B: Start Simple with Mock Data

If you don't have Flow data in Dune yet, skip to Step 4 to see the dashboard with mock data.

## 🎯 Step 4: Update Environment & Test (2 minutes)

1. **Add your query ID to `.env.local`:**
   ```env
   NEXT_PUBLIC_DUNE_SIMPLE_TEST_QUERY_ID=1234567
   ```

2. **Start your development server:**
   ```bash
   npm run dev
   ```

3. **Navigate to analytics dashboard:**
   ```
   http://localhost:3000/admin/analytics
   ```

4. **Verify it works:**
   - If configured: Real data from Dune
   - If not configured: Mock data (still functional!)

## 🚀 Step 5: Create Full Analytics (5 minutes)

Once your diagnostic query works, create the full analytics queries:

### Quick Setup Method:

1. **Copy SQL from these files to Dune Studio:**
   - `dune-queries/01-market-metrics.sql` → Market Metrics Query
   - `dune-queries/02-user-analytics.sql` → User Analytics Query  
   - `dune-queries/03-trending-markets.sql` → Trending Markets Query

2. **For each query:**
   - Create new query in Dune Studio
   - Copy the SQL content
   - Add required parameters (contract_address, etc.)
   - Test with your contract address
   - Save and note the Query ID

3. **Update `.env.local` with all Query IDs:**
   ```env
   NEXT_PUBLIC_DUNE_MARKET_METRICS_QUERY_ID=1234567
   NEXT_PUBLIC_DUNE_USER_ANALYTICS_QUERY_ID=1234568
   NEXT_PUBLIC_DUNE_TRENDING_MARKETS_QUERY_ID=1234569
   NEXT_PUBLIC_DUNE_VOLUME_OVER_TIME_QUERY_ID=1234570
   NEXT_PUBLIC_DUNE_CATEGORY_INSIGHTS_QUERY_ID=1234571
   ```

## 🔥 You're Done!

Your analytics dashboard is now live at `/admin/analytics` with:

- 📈 **Platform Metrics**: Total markets, volume, users
- 👤 **User Analytics**: Individual performance tracking  
- 🔥 **Trending Markets**: Most popular active markets
- 📊 **Volume Charts**: Historical activity data
- 🏷️ **Category Insights**: Performance by market type

## 🚨 Troubleshooting

### "No data returned" 
- Check if your contract has events in Dune
- Verify contract address format (Flow: 16 hex chars)
- Run diagnostic query first

### "Invalid API key"
- Verify you have Dune Pro subscription
- Check API key in `.env.local`
- Run `npm run setup:dune` to test

### "Query not found"
- Verify Query IDs in `.env.local`
- Make sure queries are saved and public in Dune

### Flow-specific issues
- Flow events might have different structure than Ethereum
- Use `json_extract_scalar(event_data, '$.fieldName')` for JSON fields
- Check `FLOW_DUNE_TROUBLESHOOTING.md` for Flow-specific solutions

## 📚 Next Steps

1. **Customize Queries**: Modify SQL to match your exact event structure
2. **Add Caching**: Implement Redis for production performance
3. **Set up Webhooks**: Get real-time updates (Dune Enterprise)
4. **Deploy**: Set environment variables in your hosting platform

## 🆘 Need Help?

- **Full Setup Guide**: `DUNE_SETUP.md`
- **Troubleshooting**: `FLOW_DUNE_TROUBLESHOOTING.md`  
- **Implementation Details**: `DUNE_IMPLEMENTATION_SUMMARY.md`
- **Dune Discord**: [discord.gg/dune](https://discord.gg/dune)
- **Flow Discord**: [discord.gg/flow](https://discord.gg/flow)

---

**🎉 Congratulations!** You now have a data-driven prediction market platform with comprehensive analytics powered by Dune Analytics.