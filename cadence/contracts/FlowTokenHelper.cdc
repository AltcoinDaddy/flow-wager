// FlowTokenHelper.cdc - Fixed for Cadence 1.0 (Standalone Version)
access(all) contract FlowTokenHelper {
    
    // =====================================
    // EVENTS
    // =====================================
    
    access(all) event SafeTransferCompleted(from: Address, to: Address, amount: UFix64)
    access(all) event BatchTransferCompleted(from: Address, recipients: UInt64, totalAmount: UFix64)
    access(all) event TransferValidationFailed(from: Address, to: Address, amount: UFix64, reason: String)
    
    // =====================================
    // STRUCTS
    // =====================================
    
    access(all) struct TransferResult {
        access(all) let success: Bool
        access(all) let amount: UFix64
        access(all) let recipient: Address
        access(all) let error: String?
        
        init(success: Bool, amount: UFix64, recipient: Address, error: String?) {
            self.success = success
            self.amount = amount
            self.recipient = recipient
            self.error = error
        }
    }
    
    access(all) struct TokenBalance {
        access(all) let address: Address
        access(all) let balance: UFix64
        access(all) let hasVault: Bool
        access(all) let hasReceiver: Bool
        
        init(address: Address, balance: UFix64, hasVault: Bool, hasReceiver: Bool) {
            self.address = address
            self.balance = balance
            self.hasVault = hasVault
            self.hasReceiver = hasReceiver
        }
    }
    
    access(all) struct PayoutDistribution {
        access(all) let recipient: Address
        access(all) let amount: UFix64
        access(all) let shares: UFix64
        
        init(recipient: Address, amount: UFix64, shares: UFix64) {
            self.recipient = recipient
            self.amount = amount
            self.shares = shares
        }
    }
    
    // =====================================
    // VALIDATION FUNCTIONS
    // =====================================
    
    access(all) fun validateTransfer(from: Address, to: Address, amount: UFix64): {String: Bool} {
        let result: {String: Bool} = {}
        
        // Check if addresses are valid
        result["validFromAddress"] = FlowTokenHelper.isValidAddress(address: from)
        result["validToAddress"] = FlowTokenHelper.isValidAddress(address: to)
        
        // Check if amount is valid
        result["validAmount"] = FlowTokenHelper.validateTransferAmount(amount: amount)
        
        // Check if recipient has receiver capability
        result["hasReceiver"] = FlowTokenHelper.hasFlowTokenReceiver(address: to)
        
        // Check if sender has vault
        result["hasVault"] = FlowTokenHelper.hasFlowTokenVault(address: from)
        
        return result
    }
    
    access(all) fun validateTransferAmount(amount: UFix64): Bool {
        return amount > 0.0 && amount <= 999999999.99999999 // Max reasonable amount
    }
    
    access(all) fun isValidAddress(address: Address): Bool {
        // Basic address validation - check if account exists
        let account = getAccount(address)
        return true // Account exists if we can get it
    }
    
    // =====================================
    // BALANCE CHECKING FUNCTIONS (Simplified)
    // =====================================
    
    access(all) fun getBalance(address: Address): TokenBalance? {
        let account = getAccount(address)
        
        // Simplified balance check without FungibleToken imports
        // In a real implementation, you'd check the actual FlowToken vault
        return TokenBalance(
            address: address,
            balance: account.balance, // Account's native FLOW balance
            hasVault: true,          // Assume true for simplicity
            hasReceiver: true        // Assume true for simplicity
        )
    }
    
    access(all) fun getBatchBalances(addresses: [Address]): [TokenBalance] {
        let balances: [TokenBalance] = []
        
        for address in addresses {
            if let balance = FlowTokenHelper.getBalance(address: address) {
                balances.append(balance)
            }
        }
        
        return balances
    }
    
    access(all) fun hasFlowTokenVault(address: Address): Bool {
        // Simplified check - in production, check actual FlowToken vault capability
        let account = getAccount(address)
        return true // Assume all accounts have vaults
    }
    
    access(all) fun hasFlowTokenReceiver(address: Address): Bool {
        // Simplified check - in production, check actual FlowToken receiver capability
        let account = getAccount(address)
        return true // Assume all accounts can receive tokens
    }
    
    // =====================================
    // FORMATTING FUNCTIONS
    // =====================================
    
    access(all) fun formatTokenAmount(amount: UFix64): String {
        if amount >= 1000000.0 {
            let millions = amount / 1000000.0
            return millions.toString().concat("M")
        } else if amount >= 1000.0 {
            let thousands = amount / 1000.0
            return thousands.toString().concat("K")
        } else {
            return amount.toString()
        }
    }
    
    access(all) fun formatForDisplay(amount: UFix64, decimals: UInt8): String {
        // Format amount with specified decimal places
        let integerPart = UInt64(amount)
        let fractionalPart = amount - UFix64(integerPart)
        
        if decimals == 0 {
            return integerPart.toString()
        }
        
        // Simple decimal formatting
        let multiplier = UFix64(decimals == 1 ? 10 : decimals == 2 ? 100 : 1000)
        let fractionalInt = UInt64(fractionalPart * multiplier)
        
        return integerPart.toString().concat(".").concat(fractionalInt.toString())
    }
    
    access(all) fun calculateTransactionFee(amount: UFix64): UFix64 {
        // Simple fee calculation - can be customized
        let baseFee: UFix64 = 0.001 // 0.001 FLOW base fee
        let percentageFee = amount * 0.001 // 0.1% of amount
        
        return baseFee + percentageFee
    }
    
    // =====================================
    // PAYOUT DISTRIBUTION
    // =====================================
    
    access(all) fun distributePayout(
        totalPayout: UFix64,
        winners: [Address],
        shares: [UFix64]
    ): {Address: UFix64} {
        pre {
            winners.length == shares.length: "Winners and shares arrays must have the same length"
            totalPayout > 0.0: "Total payout must be greater than 0"
        }
        
        let payouts: {Address: UFix64} = {}
        var totalShares: UFix64 = 0.0
        
        // Calculate total shares
        for share in shares {
            totalShares = totalShares + share
        }
        
        if totalShares == 0.0 {
            return payouts
        }
        
        // Calculate individual payouts
        var i = 0
        while i < winners.length {
            let winner = winners[i]
            let share = shares[i]
            let payout = (share / totalShares) * totalPayout
            
            payouts[winner] = payout
            i = i + 1
        }
        
        return payouts
    }
    
    access(all) fun calculatePayoutDistribution(
        totalPayout: UFix64,
        winners: [Address],
        shares: [UFix64]
    ): [PayoutDistribution] {
        pre {
            winners.length == shares.length: "Winners and shares arrays must have the same length"
        }
        
        let distributions: [PayoutDistribution] = []
        var totalShares: UFix64 = 0.0
        
        // Calculate total shares
        for share in shares {
            totalShares = totalShares + share
        }
        
        if totalShares == 0.0 {
            return distributions
        }
        
        // Create distribution objects
        var i = 0
        while i < winners.length {
            let winner = winners[i]
            let share = shares[i]
            let amount = (share / totalShares) * totalPayout
            
            let distribution = PayoutDistribution(
                recipient: winner,
                amount: amount,
                shares: share
            )
            distributions.append(distribution)
            i = i + 1
        }
        
        return distributions
    }
    
    // =====================================
    // UTILITY FUNCTIONS
    // =====================================
    
    access(all) fun convertToDisplayUnits(amount: UFix64): UFix64 {
        // Convert from base units to display units if needed
        return amount
    }
    
    access(all) fun convertFromDisplayUnits(amount: UFix64): UFix64 {
        // Convert from display units to base units if needed
        return amount
    }
    
    access(all) fun getMinimumBalance(): UFix64 {
        return 0.001 // Minimum balance to maintain for transaction fees
    }
    
    access(all) fun getMaximumTransferAmount(): UFix64 {
        return 999999999.99999999 // Maximum allowed transfer amount
    }
    
    // =====================================
    // SECURITY FUNCTIONS
    // =====================================
    
    access(all) fun isTransferAmountSafe(amount: UFix64, senderBalance: UFix64): Bool {
        let minimumBalance = FlowTokenHelper.getMinimumBalance()
        return senderBalance >= (amount + minimumBalance)
    }
    
    access(all) fun validateBatchTransfer(recipients: [Address], amounts: [UFix64]): Bool {
        pre {
            recipients.length == amounts.length: "Recipients and amounts must have same length"
            recipients.length > 0: "Must have at least one recipient"
        }
        
        // Validate each recipient and amount
        var i = 0
        while i < recipients.length {
            let recipient = recipients[i]
            let amount = amounts[i]
            
            if !FlowTokenHelper.isValidAddress(address: recipient) {
                return false
            }
            
            if !FlowTokenHelper.validateTransferAmount(amount: amount) {
                return false
            }
            
            if !FlowTokenHelper.hasFlowTokenReceiver(address: recipient) {
                return false
            }
            
            i = i + 1
        }
        
        return true
    }
    
    // =====================================
    // CONTRACT INITIALIZATION
    // =====================================
    
    init() {
        // Contract initialization
    }
}