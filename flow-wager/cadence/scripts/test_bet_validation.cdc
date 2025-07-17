import FlowWager from "FlowWager"
import FlowToken from "FlowToken"

access(all) fun main(
    userAddress: Address,
    marketId: UInt64,
    option: UInt8,
    betAmount: UFix64
): {String: AnyStruct} {

    let market = FlowWager.getMarket(marketId: marketId)
    if market == nil {
        return {"error": "Market not found"}
    }
    
    let m = market!
    let currentTime = getCurrentBlock().timestamp
    
    // Validation checks
    if m.status != FlowWager.MarketStatus.Active {
        return {"error": "Market is not active", "status": m.status.rawValue}
    }
    
    if currentTime >= m.endTime {
        return {"error": "Market has ended", "currentTime": currentTime, "endTime": m.endTime}
    }
    
    if option != 0 && option != 1 {
        return {"error": "Option must be 0 (A) or 1 (B)"}
    }
    
    if betAmount < m.minBet {
        return {"error": "Bet below minimum", "betAmount": betAmount, "minBet": m.minBet}
    }
    
    if betAmount > m.maxBet {
        return {"error": "Bet exceeds maximum", "betAmount": betAmount, "maxBet": m.maxBet}
    }
    
    // Get user's Flow balance
    let userAccount = getAccount(userAddress)
    let flowVaultRef = userAccount.capabilities.get<&FlowToken.Vault>(/public/flowTokenBalance).borrow()
    var userBalance: UFix64 = 0.0
    if flowVaultRef != nil {
        userBalance = flowVaultRef!.balance
    }
    
    if userBalance < betAmount {
        return {"error": "Insufficient Flow balance", "userBalance": userBalance, "requiredAmount": betAmount}
    }
    
    return {
        "status": "valid",
        "market": {"id": m.id, "title": m.title, "optionA": m.optionA, "optionB": m.optionB},
        "bet": {"option": option == 0 ? "A" : "B", "amount": betAmount},
        "userBalance": userBalance
    }
}