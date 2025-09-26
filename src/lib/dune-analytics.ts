import axios, { AxiosInstance } from "axios";

interface DuneConfig {
  apiKey: string;
  baseUrl?: string;
}

interface MarketMetrics {
  totalMarkets: number;
  totalVolume: string;
  activeUsers: number;
  averageMarketDuration: number;
  topCategory: string;
  successfulResolutions: number;
  totalFees: string;
  marketsByCategory: Array<{
    category: string;
    count: number;
    volume: string;
  }>;
}

interface UserAnalytics {
  userId: string;
  totalBets: number;
  winRate: number;
  totalVolume: string;
  favoriteCategory: string;
  profitLoss: string;
  marketsCreated: number;
  averageBetSize: string;
  longestStreak: number;
  rank: number;
}

interface TrendingMarket {
  marketId: string;
  question: string;
  category: string;
  volume: string;
  participants: number;
  endDate: string;
  optionA: string;
  optionB: string;
  oddsProbability: number;
}

interface DuneQueryResult {
  execution_id: string;
  query_id: number;
  state:
    | "QUERY_STATE_PENDING"
    | "QUERY_STATE_EXECUTING"
    | "QUERY_STATE_COMPLETED"
    | "QUERY_STATE_FAILED";
  submitted_at: string;
  expires_at: string;
  result?: {
    rows: Record<string, unknown>[];
    metadata: {
      column_names: string[];
      column_types: string[];
      row_count: number;
    };
  };
}

interface VolumeOverTime {
  date: string;
  volume: string;
  markets: number;
  users: number;
}

interface CategoryInsights {
  category: string;
  volume: string;
  markets: number;
  avgResolutionTime: number;
  successRate: number;
}

