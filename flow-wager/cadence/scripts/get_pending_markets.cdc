import "FlowWager"

access(all) fun main(): [FlowWager.Market] {
    return FlowWager.getPendingResolutionMarkets()
}