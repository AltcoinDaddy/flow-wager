
export const buySharesTransaction = (
  marketId: number, 
  isOptionA: boolean, 
  amount: number
) => {
  // This would use @onflow/fcl in a real implementation
  return {
    cadence: `
      import FlowWager from 0xFLOWWAGER_ADDRESS
      import FungibleToken from 0xFUNGIBLE_TOKEN_ADDRESS
      import FlowToken from 0xFLOW_TOKEN_ADDRESS
      
      transaction(marketId: UInt64, isOptionA: Bool, amount: UFix64) {
        let signerVault: &FlowToken.Vault
        
        prepare(signer: AuthAccount) {
          self.signerVault = signer.borrow<&FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Could not borrow FlowToken.Vault reference")
        }
        
        execute {
          let vault <- self.signerVault.withdraw(amount: amount)
          FlowWager.buyShares(
            marketId: marketId,
            isOptionA: isOptionA,
            vault: <-vault
          )
        }
      }
    `,
    args: [
      { value: marketId, type: 'UInt64' },
      { value: isOptionA, type: 'Bool' },
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
      import FlowWager from 0xFLOWWAGER_ADDRESS
      
      transaction(
        question: String,
        optionA: String,
        optionB: String,
        category: UInt8,
        imageURI: String,
        duration: UFix64,
        isBreakingNews: Bool
      ) {
        let adminRef: &FlowWager.Admin
        
        prepare(signer: AuthAccount) {
          self.adminRef = signer.borrow<&FlowWager.Admin>(from: FlowWager.AdminStoragePath)
            ?? panic("Could not borrow Admin reference")
        }
        
        execute {
          let categoryEnum = FlowWager.MarketCategory(rawValue: category)!
          let marketId = self.adminRef.createMarket(
            question: question,
            optionA: optionA,
            optionB: optionB,
            category: categoryEnum,
            imageURI: imageURI,
            duration: duration,
            isBreakingNews: isBreakingNews
          )
          
          log("Market created with ID: ".concat(marketId.toString()))
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
