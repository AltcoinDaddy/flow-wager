import "FlowWager"
import "FungibleToken"
import "FlowToken"

    transaction(marketId: UInt64, option: UInt8, betAmount: UFix64) {
        let betVault: @FlowToken.Vault
        let userPositionsCap: Capability<&FlowWager.UserPositions>
        let signerAddress: Address

        prepare(signer: auth(Storage, Capabilities, BorrowValue) &Account) {
            self.signerAddress = signer.address
            // Borrow FlowToken vault
            let vault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow FlowToken vault")
            
            // Withdraw the bet amount
            self.betVault <- vault.withdraw(amount: betAmount) as! @FlowToken.Vault

            // Initialize UserPositions if not present
            if !signer.storage.check<@FlowWager.UserPositions>(from: FlowWager.UserPositionsStoragePath) {
                let userPositions <- FlowWager.createUserPositions()
                signer.storage.save(<-userPositions, to: FlowWager.UserPositionsStoragePath)
                signer.capabilities.publish(
                    signer.capabilities.storage.issue<&{FlowWager.UserPositionsPublic}>(FlowWager.UserPositionsStoragePath),
                    at: FlowWager.UserPositionsPublicPath
                )
            }

            // Get UserPositions capability from storage path
            let storageCap = signer.capabilities.storage.issue<&FlowWager.UserPositions>(FlowWager.UserPositionsStoragePath)
            self.userPositionsCap = storageCap
            
            // Verify UserPositions exists and check position limit
            let userPositionsRef = signer.storage.borrow<&FlowWager.UserPositions>(
                from: FlowWager.UserPositionsStoragePath
            ) ?? panic("User positions resource not found for account")
            
            if !userPositionsRef.positions.containsKey(marketId) {
                assert(
                    UInt64(userPositionsRef.positions.length) < FlowWager.maxPositionsPerUser,
                    message: "User has reached the maximum number of distinct market positions"
                )
            }
        }

        execute {
            // Create new position
            let newPosition = FlowWager.UserPosition(
                marketId: marketId,
                optionAShares: option == FlowWager.MarketOutcome.OptionA.rawValue ? betAmount : 0.0,
                optionBShares: option == FlowWager.MarketOutcome.OptionB.rawValue ? betAmount : 0.0,
                totalInvested: betAmount,
                claimed: false
            )

            // Call placeBet with capability and position
            FlowWager.placeBet(
                userAddress: self.signerAddress,
                marketId: marketId,
                option: option,
                betVault: <-self.betVault,
                userPositionsCap: self.userPositionsCap,
                newPosition: newPosition
            )

            log("Bet placed successfully on market ".concat(marketId.toString()))
            log("Bet amount: ".concat(betAmount.toString()).concat(" FLOW"))
            log("Option selected: ".concat(option.toString()))
        }
    }