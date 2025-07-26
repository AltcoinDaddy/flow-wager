import FlowWager from "FlowWager" // or use import address alias

transaction(username: String, displayName: String) {

    prepare(signer: &Account) {

        // But this pattern is overkill if createUserAccount is a public function;
        // Instead, you should call:
        FlowWager.createUserAccount(
            userAddress: signer.address,
            username: username,
            displayName: displayName,
        )
    }

    execute {
        log("User account created successfully!")
    }
}