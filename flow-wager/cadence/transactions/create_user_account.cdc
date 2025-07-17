import "FlowWager"
transaction(username: String, displayName: String) {
    prepare(signer: auth(Storage) &Account) {}
    
    execute {
        FlowWager.createUserAccount(username: username, displayName: displayName)
        log("User account created successfully!")
        log("Username: ".concat(username))
        log("Display Name: ".concat(displayName))
    }
}