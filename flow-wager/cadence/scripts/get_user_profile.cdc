import FlowWager from "FlowWager"

access(all) fun main(address: Address): FlowWager.UserProfile? {
    return FlowWager.getUserProfile(address: address)
}