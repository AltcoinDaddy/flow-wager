import FlowUpdate from "FlowUpdate"

// Script to get FlowUpdate contract statistics
access(all) fun main(): {String: AnyStruct} {
    return FlowUpdate.getContractStats()
}
