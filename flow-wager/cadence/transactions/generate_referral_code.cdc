import FlowWager from "FlowWager"

transaction() {
    prepare(signer: auth(Storage) &Account) {}
    
    execute {
        let code = FlowWager.generateReferralCode()
        
        log("Referral code generated successfully!")
        log("Code: ".concat(code))
    }
}