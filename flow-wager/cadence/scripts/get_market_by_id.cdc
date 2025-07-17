import "FlowWager"

access(all) fun main(marketId: UInt64): FlowWager.Market? {
    return FlowWager.getMarket(marketId: marketId)
}