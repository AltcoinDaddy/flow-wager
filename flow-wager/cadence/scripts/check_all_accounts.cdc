import FlowWager from "FlowWager"

access(all) fun main(): {Address: Bool} {
    let testAddresses: [Address] = [
        0xf8d6e0586b0a20c7,  // admin/deployer
        0x179b6b1cb6755e31,  // emulator-test
        0x01cf0e2f2f715450,  // emulator-account (if exists)
        0x120e725050340cab,  // another common emulator account
        0xf3fcd2c1a78f5eee   // ik account
    ]
    
    let results: {Address: Bool} = {}
    
    for address in testAddresses {
        let userProfile = FlowWager.getUserProfile(address: address)
        results[address] = userProfile != nil
    }
    
    return results
}