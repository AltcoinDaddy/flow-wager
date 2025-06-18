// cadence/scripts/get_platform_stats.cdc
// Script to get platform-wide statistics - Fixed for Cadence 1.0

import FlowWager from "FlowWager"

access(all) fun main(): PlatformStats {
    let rawStats = FlowWager.getPlatformStats()
    let allMarkets = FlowWager.getAllMarkets()
    
    // Calculate additional metrics
    var activeMarketsCount: UInt64 = 0
    var pendingMarketsCount: UInt64 = 0
    var resolvedMarketsCount: UInt64 = 0
    var breakingNewsCount: UInt64 = 0
    var totalVolume24h: UFix64 = 0.0
    var totalVolumeCalculated: UFix64 = 0.0
    
    let categoryCounts: {UInt8: UInt64} = {}
    let categoryVolumes: {UInt8: UFix64} = {}
    
    let currentTime = getCurrentBlock().timestamp
    let dayAgo = currentTime - 86400.0 // 24 hours
    
    for market in allMarkets {
        // Count by status using raw values
        let statusValue = market.status.rawValue
        switch statusValue {
            case 0: // ACTIVE
                activeMarketsCount = activeMarketsCount + 1
            case 1: // PENDING
                pendingMarketsCount = pendingMarketsCount + 1
            case 2: // RESOLVED
                resolvedMarketsCount = resolvedMarketsCount + 1
        }
        
        // Count breaking news using category as proxy
        if market.category.rawValue == 4 { // 4 = Breaking News category
            breakingNewsCount = breakingNewsCount + 1
        }
        
        // Volume in last 24 hours (simplified - use placeholder for now)
        totalVolume24h = totalVolume24h + market.totalPool * 0.1 // Placeholder calculation
        totalVolumeCalculated = totalVolumeCalculated + market.totalPool
        
        // Category statistics
        let categoryValue = market.category.rawValue
        if categoryCounts.containsKey(categoryValue) {
            categoryCounts[categoryValue] = categoryCounts[categoryValue]! + 1
            categoryVolumes[categoryValue] = categoryVolumes[categoryValue]! + market.totalPool
        } else {
            categoryCounts[categoryValue] = 1
            categoryVolumes[categoryValue] = market.totalPool
        }
    }
    
    // Convert category data to structured format
    let categoryStats: [CategoryStat] = []
    for categoryValue in categoryCounts.keys {
        let categoryName = getCategoryName(categoryValue)
        let stat = CategoryStat(
            category: categoryValue,
            categoryName: categoryName,
            marketCount: categoryCounts[categoryValue]!,
            totalVolume: categoryVolumes[categoryValue]!
        )
        categoryStats.append(stat)
    }
    
    return PlatformStats(
        totalMarkets: UInt64(allMarkets.length),
        activeMarkets: activeMarketsCount,
        pendingMarkets: pendingMarketsCount,
        resolvedMarkets: resolvedMarketsCount,
        breakingNewsMarkets: breakingNewsCount,
        totalVolume: totalVolumeCalculated,
        totalVolume24h: totalVolume24h,
        totalUsers: 0, // Placeholder - replace when available
        totalFeesCollected: totalVolumeCalculated * 0.03, // 3% fee estimate
        feePercentage: 3.0, // 3% platform fee
        categoryStats: categoryStats,
        averagePoolSize: calculateAveragePoolSize(allMarkets),
        averageMarketDuration: calculateAverageMarketDuration(allMarkets),
        platformUtilization: calculatePlatformUtilization(activeMarketsCount, UInt64(allMarkets.length))
    )
}

access(all) struct PlatformStats {
    access(all) let totalMarkets: UInt64
    access(all) let activeMarkets: UInt64
    access(all) let pendingMarkets: UInt64
    access(all) let resolvedMarkets: UInt64
    access(all) let breakingNewsMarkets: UInt64
    access(all) let totalVolume: UFix64
    access(all) let totalVolume24h: UFix64
    access(all) let totalUsers: UInt64
    access(all) let totalFeesCollected: UFix64
    access(all) let feePercentage: UFix64
    access(all) let categoryStats: [CategoryStat]
    access(all) let averagePoolSize: UFix64
    access(all) let averageMarketDuration: UFix64
    access(all) let platformUtilization: UFix64
    
    init(
        totalMarkets: UInt64,
        activeMarkets: UInt64,
        pendingMarkets: UInt64,
        resolvedMarkets: UInt64,
        breakingNewsMarkets: UInt64,
        totalVolume: UFix64,
        totalVolume24h: UFix64,
        totalUsers: UInt64,
        totalFeesCollected: UFix64,
        feePercentage: UFix64,
        categoryStats: [CategoryStat],
        averagePoolSize: UFix64,
        averageMarketDuration: UFix64,
        platformUtilization: UFix64
    ) {
        self.totalMarkets = totalMarkets
        self.activeMarkets = activeMarkets
        self.pendingMarkets = pendingMarkets
        self.resolvedMarkets = resolvedMarkets
        self.breakingNewsMarkets = breakingNewsMarkets
        self.totalVolume = totalVolume
        self.totalVolume24h = totalVolume24h
        self.totalUsers = totalUsers
        self.totalFeesCollected = totalFeesCollected
        self.feePercentage = feePercentage
        self.categoryStats = categoryStats
        self.averagePoolSize = averagePoolSize
        self.averageMarketDuration = averageMarketDuration
        self.platformUtilization = platformUtilization
    }
}

access(all) struct CategoryStat {
    access(all) let category: UInt8
    access(all) let categoryName: String
    access(all) let marketCount: UInt64
    access(all) let totalVolume: UFix64
    
    init(category: UInt8, categoryName: String, marketCount: UInt64, totalVolume: UFix64) {
        self.category = category
        self.categoryName = categoryName
        self.marketCount = marketCount
        self.totalVolume = totalVolume
    }
}

access(all) fun getCategoryName(_ categoryValue: UInt8): String {
    switch categoryValue {
        case 0:
            return "Sports"
        case 1:
            return "Politics"
        case 2:
            return "Entertainment"
        case 3:
            return "Technology"
        case 4:
            return "Breaking News"
        case 5:
            return "Crypto"
        case 6:
            return "World Events"
        case 7:
            return "Economy"
        case 8:
            return "Elections"
        default:
            return "Unknown"
    }
}

access(all) fun calculateAveragePoolSize(_ markets: [FlowWager.Market]): UFix64 {
    if markets.length == 0 {
        return 0.0
    }
    
    var totalPool: UFix64 = 0.0
    for market in markets {
        totalPool = totalPool + market.totalPool
    }
    
    return totalPool / UFix64(markets.length)
}

access(all) fun calculateAverageMarketDuration(_ markets: [FlowWager.Market]): UFix64 {
    if markets.length == 0 {
        return 0.0
    }
    
    var totalDuration: UFix64 = 0.0
    for market in markets {
        // Use placeholder calculation since creationTime might not exist
        // Replace with actual: market.endTime - market.creationTime
        let duration = 86400.0 // Placeholder: 1 day duration
        totalDuration = totalDuration + duration
    }
    
    return totalDuration / UFix64(markets.length)
}

access(all) fun calculatePlatformUtilization(_ activeMarkets: UInt64, _ totalMarkets: UInt64): UFix64 {
    if totalMarkets == 0 {
        return 0.0
    }
    
    return UFix64(activeMarkets) / UFix64(totalMarkets) * 100.0
}