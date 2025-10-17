import FlowUpdate from "FlowUpdate"

// Test script to retrieve and analyze market details
access(all) fun main(): {String: AnyStruct} {
    let results: {String: AnyStruct} = {}

    log("=== FlowUpdate Market Retrieval Tests ===")

    // Test 1: Get all active markets
    log("Test 1: Active Markets Overview")
    let activeMarkets = FlowUpdate.getActiveMarkets()
    results["totalActiveMarkets"] = activeMarkets.keys.length
    results["marketIds"] = activeMarkets.keys

    log("Total Active Markets: ".concat(activeMarkets.keys.length.toString()))

    if activeMarkets.keys.length == 0 {
        log("⚠️  No active markets found. Create some markets first!")
        results["hasMarkets"] = false
        return results
    }

    results["hasMarkets"] = true
    log("Active Market IDs: ".concat(activeMarkets.keys.toString()))

    // Test 2: Detailed market analysis
    log("\nTest 2: Market Details Analysis")
    let marketDetails: [{String: AnyStruct}] = []

    for marketId in activeMarkets.keys {
        if let market = FlowUpdate.getMarket(marketId: marketId) {
            log("\n--- Market ID: ".concat(marketId.toString()).concat(" ---"))
            log("Title: ".concat(market.title))
            log("Description: ".concat(market.description))
            log("Creator: ".concat(market.creator.toString()))
            log("Category: ".concat(market.category.rawValue.toString()))
            log("Status: ".concat(market.status.rawValue.toString()))
            log("Options Count: ".concat(market.options.length.toString()))

            // List all options
            log("Options:")
            var i = 0
            while i < market.options.length {
                log("  [".concat(i.toString()).concat("] ").concat(market.options[i]))
                i = i + 1
            }

            log("Min Bet: ".concat(market.minBet.toString()).concat(" FLOW"))
            log("Max Bet: ".concat(market.maxBet.toString()).concat(" FLOW"))
            log("Total Pool: ".concat(market.totalPool.toString()).concat(" FLOW"))
            log("Created At: ".concat(market.createdAt.toString()))
            log("End Time: ".concat(market.endTime.toString()))
            log("Max Options: ".concat(market.maxOptions.toString()))
            log("Resolved: ".concat(market.resolved ? "Yes" : "No"))

            if market.resolved {
                if let winningOption = market.winningOption {
                    log("Winning Option: ".concat(winningOption.toString()))
                }
            }

            // Create detailed market info
            let marketInfo: {String: AnyStruct} = {}
            marketInfo["id"] = market.id
            marketInfo["title"] = market.title
            marketInfo["description"] = market.description
            marketInfo["creator"] = market.creator.toString()
            marketInfo["category"] = market.category.rawValue
            marketInfo["categoryName"] = getCategoryName(market.category.rawValue)
            marketInfo["status"] = market.status.rawValue
            marketInfo["statusName"] = getStatusName(market.status.rawValue)
            marketInfo["optionsCount"] = market.options.length
            marketInfo["options"] = market.options
            marketInfo["minBet"] = market.minBet
            marketInfo["maxBet"] = market.maxBet
            marketInfo["totalPool"] = market.totalPool
            marketInfo["createdAt"] = market.createdAt
            marketInfo["endTime"] = market.endTime
            marketInfo["resolved"] = market.resolved
            marketInfo["winningOption"] = market.winningOption
            marketInfo["imageUrl"] = market.imageUrl

            // Calculate market metrics
            marketInfo["duration"] = market.endTime - market.createdAt
            marketInfo["timeRemaining"] = market.endTime > getCurrentBlock().timestamp ?
                market.endTime - getCurrentBlock().timestamp : 0.0
            marketInfo["isActive"] = getCurrentBlock().timestamp < market.endTime &&
                market.status.rawValue == FlowUpdate.MultiMarketStatus.Active.rawValue

            // Analyze total shares distribution
            var totalShares = 0.0
            let sharesPerOption: [UFix64] = []
            var j = 0
            while j < market.totalShares.length {
                sharesPerOption.append(market.totalShares[j])
                totalShares = totalShares + market.totalShares[j]
                j = j + 1
            }
            marketInfo["totalShares"] = totalShares
            marketInfo["sharesPerOption"] = sharesPerOption

            marketDetails.append(marketInfo)
        } else {
            log("⚠️  Could not retrieve market with ID: ".concat(marketId.toString()))
        }
    }

    results["marketDetails"] = marketDetails

    // Test 3: Market statistics
    log("\nTest 3: Market Statistics")
    let stats: {String: AnyStruct} = {}

    // Category distribution
    let categoryDistribution: {UInt8: Int} = {}
    for market in marketDetails {
        let category = market["category"] as! UInt8
        categoryDistribution[category] = (categoryDistribution[category] ?? 0) + 1
    }
    stats["categoryDistribution"] = categoryDistribution

    // Options distribution
    let optionDistribution: {Int: Int} = {}
    for market in marketDetails {
        let optionCount = market["optionsCount"] as! Int
        optionDistribution[optionCount] = (optionDistribution[optionCount] ?? 0) + 1
    }
    stats["optionDistribution"] = optionDistribution

    // Bet range analysis
    var minBetRange: [UFix64] = []
    var maxBetRange: [UFix64] = []
    for market in marketDetails {
        minBetRange.append(market["minBet"] as! UFix64)
        maxBetRange.append(market["maxBet"] as! UFix64)
    }
    stats["minBetRange"] = minBetRange
    stats["maxBetRange"] = maxBetRange

    // Pool analysis
    var totalPoolSum = 0.0
    var poolDistribution: [UFix64] = []
    for market in marketDetails {
        let pool = market["totalPool"] as! UFix64
        totalPoolSum = totalPoolSum + pool
        poolDistribution.append(pool)
    }
    stats["totalPoolSum"] = totalPoolSum
    stats["poolDistribution"] = poolDistribution

    results["statistics"] = stats

    log("Category Distribution:")
    for category in categoryDistribution.keys {
        log("  Category ".concat(category.toString()).concat(": ").concat(categoryDistribution[category]!.toString()).concat(" markets"))
    }

    log("Option Count Distribution:")
    for optionCount in optionDistribution.keys {
        log("  ".concat(optionCount.toString()).concat(" options: ").concat(optionDistribution[optionCount]!.toString()).concat(" markets"))
    }

    log("Total Pool Sum: ".concat(totalPoolSum.toString()).concat(" FLOW"))

    // Test 4: Market validation
    log("\nTest 4: Market Validation")
    let validation: {String: Int} = {}
    validation["totalMarkets"] = marketDetails.length
    validation["activeMarkets"] = 0
    validation["resolvedMarkets"] = 0
    validation["marketsWithPools"] = 0
    validation["marketsWithoutPools"] = 0

    for market in marketDetails {
        let isActive = market["isActive"] as! Bool
        let resolved = market["resolved"] as! Bool
        let totalPool = market["totalPool"] as! UFix64

        if isActive {
            validation["activeMarkets"] = validation["activeMarkets"]! + 1
        }
        if resolved {
            validation["resolvedMarkets"] = validation["resolvedMarkets"]! + 1
        }
        if totalPool > 0.0 {
            validation["marketsWithPools"] = validation["marketsWithPools"]! + 1
        } else {
            validation["marketsWithoutPools"] = validation["marketsWithoutPools"]! + 1
        }
    }

    results["validation"] = validation

    log("Validation Results:")
    log("  Total Markets: ".concat(validation["totalMarkets"]!.toString()))
    log("  Active Markets: ".concat(validation["activeMarkets"]!.toString()))
    log("  Resolved Markets: ".concat(validation["resolvedMarkets"]!.toString()))
    log("  Markets with Pools: ".concat(validation["marketsWithPools"]!.toString()))
    log("  Markets without Pools: ".concat(validation["marketsWithoutPools"]!.toString()))

    // Test 5: Invalid market ID test
    log("\nTest 5: Invalid Market ID Test")
    let invalidMarket = FlowUpdate.getMarket(marketId: 99999)
    results["invalidMarketTest"] = invalidMarket == nil
    log("Invalid market ID returns nil: ".concat((invalidMarket == nil) ? "PASS" : "FAIL"))

    // Summary
    log("\n=== Test Summary ===")
    log("Markets analyzed: ".concat(marketDetails.length.toString()))
    log("Total pool value: ".concat(totalPoolSum.toString()).concat(" FLOW"))
    log("Categories represented: ".concat(categoryDistribution.keys.length.toString()))
    log("Market retrieval tests completed successfully!")

    return results
}

// Helper function to get category name
access(all) fun getCategoryName(_ categoryValue: UInt8): String {
    switch categoryValue {
        case 0: return "Sports"
        case 1: return "Politics"
        case 2: return "Entertainment"
        case 3: return "Crypto"
        case 4: return "Finance"
        case 5: return "Other"
        default: return "Unknown"
    }
}

// Helper function to get status name
access(all) fun getStatusName(_ statusValue: UInt8): String {
    switch statusValue {
        case 0: return "Active"
        case 1: return "Paused"
        case 2: return "Resolved"
        case 3: return "Cancelled"
        default: return "Unknown"
    }
}
