import "FlowWager"

access(all) fun main(address: Address): &{FlowWager.UserProfilePublic}? {
    return FlowWager.getUserProfile(address: address)
}