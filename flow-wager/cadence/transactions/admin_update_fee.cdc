import FlowWager from "FlowWager"

transaction(newFeePercentage: UFix64) {
    let adminRef: &FlowWager.Admin

    prepare(admin: auth(Storage) &Account) {
        self.adminRef = admin.storage.borrow<&FlowWager.Admin>(
            from: /storage/FlowWagerAdmin
        ) ?? panic("Admin resource not found")
    }
    
    execute {
        self.adminRef.updatePlatformFee(newFeePercentage: newFeePercentage)
        log("Platform fee updated successfully!")
        log("New fee percentage: ".concat(newFeePercentage.toString()))
    }
}