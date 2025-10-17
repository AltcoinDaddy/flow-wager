import FlowUpdate from "FlowUpdate"

// Script to get a user's multi-option positions
access(all) fun main(userAddress: Address): {UInt64: FlowUpdate.MultiOptionPosition} {
    let account = getAccount(userAddress)

    // Try to borrow the user's MultiOptionPositions resource
    if let positionsRef = account.capabilities.borrow<&FlowUpdate.MultiOptionPositions>(FlowUpdate.MultiOptionPositionsPublicPath) {
        return positionsRef.getAllPositions()
    }

    // Return empty dictionary if user doesn't have positions resource
    return {}
}
