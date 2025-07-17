import "FlowWager"

access(all) fun main(userAddress: Address): {UInt64: FlowWager.UserPosition} {
    return FlowWager.getUserPositions(address: userAddress)
}