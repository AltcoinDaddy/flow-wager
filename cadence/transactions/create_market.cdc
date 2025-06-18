// cadence/transactions/create_market.cdc
// Transaction to create a new prediction market (Admin only)

import FlowWager from "FlowWager"

transaction(
    question: String,
    optionA: String,
    optionB: String,
    category: UInt8,
    imageURI: String,
    duration: UFix64,
    isBreakingNews: Bool,
    minBet: UFix64,
    maxBet: UFix64
) {
    
    let adminRef: &FlowWager.Admin
    
    prepare(signer: AuthAccount) {
        // Get reference to the Admin resource
        self.adminRef = signer.borrow<&FlowWager.Admin>(from: FlowWager.AdminStoragePath)
            ?? panic("Could not borrow Admin reference. Only admins can create markets.")
    }
    
    pre {
        question.length > 0: "Question cannot be empty"
        question.length <= 500: "Question too long (max 500 characters)"
        optionA.length > 0: "Option A cannot be empty"
        optionA.length <= 100: "Option A too long (max 100 characters)"
        optionB.length > 0: "Option B cannot be empty"
        optionB.length <= 100: "Option B too long (max 100 characters)"
        optionA != optionB: "Options must be different"
        category <= 8: "Invalid category"
        duration > 0.0: "Duration must be positive"
        duration >= 3600.0: "Minimum duration is 1 hour"
        duration <= 2592000.0: "Maximum duration is 30 days"
        minBet > 0.0: "Minimum bet must be positive"
        minBet >= 0.1: "Minimum bet cannot be less than 0.1 FLOW"
        maxBet >= minBet: "Maximum bet must be >= minimum bet"
        maxBet <= 10000.0: "Maximum bet cannot exceed 10,000 FLOW"
        imageURI.length > 0: "Image URI cannot be empty"
    }
    
    execute {
        // Convert category UInt8 to MarketCategory enum
        let categoryEnum = FlowWager.MarketCategory(rawValue: category)
            ?? panic("Invalid category value")
        
        // Create the market
        let marketId = self.adminRef.createMarket(
            question: question,
            optionA: optionA,
            optionB: optionB,
            category: categoryEnum,
            imageURI: imageURI,
            duration: duration,
            isBreakingNews: isBreakingNews,
            minBet: minBet,
            maxBet: maxBet
        )
        
        log("Market created successfully with ID: ".concat(marketId.toString()))
        log("Question: ".concat(question))
        log("Duration: ".concat(duration.toString()).concat(" seconds"))
        log("Breaking News: ".concat(isBreakingNews.toString()))
    }
    
    post {
        // Verify the market was created
        let marketId = FlowWager.getAllMarkets().length
        let market = FlowWager.getMarket(marketId: UInt64(marketId))
        assert(market != nil, message: "Market was not created successfully")
    }
}