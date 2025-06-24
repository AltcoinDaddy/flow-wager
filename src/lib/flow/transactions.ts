export const buySharesTransaction = (
  marketId: number, 
  isOptionA: boolean, 
  amount: number
) => {
  // This would use @onflow/fcl in a real implementation
  return {
    cadence: `
      import FlowWager from 0xFlowWager
      import FlowToken from 0x1654653399040a61
      import FungibleToken from 0xf233dcee88fe0abe

      transaction(marketId: UInt64, option: UInt8, amount: UFix64) {
        let flowVault: &FlowToken.Vault
        
        prepare(signer: AuthAccount) {
          // Get reference to signer's FlowToken vault
          self.flowVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow FlowToken vault reference")
        }
        
        execute {
          // Call the contract function to buy shares
          FlowWager.buyShares(marketId: marketId, option: option, amount: amount)
        }
      }
    `,
    args: [
      { value: marketId, type: 'UInt64' },
      { value: isOptionA ? 1 : 2, type: 'UInt8' },
      { value: amount.toFixed(8), type: 'UFix64' }
    ],
    limit: 100
  };
};

export const createMarketTransaction = (
  question: string,
  optionA: string,
  optionB: string,
  category: string,
  imageURI: string,
  duration: number,
  isBreakingNews: boolean
) => {
  return {
    cadence: `
      import FlowWager from 0xFlowWager

      transaction(
        title: String,
        description: String,
        category: UInt8,
        optionA: String,
        optionB: String,
        endTime: UFix64,
        minBet: UFix64,
        maxBet: UFix64
      ) {
        let adminRef: &FlowWager.Admin
        
        prepare(signer: AuthAccount) {
          // Get reference to Admin resource
          self.adminRef = signer.borrow<&FlowWager.Admin>(from: /storage/FlowWagerAdmin)
            ?? panic("Could not borrow Admin reference")
        }
        
        execute {
          let marketId = self.adminRef.createMarket(
            title: title,
            description: description,
            category: FlowWager.MarketCategory(rawValue: category)!,
            optionA: optionA,
            optionB: optionB,
            endTime: endTime,
            minBet: minBet,
            maxBet: maxBet
          )
        }
      }
    `,
    args: [
      { value: question, type: 'String' },
      { value: optionA, type: 'String' },
      { value: optionB, type: 'String' },
      { value: 0, type: 'UInt8' }, // Category enum value
      { value: imageURI, type: 'String' },
      { value: (duration * 3600.0).toFixed(1), type: 'UFix64' }, // Convert hours to seconds
      { value: isBreakingNews, type: 'Bool' }
    ],
    limit: 150
  };
};

export const resolveMarketTransaction = (marketId: number, outcome: string) => {
  const outcomeValue = outcome === 'OPTION_A' ? 1 : 2;
  
  return {
    cadence: `
      import FlowWager from 0xFLOWWAGER_ADDRESS
      
      transaction(marketId: UInt64, outcome: UInt8) {
        let adminRef: &FlowWager.Admin
        
        prepare(signer: AuthAccount) {
          self.adminRef = signer.borrow<&FlowWager.Admin>(from: FlowWager.AdminStoragePath)
            ?? panic("Could not borrow Admin reference")
        }
        
        execute {
          let outcomeEnum = FlowWager.MarketOutcome(rawValue: outcome)!
          self.adminRef.resolveMarket(marketId: marketId, outcome: outcomeEnum)
          
          log("Market resolved with outcome: ".concat(outcome.toString()))
        }
      }
    `,
    args: [
      { value: marketId, type: 'UInt64' },
      { value: outcomeValue, type: 'UInt8' }
    ],
    limit: 100
  };
};

export const claimWinningsTransaction = (marketId: number) => {
  return {
    cadence: `
      import FlowWager from 0xFLOWWAGER_ADDRESS
      import FungibleToken from 0xFUNGIBLE_TOKEN_ADDRESS
      import FlowToken from 0xFLOW_TOKEN_ADDRESS
      
      transaction(marketId: UInt64) {
        let signerVault: &FlowToken.Vault
        
        prepare(signer: AuthAccount) {
          self.signerVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow FlowToken.Vault reference")
        }
        
        execute {
          let winningsVault <- FlowWager.claimWinnings(marketId: marketId)
          self.signerVault.deposit(from: <-winningsVault)
          
          log("Winnings claimed for market: ".concat(marketId.toString()))
        }
      }
    `,
    args: [
      { value: marketId, type: 'UInt64' }
    ],
    limit: 100
  };
};
