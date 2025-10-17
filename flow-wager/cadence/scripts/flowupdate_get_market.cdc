import FlowUpdate from "FlowUpdate"

// Script to get a specific multi-option market by ID
access(all) fun main(marketId: UInt64): FlowUpdate.MultiOptionMarket? {
    return FlowUpdate.getMarket(marketId: marketId)
}
