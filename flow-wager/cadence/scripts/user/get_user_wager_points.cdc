import "FlowWager"

access(all) fun main(userAddress: Address): UInt64 {
    return FlowWager.getWagerPoints(address: userAddress)
}