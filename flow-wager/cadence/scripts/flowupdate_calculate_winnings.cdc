import FlowUpdate from "FlowUpdate"

// Script to calculate potential winnings for a user position if a specific option wins
access(all) fun main(
    marketId: UInt64,
    userAddress: Address,
    winningOption: UInt8
): UFix64 {
    let account = getAccount(userAddress)

    // Try to borrow the user's MultiOptionPositions resource
    if let positionsRef = account.capabilities.borrow<&FlowUpdate.MultiOptionPositions>(FlowUpdate.MultiOptionPositionsPublicPath) {
        if let position = positionsRef.getPosition(marketId: marketId) {
            return FlowUpdate.calculatePotentialWinnings(
                marketId: marketId,
                position: position,
                winningOption: winningOption
            )
        }
    }

    // Return 0.0 if user has no position in this market
    return 0.0
}
