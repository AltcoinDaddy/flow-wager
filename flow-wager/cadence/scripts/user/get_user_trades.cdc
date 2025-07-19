import FlowWager from "FlowWager"

// Define a struct to represent a user's position in an active market
access(all) struct ActivePosition {
    access(all) let marketId: UInt64
    access(all) let marketTitle: String
    access(all) let optionAShares: UFix64
    access(all) let optionBShares: UFix64
    access(all) let totalInvested: UFix64

    init(
        marketId: UInt64,
        marketTitle: String,
        optionAShares: UFix64,
        optionBShares: UFix64,
        totalInvested: UFix64
    ) {
        self.marketId = marketId
        self.marketTitle = marketTitle
        self.optionAShares = optionAShares
        self.optionBShares = optionBShares
        self.totalInvested = totalInvested
    }
}

// Main function to track user trades in active markets
access(all) fun main(userAddress: Address): [ActivePosition] {
    // Get the user's positions
    let positionsDict = FlowWager.getUserPositions(address: userAddress)
    
    // Initialize an array to store active positions
    var activePositions: [ActivePosition] = []
    
    // Iterate over each market ID in the user's positions
    for marketId in positionsDict.keys {
        // Get the market details for the current market ID
        if let market = FlowWager.getMarket(marketId: marketId) {
            // Check if the market is active
            if market.status == FlowWager.MarketStatus.Active {
                // Get the user's position for this market
                let position = positionsDict[marketId]!
                
                // Add the position to the active positions array
                activePositions.append(ActivePosition(
                    marketId: marketId,
                    marketTitle: market.title,
                    optionAShares: position.optionAShares,
                    optionBShares: position.optionBShares,
                    totalInvested: position.totalInvested
                ))
            }
        }
    }
    
    // Return the list of active positions
    return activePositions
}