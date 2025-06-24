export const getMarketScript = (marketId: number) => {
  return {
    cadence: `
      import FlowWager from 0xFLOWWAGER_ADDRESS
      
      pub fun main(marketId: UInt64): FlowWager.Market? {
        return FlowWager.getMarket(marketId: marketId)
      }
    `,
    args: [{ value: marketId, type: "UInt64" }],
  };
};

export const getAllMarketsScript = () => {
  return {
    cadence: `
      import FlowWager from 0xFLOWWAGER_ADDRESS
      
      pub fun main(): [FlowWager.Market] {
        return FlowWager.getAllMarkets()
      }
    `,
    args: [],
  };
};

export const getUserStatsScript = (address: string) => {
  return {
    cadence: `
      import FlowWager from 0xFLOWWAGER_ADDRESS
      
      pub fun main(address: Address): FlowWager.UserStats? {
        return FlowWager.getUserStats(address: address)
      }
    `,
    args: [{ value: address, type: "Address" }],
  };
};

export const getUserPositionsScript = (address: string) => {
  return {
    cadence: `
      import FlowWager from 0xFLOWWAGER_ADDRESS
      
      pub fun main(address: Address): {UInt64: FlowWager.UserPosition} {
        return FlowWager.getUserPositions(address: address)
      }
    `,
    args: [{ value: address, type: "Address" }],
  };
};

export const GET_USER_BALANCE = `
import FungibleToken from ${
  process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_MAINNET_TOKEN || ""
}
import FlowToken from ${process.env.NEXT_PUBLIC_FLOW_MAINNET_TOKEN || ""}

 access(all) fun main(address: Address): UFix64 {
          let account = getAccount(address)
          let vaultRef = account.capabilities.borrow<&FlowToken.Vault>(/public/flowTokenBalance)
            ?? panic("Could not borrow Balance reference to the Vault")
          
          return vaultRef.balance
        }
`;
