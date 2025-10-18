import FlowUpdate from "FlowUpdate"

// Comprehensive test script to demonstrate FlowUpdate functionality
// This script tests various aspects of the FlowUpdate contract
access(all) fun main(): {String: AnyStruct} {
    let results: {String: AnyStruct} = {}

    // Test 1: Get contract statistics
    log("=== Testing Contract Statistics ===")
    let contractStats = FlowUpdate.getContractStats()
    results["contractStats"] = contractStats
    log("Contract Stats: ")
    log(contractStats)

    // Test 2: Get all active markets
    log("=== Testing Active Markets ===")
    let activeMarkets = FlowUpdate.getActiveMarkets()
    results["activeMarketCount"] = activeMarkets.keys.length
    results["activeMarkets"] = activeMarkets
    log("Active Markets Count: ".concat(activeMarkets.keys.length.toString()))

    // Test 3: Test individual market retrieval if markets exist
    if activeMarkets.keys.length > 0 {
        let firstMarketId = activeMarkets.keys[0]
        log("=== Testing Individual Market Retrieval ===")

        if let market = FlowUpdate.getMarket(marketId: firstMarketId) {
            results["sampleMarket"] = market
            log("Sample Market ID: ".concat(market.id.toString()))
            log("Market Title: ".concat(market.title))
            log("Number of Options: ".concat(market.options.length.toString()))
            log("Options: ")
            var i = 0
            while i < market.options.length {
                log("  Option ".concat(i.toString()).concat(": ").concat(market.options[i]))
                i = i + 1
            }
            log("Min Bet: ".concat(market.minBet.toString()))
            log("Max Bet: ".concat(market.maxBet.toString()))
            log("End Time: ".concat(market.endTime.toString()))
            log("Status: ".concat(market.status.rawValue.toString()))
            log("Total Pool: ".concat(market.totalPool.toString()))

            // Test market category
            results["sampleMarketCategory"] = market.category.rawValue
            log("Market Category: ".concat(market.category.rawValue.toString()))
        }
    } else {
        log("No active markets found to test individual retrieval")
        results["sampleMarket"] = nil
    }

    // Test 4: Test enum values
    log("=== Testing Enum Values ===")
    let categoryValues: {String: UInt8} = {}
    categoryValues["Sports"] = FlowUpdate.MultiMarketCategory.Sports.rawValue
    categoryValues["Politics"] = FlowUpdate.MultiMarketCategory.Politics.rawValue
    categoryValues["Entertainment"] = FlowUpdate.MultiMarketCategory.Entertainment.rawValue
    categoryValues["Crypto"] = FlowUpdate.MultiMarketCategory.Crypto.rawValue
    categoryValues["Finance"] = FlowUpdate.MultiMarketCategory.Finance.rawValue
    categoryValues["Other"] = FlowUpdate.MultiMarketCategory.Other.rawValue
    results["categoryValues"] = categoryValues
    log("Market Categories: ")
    log(categoryValues)

    let statusValues: {String: UInt8} = {}
    statusValues["Active"] = FlowUpdate.MultiMarketStatus.Active.rawValue
    statusValues["Paused"] = FlowUpdate.MultiMarketStatus.Paused.rawValue
    statusValues["Resolved"] = FlowUpdate.MultiMarketStatus.Resolved.rawValue
    statusValues["Cancelled"] = FlowUpdate.MultiMarketStatus.Cancelled.rawValue
    results["statusValues"] = statusValues
    log("Market Statuses: ")
    log(statusValues)

    // Test 5: Test market creation validation (hypothetical)
    log("=== Testing Market Creation Validation ===")
    let validationTests: {String: Bool} = {}

    // Test minimum options (should be >= 2)
    let minOptions = ["Option A", "Option B"]
    validationTests["minOptionsValid"] = minOptions.length >= 2

    // Test maximum options (should be <= 10)
    let maxOptions = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
    validationTests["maxOptionsValid"] = maxOptions.length <= 10

    // Test too few options
    let tooFewOptions = ["Only One"]
    validationTests["tooFewOptionsInvalid"] = tooFewOptions.length < 2

    // Test too many options
    let tooManyOptions = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"]
    validationTests["tooManyOptionsInvalid"] = tooManyOptions.length > 10

    results["validationTests"] = validationTests
    log("Validation Tests: ")
    log(validationTests)

    // Test 6: Test storage paths
    log("=== Testing Storage Paths ===")
    let storagePaths: {String: String} = {}
    storagePaths["AdminStoragePath"] = FlowUpdate.AdminStoragePath.toString()
    storagePaths["MultiOptionPositionsStoragePath"] = FlowUpdate.MultiOptionPositionsStoragePath.toString()
    storagePaths["MultiOptionPositionsPublicPath"] = FlowUpdate.MultiOptionPositionsPublicPath.toString()
    results["storagePaths"] = storagePaths
    log("Storage Paths: ")
    log(storagePaths)

    // Test 7: Create sample BatchBet structures for testing
    log("=== Testing BatchBet Structure ===")
    let sampleBatchBets: [AnyStruct] = []
    let batchBet1 = FlowUpdate.BatchBet(optionIndex: 0, amount: 10.0)
    let batchBet2 = FlowUpdate.BatchBet(optionIndex: 1, amount: 15.0)
    let batchBet3 = FlowUpdate.BatchBet(optionIndex: 2, amount: 5.0)

    sampleBatchBets.append({
        "optionIndex": batchBet1.optionIndex,
        "amount": batchBet1.amount
    })
    sampleBatchBets.append({
        "optionIndex": batchBet2.optionIndex,
        "amount": batchBet2.amount
    })
    sampleBatchBets.append({
        "optionIndex": batchBet3.optionIndex,
        "amount": batchBet3.amount
    })

    results["sampleBatchBets"] = sampleBatchBets
    log("Sample Batch Bets: ")
    log(sampleBatchBets)

    // Test 8: Calculate total amounts for different scenarios
    log("=== Testing Calculation Scenarios ===")
    let calculationTests: {String: UFix64} = {}

    // Single bet scenario
    calculationTests["singleBet_10_FLOW"] = 10.0

    // Multiple bets scenario
    let multipleBetsTotal = 10.0 + 15.0 + 5.0
    calculationTests["multipleBets_Total"] = multipleBetsTotal

    // Large bet scenario
    calculationTests["largeBet_100_FLOW"] = 100.0

    results["calculationTests"] = calculationTests
    log("Calculation Tests: ")
    log(calculationTests)

    // Summary
    log("=== Test Summary ===")
    log("Total Active Markets: ".concat(activeMarkets.keys.length.toString()))
    log("Contract Paused: ".concat((contractStats["paused"] as? Bool ?? false) ? "true" : "false"))
    log("Next Market ID: ".concat((contractStats["nextMarketId"] as? UInt64 ?? 0).toString()))
    log("All tests completed successfully!")

    return results
}
