import FlowUpdate from "FlowUpdate"

// Script to get all active multi-option markets
access(all) fun main(): {UInt64: FlowUpdate.MultiOptionMarket} {
    return FlowUpdate.getActiveMarkets()
}
