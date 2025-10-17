import FlowUpdate from "FlowUpdate"

// Admin transaction to pause or unpause the FlowUpdate contract
transaction(shouldPause: Bool) {

    let adminRef: &FlowUpdate.Admin

    prepare(signer: auth(Storage) &Account) {
        // Get reference to the Admin resource
        self.adminRef = signer.storage.borrow<&FlowUpdate.Admin>(from: FlowUpdate.AdminStoragePath)
            ?? panic("Could not borrow Admin resource. Only admin can pause/unpause the contract!")
    }

    execute {
        if shouldPause {
            // Pause the contract
            self.adminRef.pauseContract()
            log("FlowUpdate contract has been paused")
        } else {
            // Unpause the contract
            self.adminRef.unpauseContract()
            log("FlowUpdate contract has been unpaused")
        }

        log("Contract pause status updated to: ".concat(shouldPause ? "true" : "false"))
    }


}
