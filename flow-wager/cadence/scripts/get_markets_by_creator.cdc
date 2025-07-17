import FlowWager from "FlowWager"

access(all) fun main(creator: Address): [FlowWager.Market] {
    return FlowWager.getMarketsByCreator(creator: creator)
}