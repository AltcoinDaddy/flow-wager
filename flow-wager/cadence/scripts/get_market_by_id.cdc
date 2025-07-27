import "FlowWager"

access(all) fun main(marketId: UInt64): FlowWager.Market? {
    return FlowWager.getMarketById(marketId: marketId)
}