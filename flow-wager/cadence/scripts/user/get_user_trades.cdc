import FungibleToken from "FungibleToken"      // Replace with FungibleToken address
import FlowToken from "FlowToken"           // Replace with FlowToken address
import FlowWagerV2 from "FlowWagerV2"         // Replace with your FlowWagerV2 address

// This struct holds the detailed, combined information for a single active trade.
access(all) struct TradeDetails {
    access(all) let marketId: UInt64
    access(all) let marketTitle: String
    access(all) let marketDescription: String
    access(all) let options: [String]
    access(all) let userSharesPerOption: [UFix64]
    access(all) let totalInvested: UFix64
    access(all) let averagePrice: UFix64
    access(all) let endTime: UFix64
    access(all) let currentValue: UFix64
    access(all) let profitLoss: Fix64

    init(
        marketId: UInt64,
        marketTitle: String,
        marketDescription: String,
        options: [String],
        userSharesPerOption: [UFix64],
        totalInvested: UFix64,
        averagePrice: UFix64,
        endTime: UFix64,
        currentValue: UFix64,
        profitLoss: Fix64
    ) {
        self.marketId = marketId
        self.marketTitle = marketTitle
        self.marketDescription = marketDescription
        self.options = options
        self.userSharesPerOption = userSharesPerOption
        self.totalInvested = totalInvested
        self.averagePrice = averagePrice
        self.endTime = endTime
        self.currentValue = currentValue
        self.profitLoss = profitLoss
    }
}

// This struct is the final return object, containing all active trades and a summary.
access(all) struct UserTrades {
    access(all) let activeTrades: [TradeDetails]
    access(all) let totalDeposited: UFix64

    init(activeTrades: [TradeDetails], totalDeposited: UFix64) {
        self.activeTrades = activeTrades
        self.totalDeposited = totalDeposited
    }
}

// Helper function to sum an array of UFix64
access(all) fun sum(numbers: [UFix64]): UFix64 {
    var total: UFix64 = 0.0
    for num in numbers {
        total = total + num
    }
    return total
}

// The main function that orchestrates fetching and calculating the user's trades.
access(all) fun main(userAddress: Address): UserTrades? {
    // 1. Get the user's public account object.
    let account = getAccount(userAddress)

    // 2. Borrow the public capability for their positions. If it doesn't exist, they are not set up.
    let positionsCap = account.capabilities.borrow<&{FlowWagerV2.UserPositionsPublic}>(
        FlowWagerV2.UserPositionsPublicPath
    ) ?? panic("Could not borrow UserPositionsPublic capability for this address. The user may not have an account set up.")

    // 3. Get the dictionary of all their positions.
    let positionsDict = positionsCap.getAllPositions()

    var activeTrades: [TradeDetails] = []
    var totalDeposited: UFix64 = 0.0

    // 4. Loop through each position the user holds.
    for position in positionsDict.values {
        // Add to total deposited regardless of market status.
        totalDeposited = totalDeposited + position.totalInvested

        // 5. Fetch the corresponding market data.
        if let market = FlowWagerV2.getMarketById(marketId: position.marketId) {
            // 6. Only include trades for markets that are currently active.
            if market.status == FlowWagerV2.MarketStatus.Active {

                // --- Perform Calculations ---
                let userTotalShares = sum(numbers: position.optionShares)
                var currentValue: UFix64 = 0.0

                // The market's total pool is needed for the calculation.
                // Note: The `market.totalShares` field would be needed for a more precise
                // AMM-based calculation, but using the total pool is a valid approach.
                if market.totalPool > 0.0 {
                     let distributablePool = market.totalPool * (1.0 - (FlowWagerV2.platformFeePercentage / 100.0))
                     currentValue = distributablePool // This is a simplification; a real AMM would have a more complex formula.
                }

                let profitLoss = Fix64(currentValue) - Fix64(position.totalInvested)

                // --- Construct the Details ---
                activeTrades.append(TradeDetails(
                    marketId: market.id,
                    marketTitle: market.title,
                    marketDescription: market.description,
                    options: market.options,
                    userSharesPerOption: position.optionShares,
                    totalInvested: position.totalInvested,
                    averagePrice: position.averagePrice,
                    endTime: market.endTime,
                    currentValue: currentValue,
                    profitLoss: profitLoss
                ))
            }
        }
    }

    // 7. Return the final compiled data.
    return UserTrades(activeTrades: activeTrades, totalDeposited: totalDeposited)
}
