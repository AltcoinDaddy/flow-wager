import FlowUpdate from "FlowUpdate"
import FlowToken from "FlowToken"

// Transaction to set up a user account for FlowUpdate
// Creates and stores the MultiOptionPositions resource
transaction() {

    prepare(signer: auth(Storage, Capabilities) &Account) {
        // Check if the account already has a MultiOptionPositions resource
        if signer.storage.borrow<&FlowUpdate.MultiOptionPositions>(from: FlowUpdate.MultiOptionPositionsStoragePath) == nil {
            // Create a new MultiOptionPositions resource
            let positions <- FlowUpdate.createMultiOptionPositions()

            // Save it to storage
            signer.storage.save(<-positions, to: FlowUpdate.MultiOptionPositionsStoragePath)

            // Create a public capability for it
            let positionsCapability = signer.capabilities.storage.issue<&FlowUpdate.MultiOptionPositions>(FlowUpdate.MultiOptionPositionsStoragePath)
            signer.capabilities.publish(positionsCapability, at: FlowUpdate.MultiOptionPositionsPublicPath)

            log("FlowUpdate MultiOptionPositions resource created and linked")
        } else {
            log("Account already has MultiOptionPositions resource")
        }
    }

    execute {
        log("FlowUpdate account setup completed")
    }
}
