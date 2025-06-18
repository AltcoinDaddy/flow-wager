export const getMarketScript = (marketId: number) => {
  return {
    cadence: `
      import FlowWager from 0xFLOWWAGER_ADDRESS
      
      pub fun main(marketId: UInt64): FlowWager.Market? {
        return FlowWager.getMarket(marketId: marketId)
      }
    `,
    args: [
      { value: marketId, type: 'UInt64' }
    ]
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
    args: []
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
    args: [
      { value: address, type: 'Address' }
    ]
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
    args: [
      { value: address, type: 'Address' }
    ]
  };
};
