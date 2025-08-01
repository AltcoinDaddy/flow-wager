import FlowWager from "FlowWager"

/// Script to fetch resolution evidence for a specific market with additional context
/// @param marketId: The ID of the market to get evidence for
/// @return AnyStruct: A structured response with evidence and market info
access(all) fun main(marketId: UInt64): AnyStruct {
    // First check if the market exists
    let market = FlowWager.getMarketById(marketId: marketId)
    if market == nil {
        return {
            "success": false,
            "error": "Market with ID ".concat(marketId.toString()).concat(" does not exist"),
            "evidence": nil,
            "marketInfo": nil
        }
    }
    
    // Get the resolution evidence
    let evidence = FlowWager.getResolutionEvidence(marketId: marketId)
    
    return {
        "success": true,
        "error": nil,
        "evidence": evidence,
        "marketInfo": {
            "id": market!.id,
            "title": market!.title,
            "status": market!.status,
            "resolved": market!.resolved,
            "endTime": market!.endTime,
            "creator": market!.creator
        }
    }
}