export class DuneAnalytics {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: DuneConfig) {
    this.apiKey = config.apiKey;
    this.client = axios.create({
      baseURL: config.baseUrl || "https://api.dune.com/api/v1",
      headers: {
        "X-Dune-API-Key": config.apiKey,
        "Content-Type": "application/json",
      },
      timeout: 30000, // 30 second timeout
    });
  }

  // Execute a query and wait for results
  private async executeQuery(
    queryId: number,
    parameters: Record<string, unknown> = {},
  ): Promise<Record<string, unknown>[]> {
    try {
      console.log(
        `Executing Dune query ${queryId} with parameters:`,
        parameters,
      );

      // Submit the query execution
      const executionResponse = await this.client.post(
        `/query/${queryId}/execute`,
        {
          query_parameters: parameters,
        },
      );

      const executionId = executionResponse.data.execution_id;
      console.log(`Query execution started with ID: ${executionId}`);

      // Poll for results
      let attempts = 0;
      const maxAttempts = 20; // Maximum 2 minutes of polling

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 6000)); // Wait 6 seconds

        const statusResponse = await this.client.get(
          `/execution/${executionId}/results`,
        );
        const result: DuneQueryResult = statusResponse.data;

        console.log(
          `Query ${queryId} status: ${result.state}, attempt ${attempts + 1}`,
        );

        if (result.state === "QUERY_STATE_COMPLETED") {
          console.log(
            `Query ${queryId} completed successfully with ${result.result?.rows?.length || 0} rows`,
          );
          return result.result?.rows || [];
        }

        if (result.state === "QUERY_STATE_FAILED") {
          throw new Error(`Query execution failed for query ${queryId}`);
        }

        attempts++;
      }

      throw new Error(
        `Query ${queryId} execution timed out after ${maxAttempts} attempts`,
      );
    } catch (error) {
      console.error(`Failed to execute Dune query ${queryId}:`, error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error(
            "Invalid Dune API key. Please check your configuration.",
          );
        }
        if (error.response?.status === 404) {
          throw new Error(
            `Query ${queryId} not found. Please check the query ID.`,
          );
        }
        throw new Error(
          `Dune API error: ${error.response?.data?.message || error.message}`,
        );
      }
      throw error;
    }
  }

  // Get comprehensive market metrics
  async getMarketMetrics(
    timeframe: "7d" | "30d" | "90d" = "30d",
  ): Promise<MarketMetrics> {
    try {
      const queryId = parseInt(
        process.env.NEXT_PUBLIC_DUNE_MARKET_METRICS_QUERY_ID || "0",
      );
      if (!queryId) {
        console.warn(
          "Market metrics query ID not configured, returning mock data",
        );
        return this.getMockMarketMetrics();
      }

      const contractAddress =
        process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT_ADDRESS ||
        "0xfb16e84ea1882f67";
      const rows = await this.executeQuery(queryId, {
        timeframe,
        contract_address: contractAddress,
      });

      const data = rows[0] || {};
      const categoryData = rows.slice(1) || []; // Assuming category breakdown follows

      return {
        totalMarkets: parseInt(String(data.total_markets)) || 0,
        totalVolume: String(data.total_volume) || "0",
        activeUsers: parseInt(String(data.active_users)) || 0,
        averageMarketDuration: parseFloat(String(data.avg_duration)) || 0,
        topCategory: String(data.top_category) || "Sports",
        successfulResolutions:
          parseInt(String(data.successful_resolutions)) || 0,
        totalFees: String(data.total_fees) || "0",
        marketsByCategory: categoryData.map((row: Record<string, unknown>) => ({
          category: String(row.category) || "Unknown",
          count: parseInt(String(row.market_count)) || 0,
          volume: String(row.category_volume) || "0",
        })),
      };
    } catch (error) {
      console.error("Failed to fetch market metrics from Dune:", error);
      return this.getMockMarketMetrics();
    }
  }

  // Get user-specific analytics
  async getUserAnalytics(userAddress: string): Promise<UserAnalytics> {
    try {
      const queryId = parseInt(
        process.env.NEXT_PUBLIC_DUNE_USER_ANALYTICS_QUERY_ID || "0",
      );
      if (!queryId) {
        console.warn(
          "User analytics query ID not configured, returning mock data",
        );
        return this.getMockUserAnalytics(userAddress);
      }

      const contractAddress =
        process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT_ADDRESS ||
        "0xfb16e84ea1882f67";
      const rows = await this.executeQuery(queryId, {
        user_address: userAddress,
        contract_address: contractAddress,
      });

      const data = rows[0] || {};

      return {
        userId: userAddress,
        totalBets: parseInt(String(data.total_bets)) || 0,
        winRate: parseFloat(String(data.win_rate)) || 0,
        totalVolume: String(data.total_volume) || "0",
        favoriteCategory: String(data.favorite_category) || "Sports",
        profitLoss: String(data.profit_loss) || "0",
        marketsCreated: parseInt(String(data.markets_created)) || 0,
        averageBetSize: String(data.avg_bet_size) || "0",
        longestStreak: parseInt(String(data.longest_streak)) || 0,
        rank: parseInt(String(data.user_rank)) || 0,
      };
    } catch (error) {
      console.error("Failed to fetch user analytics from Dune:", error);
      return this.getMockUserAnalytics(userAddress);
    }
  }

  // Get trending markets
  async getTrendingMarkets(limit: number = 10): Promise<TrendingMarket[]> {
    try {
      const queryId = parseInt(
        process.env.NEXT_PUBLIC_DUNE_TRENDING_MARKETS_QUERY_ID || "0",
      );
      if (!queryId) {
        console.warn(
          "Trending markets query ID not configured, returning mock data",
        );
        return this.getMockTrendingMarkets();
      }

      const contractAddress =
        process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT_ADDRESS ||
        "0xfb16e84ea1882f67";
      const rows = await this.executeQuery(queryId, {
        limit,
        contract_address: contractAddress,
      });

      return rows.map((row: Record<string, unknown>) => ({
        marketId: String(row.market_id) || "",
        question: String(row.question) || "",
        category: String(row.category) || "",
        volume: String(row.volume) || "0",
        participants: parseInt(String(row.participants)) || 0,
        endDate: String(row.end_date) || "",
        optionA: String(row.option_a) || "",
        optionB: String(row.option_b) || "",
        oddsProbability: parseFloat(String(row.odds_probability)) || 0.5,
      }));
    } catch (error) {
      console.error("Failed to fetch trending markets from Dune:", error);
      return this.getMockTrendingMarkets();
    }
  }

  // Get volume over time data for charts
  async getVolumeOverTime(
    timeframe: "7d" | "30d" | "90d" = "30d",
  ): Promise<VolumeOverTime[]> {
    try {
      const queryId = parseInt(
        process.env.NEXT_PUBLIC_DUNE_VOLUME_OVER_TIME_QUERY_ID || "0",
      );
      if (!queryId) {
        console.warn(
          "Volume over time query ID not configured, returning mock data",
        );
        return this.getMockVolumeOverTime();
      }

      const contractAddress =
        process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT_ADDRESS ||
        "0xfb16e84ea1882f67";
      const rows = await this.executeQuery(queryId, {
        timeframe,
        contract_address: contractAddress,
      });

      return rows.map((row: Record<string, unknown>) => ({
        date: String(row.date) || "",
        volume: String(row.volume) || "0",
        markets: parseInt(String(row.markets)) || 0,
        users: parseInt(String(row.users)) || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch volume over time from Dune:", error);
      return this.getMockVolumeOverTime();
    }
  }

  // Get category insights
  async getCategoryInsights(): Promise<CategoryInsights[]> {
    try {
      const queryId = parseInt(
        process.env.NEXT_PUBLIC_DUNE_CATEGORY_INSIGHTS_QUERY_ID || "0",
      );
      if (!queryId) {
        console.warn(
          "Category insights query ID not configured, returning mock data",
        );
        return this.getMockCategoryInsights();
      }

      const contractAddress =
        process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT_ADDRESS ||
        "0xfb16e84ea1882f67";
      const rows = await this.executeQuery(queryId, {
        contract_address: contractAddress,
      });

      return rows.map((row: Record<string, unknown>) => ({
        category: String(row.category) || "",
        volume: String(row.volume) || "0",
        markets: parseInt(String(row.markets)) || 0,
        avgResolutionTime: parseFloat(String(row.avg_resolution_time)) || 0,
        successRate: parseFloat(String(row.success_rate)) || 0,
      }));
    } catch (error) {
      console.error("Failed to fetch category insights from Dune:", error);
      return this.getMockCategoryInsights();
    }
  }

  // Test API connection
  async testConnection(): Promise<boolean> {
    try {
      // Try to get query info for a simple query or use a health check endpoint
      await this.client.get("/queries/recent");
      return true;
    } catch (error) {
      console.error("Dune API connection test failed:", error);
      return false;
    }
  }

  // Mock data methods for development/fallback
  private getMockMarketMetrics(): MarketMetrics {
    return {
      totalMarkets: 47,
      totalVolume: "12,450.75",
      activeUsers: 234,
      averageMarketDuration: 72.5,
      topCategory: "Sports",
      successfulResolutions: 42,
      totalFees: "248.12",
      marketsByCategory: [
        { category: "Sports", count: 18, volume: "5,234.50" },
        { category: "Crypto", count: 12, volume: "3,456.25" },
        { category: "Politics", count: 8, volume: "2,123.75" },
        { category: "Entertainment", count: 6, volume: "1,234.50" },
        { category: "Technology", count: 3, volume: "401.75" },
      ],
    };
  }

  private getMockUserAnalytics(userAddress: string): UserAnalytics {
    return {
      userId: userAddress,
      totalBets: 23,
      winRate: 0.652,
      totalVolume: "1,234.50",
      favoriteCategory: "Sports",
      profitLoss: "145.75",
      marketsCreated: 3,
      averageBetSize: "53.67",
      longestStreak: 7,
      rank: 42,
    };
  }

  private getMockTrendingMarkets(): TrendingMarket[] {
    return [
      {
        marketId: "1",
        question: "Will Bitcoin reach $100,000 before 2025?",
        category: "Crypto",
        volume: "2,345.50",
        participants: 156,
        endDate: "2024-12-31T23:59:59Z",
        optionA: "Yes",
        optionB: "No",
        oddsProbability: 0.65,
      },
      {
        marketId: "2",
        question: "Will the Lakers make the playoffs?",
        category: "Sports",
        volume: "1,876.25",
        participants: 134,
        endDate: "2024-04-15T23:59:59Z",
        optionA: "Yes",
        optionB: "No",
        oddsProbability: 0.72,
      },
      {
        marketId: "3",
        question: "Will Tesla stock hit $300 this year?",
        category: "Technology",
        volume: "1,234.75",
        participants: 89,
        endDate: "2024-12-31T23:59:59Z",
        optionA: "Yes",
        optionB: "No",
        oddsProbability: 0.45,
      },
    ];
  }

  private getMockVolumeOverTime(): VolumeOverTime[] {
    const days = 30;
    const data: VolumeOverTime[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      data.push({
        date: date.toISOString().split("T")[0],
        volume: (Math.random() * 1000 + 500).toFixed(2),
        markets: Math.floor(Math.random() * 10 + 1),
        users: Math.floor(Math.random() * 50 + 10),
      });
    }

    return data;
  }

  private getMockCategoryInsights(): CategoryInsights[] {
    return [
      {
        category: "Sports",
        volume: "5,234.50",
        markets: 18,
        avgResolutionTime: 68.5,
        successRate: 0.94,
      },
      {
        category: "Crypto",
        volume: "3,456.25",
        markets: 12,
        avgResolutionTime: 156.2,
        successRate: 0.83,
      },
      {
        category: "Politics",
        volume: "2,123.75",
        markets: 8,
        avgResolutionTime: 248.7,
        successRate: 0.88,
      },
      {
        category: "Entertainment",
        volume: "1,234.50",
        markets: 6,
        avgResolutionTime: 42.3,
        successRate: 0.92,
      },
      {
        category: "Technology",
        volume: "401.75",
        markets: 3,
        avgResolutionTime: 89.1,
        successRate: 1.0,
      },
    ];
  }
}

// Export a singleton instance
export const duneAnalytics = new DuneAnalytics({
  apiKey: process.env.NEXT_PUBLIC_DUNE_API_KEY || "demo-key",
});

// Export types for use in components
export type {
  MarketMetrics,
  UserAnalytics,
  TrendingMarket,
  VolumeOverTime,
  CategoryInsights,
  DuneConfig,
  DuneQueryResult,
};

export default DuneAnalytics;
