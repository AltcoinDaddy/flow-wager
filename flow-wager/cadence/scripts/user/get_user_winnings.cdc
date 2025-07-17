import "FlowWager"

access(all) fun main(userAddress: Address): [FlowWager.ClaimableWinnings] {
    return FlowWager.getClaimableWinnings(address: userAddress)
}