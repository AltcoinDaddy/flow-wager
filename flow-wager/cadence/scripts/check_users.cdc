import FlowWager from "FlowWager"

access(all) fun main(address: Address): Bool {
    let userProfile = FlowWager.getUserProfile(address: address)
    return userProfile != nil
}