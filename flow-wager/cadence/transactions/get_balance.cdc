import FlowToken from "FlowToken"
import FungibleToken from "FungibleToken"

access(all) fun main(address: Address): UFix64 {
    let account = getAccount(address)

    // Borrow the capability restricted to ONLY the FungibleToken.Balance interface
    let vaultRef = account.capabilities.borrow<&{FungibleToken.Balance}>(/public/flowTokenBalance)
        ?? panic("Could not borrow Balance reference to the Vault at /public/flowTokenBalance. Ensure the capability is published and accessible.")

    // Access the balance field available through the interface
    return vaultRef.balance
}
