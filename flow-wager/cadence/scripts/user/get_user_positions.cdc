import FlowWagerV2 from "FlowWagerV2"

// This script reads all positions for a given user address.
access(all) fun main(userAddress: Address): {UInt64: FlowWagerV2.UserPosition}? {
    let account = getAccount(userAddress)

    // Borrow the public capability for UserPositions
    let positionsCap = account.capabilities.borrow<&{FlowWagerV2.UserPositionsPublic}>(
        FlowWagerV2.UserPositionsPublicPath
    )

    if positionsCap == nil {
        log("Could not borrow UserPositionsPublic capability for this address.")
        return nil
    }

    return positionsCap!.getAllPositions()
}
