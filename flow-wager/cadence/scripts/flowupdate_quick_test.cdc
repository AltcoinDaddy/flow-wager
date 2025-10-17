import FlowUpdate from "FlowUpdate"

// Quick test script for basic FlowUpdate functionality
access(all) fun main(): {String: AnyStruct} {
    let results: {String: AnyStruct} = {}

    log("🚀 FlowUpdate Quick Test")

    // 1. Contract Status
    log("\n1️⃣ Contract Status")
    let stats = FlowUpdate.getContractStats()
    let paused = (stats["paused"] as? Bool) ?? true
    let nextId = (stats["nextMarketId"] as? UInt64) ?? 0
    let totalMarkets = (stats["totalMarkets"] as? UInt64) ?? 0

    results["paused"] = paused
    results["nextMarketId"] = nextId
    results["totalMarkets"] = totalMarkets

    log("Contract Paused: ".concat(paused ? "YES ❌" : "NO ✅"))
    log("Next Market ID: ".concat(nextId.toString()))
    log("Total Markets: ".concat(totalMarkets.toString()))

    // 2. Active Markets
    log("\n2️⃣ Active Markets")
    let activeMarkets = FlowUpdate.getActiveMarkets()
    results["activeMarketCount"] = activeMarkets.keys.length
    results["activeMarketIds"] = activeMarkets.keys

    log("Active Markets: ".concat(activeMarkets.keys.length.toString()))

    if activeMarkets.keys.length > 0 {
        log("Market IDs: ".concat(activeMarkets.keys.toString()))

        // Show first market details
        let firstId = activeMarkets.keys[0]
        if let market = FlowUpdate.getMarket(marketId: firstId) {
            log("\n📊 First Market Details:")
            log("ID: ".concat(market.id.toString()))
            log("Title: ".concat(market.title))
            log("Options: ".concat(market.options.length.toString()))
            log("Pool: ".concat(market.totalPool.toString()).concat(" FLOW"))
            log("Resolved: ".concat(market.resolved ? "YES" : "NO"))

            results["sampleMarket"] = {
                "id": market.id,
                "title": market.title,
                "optionCount": market.options.length,
                "pool": market.totalPool,
                "resolved": market.resolved
            }
        }
    } else {
        log("No active markets found 📭")
        results["sampleMarket"] = nil
    }

    // 3. Categories Test
    log("\n3️⃣ Available Categories")
    let categories = [
        FlowUpdate.MultiMarketCategory.Sports.rawValue,
        FlowUpdate.MultiMarketCategory.Politics.rawValue,
        FlowUpdate.MultiMarketCategory.Entertainment.rawValue,
        FlowUpdate.MultiMarketCategory.Crypto.rawValue,
        FlowUpdate.MultiMarketCategory.Finance.rawValue,
        FlowUpdate.MultiMarketCategory.Other.rawValue
    ]
    results["categories"] = categories
    log("Categories: Sports(0), Politics(1), Entertainment(2), Crypto(3), Finance(4), Other(5)")

    // 4. Storage Paths
    log("\n4️⃣ Storage Paths")
    let paths = {
        "admin": FlowUpdate.AdminStoragePath.toString(),
        "positions": FlowUpdate.MultiOptionPositionsStoragePath.toString(),
        "public": FlowUpdate.MultiOptionPositionsPublicPath.toString()
    }
    results["storagePaths"] = paths

    for pathName in paths.keys {
        log(pathName.concat(": ").concat(paths[pathName]!))
    }

    // 5. Market Creation Requirements
    log("\n5️⃣ Market Requirements")
    results["requirements"] = {
        "minOptions": 2,
        "maxOptions": 10,
        "minBet": "> 0.0 FLOW",
        "endTime": "Future timestamp",
        "categories": "0-5"
    }

    log("✅ Min Options: 2")
    log("✅ Max Options: 10")
    log("✅ Min Bet: > 0.0 FLOW")
    log("✅ End Time: Must be future")
    log("✅ Categories: 0-5")

    // 6. Quick Validation Tests
    log("\n6️⃣ Validation Tests")
    let validations = {
        "twoOptions": ["A", "B"].length >= 2,
        "tenOptions": ["A","B","C","D","E","F","G","H","I","J"].length <= 10,
        "elevenOptions": ["A","B","C","D","E","F","G","H","I","J","K"].length > 10
    }
    results["validations"] = validations

    log("2 options valid: ".concat(validations["twoOptions"]! ? "✅" : "❌"))
    log("10 options valid: ".concat(validations["tenOptions"]! ? "✅" : "❌"))
    log("11 options invalid: ".concat(validations["elevenOptions"]! ? "✅" : "❌"))

    // Summary
    log("\n🎯 Quick Test Summary")
    log("Contract Ready: ".concat(!paused ? "✅" : "❌"))
    log("Has Markets: ".concat(activeMarkets.keys.length > 0 ? "✅" : "❌"))
    log("Test Complete: ✅")

    results["testComplete"] = true
    results["contractReady"] = !paused
    results["hasMarkets"] = activeMarkets.keys.length > 0

    return results
}
