export const getFlowWagerAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT || "0x512a5459cb3a2b20"
    : process.env.NEXT_PUBLIC_FLOWWAGER_TESTNET_CONTRACT ||
        "0x512a5459cb3a2b20";
};

export const getFlowTokenAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOW_MAINNET_TOKEN || "0x1654653399040a61"
    : process.env.NEXT_PUBLIC_FLOW_TESTNET_TOKEN || "0x7e60df042a9c0868";
};

export const getFlowUpdateAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOWUPDATE_ADDRESS || "0x24225e374dfffb2b"
    : process.env.NEXT_PUBLIC_FLOWUPDATE_ADDRESS || "0x24225e374dfffb2b";
};

export const getFungibleTokenAddress = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_MAINNET_TOKEN ||
        "0xf233dcee88fe0abe"
    : process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_TESTNET_TOKEN ||
        "0x9a0766d93b6608b7";
};

export const getFlowWagerV2Address = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
  return network === "mainnet"
    ? process.env.NEXT_PUBLIC_FLOWWAGER_V2_CONTRACT_ADDRESS ||
        "0x27fc2c971e60cf00"
    : process.env.NEXT_PUBLIC_FLOWWAGER_V2_CONTRACT_ADDRESS ||
        "0x27fc2c971e60cf00";
};

const sumHelper = `
  access(all) fun sum(numbers: [UFix64]): UFix64 {
    var total: UFix64 = 0.0
    for num in numbers {
        total = total + num
    }
    return total
  }
`;

// // --- ADDRESS HELPER FUNCTIONS ---
// // (Ensure these point to the correct V2 contract addresses in your .env)

// export const getFlowTokenAddress = () => {
//   const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
//   return network === "mainnet"
//     ? process.env.NEXT_PUBLIC_FLOW_MAINNET_TOKEN || "0x1654653399040a61" // Example Mainnet
//     : process.env.NEXT_PUBLIC_FLOW_TESTNET_TOKEN || "0x7e60df042a9c0868"; // Example Testnet
// };

// export const getFungibleTokenAddress = () => {
//   const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
//   return network === "mainnet"
//     ? process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_MAINNET_TOKEN ||
//         "0xf233dcee88fe0abe" // Example Mainnet
//     : process.env.NEXT_PUBLIC_FLOW_FUNGIBLE_TESTNET_TOKEN ||
//         "0x9a0766d93b6608b7"; // Example Testnet
// };

// export const getFlowWagerV2Address = () => {
//   const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";
//   // IMPORTANT: Use V2-specific environment variables if you have them
//   return network === "mainnet"
//     ? process.env.NEXT_PUBLIC_FLOWWAGER_V2_MAINNET_CONTRACT // Replace if needed
//     : process.env.NEXT_PUBLIC_FLOWWAGER_V2_TESTNET_CONTRACT || // Replace if needed
//         "0x512a5459cb3a2b20"; // <-- REPLACE WITH YOUR ACTUAL DEPLOYED V2 ADDRESS
// };

// // --- CADENCE HELPER FUNCTIONS ---
// const sumHelper = `
//   access(all) fun sum(numbers: [UFix64]): UFix64 {
//     var total: UFix64 = 0.0
//     for num in numbers {
//         total = total + num
//     }
//     return total
//   }
// `;

// --- V2 CADENCE SCRIPTS OBJECT ---

const CADENCE_SCRIPTS = {
  // --- QUERIES (Scripts) ---

  getAllMarkets: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    access(all) fun main(): [FlowWagerV2.Market] {
        return FlowWagerV2.getAllMarkets()
    }
  `,

  getActiveMarkets: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    access(all) fun main(): [FlowWagerV2.Market] {
        let allMarkets = FlowWagerV2.getAllMarkets()
        var activeMarkets: [FlowWagerV2.Market] = []
        let currentTime = getCurrentBlock().timestamp
        for market in allMarkets {
            // Active status and end time in the future
            if market.status == FlowWagerV2.MarketStatus.Active && market.endTime > currentTime {
                activeMarkets.append(market)
            }
        }
        return activeMarkets
    }
  `,

  getMarketById: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    access(all) fun main(marketId: UInt64): FlowWagerV2.Market? {
        // Use the contract's public getter
        return FlowWagerV2.getMarketById(marketId: marketId)
    }
  `,

  getMarketByCreator: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    access(all) fun main(creator: Address): [FlowWagerV2.Market] {
      // Use the contract's public getter
      return FlowWagerV2.getMarketsByCreator(creator: creator)
    }
  `,

  getPlatformStats: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    access(all) fun main(): FlowWagerV2.PlatformStats {
        // Use the contract's public getter
        return FlowWagerV2.getPlatformStats()
    }
  `,

  getUserFlowBalance: `
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    access(all) fun main(address: Address): UFix64 {
        let account = getAccount(address)

        // Borrow the capability restricted to ONLY the FungibleToken.Balance interface
        let vaultRef = account.capabilities.borrow<&{FungibleToken.Balance}>(/public/flowTokenBalance)
            ?? panic("Could not borrow Balance reference to the Vault at /public/flowTokenBalance. Ensure the capability is published and accessible.")

        // Access the balance field available through the interface
        return vaultRef.balance
    }

  `,

  getUserProfile: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    // Borrows the public capability for user profile
    access(all) fun main(address: Address): &{FlowWagerV2.UserProfilePublic}? {
      let account = getAccount(address)
      // Attempt to borrow the capability using the correct public path
      return account.capabilities.borrow<&{FlowWagerV2.UserProfilePublic}>(
          FlowWagerV2.UserProfilePublicPath
      ) // Returns nil if capability doesn't exist or isn't borrowable
    }
  `,

  // Gets *all* user positions by borrowing the public capability
  getUserPositions: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    access(all) fun main(userAddress: Address): {UInt64: FlowWagerV2.UserPosition}? {
        let account = getAccount(userAddress)
        // Borrow the public capability for the UserPositions resource using the correct path
        let positionsCap = account.capabilities.borrow<&{FlowWagerV2.UserPositionsPublic}>(
            FlowWagerV2.UserPositionsPublicPath
        )

        if positionsCap == nil {
            log("UserPositionsPublic capability not found or borrowable for address: ".concat(userAddress.toString()))
            return nil // Return nil if capability doesn't exist or isn't set up
        }

        // Call the public function on the borrowed capability
        return positionsCap!.getAllPositions()
    }
  `,

  getPendingMarkets: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    access(all) fun main(): [FlowWagerV2.Market] {
        let allMarkets = FlowWagerV2.getAllMarkets()
        var pendingMarkets: [FlowWagerV2.Market] = []
        let currentTime = getCurrentBlock().timestamp
        for market in allMarkets {
            // Markets explicitly marked as PendingResolution OR
            // Active markets whose end time has passed but haven't been resolved/cancelled yet
            if market.status == FlowWagerV2.MarketStatus.PendingResolution || (market.status == FlowWagerV2.MarketStatus.Active && market.endTime <= currentTime && !market.resolved) {
                pendingMarkets.append(market)
            }
        }
        return pendingMarkets
    }
  `,

  // Calculates claimable winnings for a user by iterating positions
  getClaimableWinnings: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}
    import FungibleToken from ${getFungibleTokenAddress()} // For type reference

    access(all) fun main(address: Address): [FlowWagerV2.ClaimableWinnings] {
        let acct = getAccount(address)
        // Borrow the public capability to access user's positions
        let positionsCap = acct.capabilities.borrow<&{FlowWagerV2.UserPositionsPublic}>(
            FlowWagerV2.UserPositionsPublicPath
        )

        // If the user doesn't have the resource/capability, they have no winnings
        if positionsCap == nil {
            log("User positions capability not found or borrowable.")
            return []
        }

        let positions = positionsCap!.getAllPositions()
        var winnings: [FlowWagerV2.ClaimableWinnings] = []

        for position in positions.values {
            // Use a helper function that safely attempts the calculation
            let amount = self.safeCalculateWinnings(marketId: position.marketId, userPosition: position)
            // Only add if calculation succeeded and amount is positive
            if amount != nil && amount! > 0.0 {
                winnings.append(FlowWagerV2.ClaimableWinnings(marketId: position.marketId, amount: amount!))
            }
        }
        return winnings
    }

    // Helper function to safely calculate winnings, returning nil on expected errors
    access(self) fun safeCalculateWinnings(marketId: UInt64, userPosition: FlowWagerV2.UserPosition): UFix64? {
        // Basic checks before calling the potentially panicking contract function
        if userPosition.claimed { return nil } // Already claimed

        let market = FlowWagerV2.getMarketById(marketId: marketId)
        // Market must exist, be resolved, and have a winning option defined
        if market == nil || !market!.resolved || market!.winningOption == nil { return nil }
        // User must have bet on the winning option (shares > 0)
        // Accessing optionShares requires index check if array length varies (though fixed in V2)
        let winningIndex = Int(market!.winningOption!)
        if winningIndex >= userPosition.optionShares.length || userPosition.optionShares[winningIndex] == 0.0 { return nil }

        // Attempt the main calculation using the contract's public function within a try-catch equivalent
        var calculatedAmount: UFix64 = 0.0
        var error: String? = nil
        let success = panic( // 'panic' here is used to simulate try-catch behavior in Cadence scripts
             try {
                calculatedAmount = FlowWagerV2.calculateWinnings(marketId: marketId, userPosition: userPosition)
                return true // Indicate success
             } catch e {
                error = e.message // Capture error message if panic occurs
                return false // Indicate failure
             }
        )

        if success {
            return calculatedAmount
        } else {
             // Log unexpected errors, but return nil for expected ones caught by calculateWinnings asserts
             if error != nil
                 && !error!.contains("Market is not resolved")
                 && !error!.contains("No winning option set")
                 && !error!.contains("Winnings already claimed")
                 && !error!.contains("User did not bet on winning option") {
                log("Unexpected error in calculateWinnings for market ".concat(marketId.toString()).concat(": ").concat(error!))
             }
            // Return nil if calculation failed for expected reasons or unexpectedly
            return nil
        }
    }
  `,

  // Checks if user has necessary resources/capabilities set up
  checkUserRegistered: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    access(all) fun main(userAddress: Address): {String: AnyStruct} {
        // 1. Check contract state (userStats exists?)
        // Uses the public getUserStats which returns UserStats? (nil if not found)
        let userStats = FlowWagerV2.getUserStats(user: userAddress)
        let isRegisteredInContract = userStats != nil

        let account = getAccount(userAddress)

        // 2. Check for resource capabilities by attempting to borrow them
        let profileCap = account.capabilities.borrow<&{FlowWagerV2.UserProfilePublic}>(FlowWagerV2.UserProfilePublicPath)
        let hasUserProfile = profileCap != nil

        let positionsCap = account.capabilities.borrow<&{FlowWagerV2.UserPositionsPublic}>(FlowWagerV2.UserPositionsPublicPath)
        let hasUserPositions = positionsCap != nil

        let statsResourceCap = account.capabilities.borrow<&{FlowWagerV2.UserStatsPublic}>(FlowWagerV2.UserStatsPublicPath)
        let hasUserStatsResource = statsResourceCap != nil

        // 3. Get profile details if possible from borrowed capability
        var username: String? = nil
        var displayName: String? = nil
        var joinedAt: UFix64? = nil
        if hasUserProfile {
             // Safely access fields via the borrowed capability reference
             username = profileCap?.getUsername()
             displayName = profileCap?.getDisplayName()
             joinedAt = profileCap?.joinedAt
        }

        // 4. Determine overall registration status
        // User is considered fully set up if registered in contract AND has all necessary resources/capabilities
        let isFullyRegistered = isRegisteredInContract && hasUserProfile && hasUserPositions && hasUserStatsResource

        // 5. Return structured result
        return {
            "address": userAddress,
            "isRegisteredInContract": isRegisteredInContract, // Based on getUserStats
            "hasUserProfile": hasUserProfile,               // Based on capability borrow
            "hasUserPositions": hasUserPositions,           // Based on capability borrow
            "hasUserStatsResource": hasUserStatsResource,     // Based on capability borrow
            "isFullyRegistered": isFullyRegistered,         // Combination check
            "username": username,                         // From profile capability
            "displayName": displayName,                     // From profile capability
            "joinedAt": joinedAt,                         // From profile capability
            "userStats": userStats                        // The actual stats struct (or nil)
        }
    }
  `,

  // Gets detailed position info including calculated value/PnL
  getUserPositionsDetails: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}
    import FungibleToken from ${getFungibleTokenAddress()} // For UFix64 type

    ${sumHelper} // Include helper function definition

    // Structure to hold detailed info for one position
    access(all) struct PositionDetails {
        access(all) let marketId: UInt64
        access(all) let marketTitle: String? // Optional: Included if market fetched
        access(all) let options: [String]? // Optional: Included if market fetched
        access(all) let optionShares: [UFix64]
        access(all) let totalInvested: UFix64
        access(all) let averagePrice: UFix64
        access(all) let claimed: Bool
        access(all) let createdAt: UFix64
        access(all) let status: FlowWagerV2.MarketStatus? // Optional: Included if market fetched
        access(all) let winningOption: UInt8? // Optional: Included if market fetched
        access(all) let currentValue: UFix64 // Calculated
        access(all) let profitLoss: Fix64 // Calculated
        access(all) let claimableAmount: UFix64 // Calculated

        init(
            position: FlowWagerV2.UserPosition,
            marketData: FlowWagerV2.Market? // Pass optional market data fetched by the script
        ) {
            // Assign basic position data
            self.marketId = position.marketId
            self.optionShares = position.optionShares
            self.totalInvested = position.totalInvested
            self.averagePrice = position.averagePrice
            self.claimed = position.claimed
            self.createdAt = position.createdAt

            // Assign optional market data
            self.marketTitle = marketData?.title
            self.options = marketData?.options
            self.status = marketData?.status
            self.winningOption = marketData?.winningOption

            // --- Calculate Derived Values ---
            var cv: UFix64 = 0.0 // Current Value
            var ca: UFix64 = 0.0 // Claimable Amount
            var pl: Fix64 = Fix64(0.0) // Profit/Loss

            // Only perform calculations if market data is available
            if marketData != nil {
                let market = marketData!
                let userTotalShares = sum(numbers: position.optionShares)

                if market.resolved {
                    // Check if user won and hasn't claimed
                    if market.winningOption != nil && !position.claimed {
                        let winIndex = Int(market.winningOption!)
                        // Check if winIndex is valid for the position's shares array
                        if winIndex < position.optionShares.length && position.optionShares[winIndex] > 0.0 {
                            // Safely attempt calculation using helper
                            let calculatedWinnings = FlowWagerV2.safeCalculateWinningsHelper(marketId: market.id, userPosition: position)
                            if calculatedWinnings != nil {
                                cv = calculatedWinnings!
                                ca = calculatedWinnings!
                            }
                        }
                    }
                    // If lost, claimed, or market error, cv and ca remain 0.0
                } else if market.status == FlowWagerV2.MarketStatus.Active {
                    // Use pool share logic for active markets
                    let marketTotalShares = sum(numbers: market.totalShares)
                    if marketTotalShares > 0.0 && userTotalShares > 0.0 {
                        let shareRatio = UFix64(userTotalShares) / UFix64(marketTotalShares)
                        let feePercentage = FlowWagerV2.platformFeePercentage // Access contract state
                        let distributablePool = market.totalPool * (1.0 - (feePercentage / 100.0))
                        cv = distributablePool * shareRatio
                    } else if userTotalShares > 0.0 {
                        // If market pool is empty but user has shares, value is investment
                        cv = position.totalInvested
                    }
                    // Else value is 0 if user has no shares in an active market pool
                }
                // If Pending, Cancelled, or other non-active/non-resolved states, current value defaults to 0.0
            } else {
                // Fallback if market data couldn't be fetched (e.g., market deleted?)
                // Set value to 0 as we can't determine its worth without market state.
                cv = 0.0
                log("Warning: Market data not found for position on market ".concat(position.marketId.toString()))
            }

            self.currentValue = cv
            // Calculate profit/loss AFTER determining currentValue
            pl = Fix64(cv) - Fix64(position.totalInvested)
            self.profitLoss = pl
            self.claimableAmount = ca // Set based on resolved calculation (will be 0 otherwise)
        }
    }

     // Add the safe calculation helper function from getClaimableWinnings script
     // It needs to be marked access(all) if PositionDetails is access(all) and calls it
     access(all) fun safeCalculateWinningsHelper(marketId: UInt64, userPosition: FlowWagerV2.UserPosition): UFix64? {
        if userPosition.claimed { return nil }
        let market = FlowWagerV2.getMarketById(marketId: marketId)
        if market == nil || !market!.resolved || market!.winningOption == nil { return nil }
        let winningIndex = Int(market!.winningOption!)
        if winningIndex >= userPosition.optionShares.length || userPosition.optionShares[winningIndex] == 0.0 { return nil }

        var calculatedAmount: UFix64 = 0.0; var error: String? = nil
        let success = panic( try { calculatedAmount = FlowWagerV2.calculateWinnings(marketId: marketId, userPosition: userPosition); return true } catch e { error = e.message; return false } )
        if success { return calculatedAmount } else { if error != nil { log("safeCalculateWinningsHelper Error: ".concat(error!)) }; return nil }
     }


    access(all) fun main(userAddress: Address): [PositionDetails] {
        let account = getAccount(userAddress)
        // Borrow the public capability for user positions
        let positionsCap = account.capabilities.borrow<&{FlowWagerV2.UserPositionsPublic}>(
            FlowWagerV2.UserPositionsPublicPath
        )
        // Return empty array if user has no positions resource/capability
        if positionsCap == nil {
            log("User positions capability not found for ".concat(userAddress.toString()))
            return []
        }

        let positionsDict = positionsCap!.getAllPositions()
        var positionDetails: [PositionDetails] = []

        // Iterate through the user's positions
        for position in positionsDict.values {
            // Fetch corresponding market data required for calculations
            let market = FlowWagerV2.getMarketById(marketId: position.marketId)
            // Create PositionDetails struct, passing the position and fetched market data (or nil)
            positionDetails.append(PositionDetails(position: position, marketData: market))
        }

        return positionDetails
    }
  `,

  getContractInfo: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    access(all) fun main(): {String: AnyStruct} {
        // Return public state variables as AnyStruct dictionary
        return {
            "deployerAddress": FlowWagerV2.deployerAddress,
            "adminAddress": FlowWagerV2.adminAddress,
            "platformFeePercentage": FlowWagerV2.platformFeePercentage,
            "marketCreationFee": FlowWagerV2.marketCreationFee,
            "paused": FlowWagerV2.paused,
            "nextMarketId": FlowWagerV2.nextMarketId,
            "maxMarkets": FlowWagerV2.maxMarkets,
            "maxPositionsPerUser": FlowWagerV2.maxPositionsPerUser,
            "totalPlatformFees": FlowWagerV2.totalPlatformFees,
            "totalVolumeTraded": FlowWagerV2.totalVolumeTraded
        }
    }
  `,

  getUserDashboardData: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}
    import FungibleToken from ${getFungibleTokenAddress()} // For type reference

    // Structure for the returned dashboard data
    access(all) struct UserDashboard {
        access(all) let profile: &{FlowWagerV2.UserProfilePublic}? // Reference to public profile
        access(all) let stats: FlowWagerV2.UserStats? // The stats struct from contract state
        access(all) let positions: {UInt64: FlowWagerV2.UserPosition} // All user positions
        access(all) let claimableWinnings: [FlowWagerV2.ClaimableWinnings] // Calculated winnings
        access(all) let isRegistered: Bool // Overall registration check
        access(all) let createdMarkets: [FlowWagerV2.Market] // Markets created by user

        init(
            profile: &{FlowWagerV2.UserProfilePublic}?,
            stats: FlowWagerV2.UserStats?,
            positions: {UInt64: FlowWagerV2.UserPosition},
            claimableWinnings: [FlowWagerV2.ClaimableWinnings],
            isRegistered: Bool,
            createdMarkets: [FlowWagerV2.Market]
        ) {
            self.profile = profile
            self.stats = stats
            self.positions = positions
            self.claimableWinnings = claimableWinnings
            self.isRegistered = isRegistered
            self.createdMarkets = createdMarkets
        }
    }

     // Helper function from getClaimableWinnings script - needs access(all) here
     access(all) fun safeCalculateWinnings(marketId: UInt64, userPosition: FlowWagerV2.UserPosition): UFix64? {
        if userPosition.claimed { return nil }
        let market = FlowWagerV2.getMarketById(marketId: marketId)
        if market == nil || !market!.resolved || market!.winningOption == nil { return nil }
        let winningIndex = Int(market!.winningOption!)
        if winningIndex >= userPosition.optionShares.length || userPosition.optionShares[winningIndex] == 0.0 { return nil }

        var calculatedAmount: UFix64 = 0.0; var error: String? = nil
        let success = panic( try { calculatedAmount = FlowWagerV2.calculateWinnings(marketId: marketId, userPosition: userPosition); return true } catch e { error = e.message; return false } )
        if success { return calculatedAmount } else { if error != nil { log("safeCalculateWinnings Error in Dashboard Script: ".concat(error!)) }; return nil }
     }

    access(all) fun main(userAddress: Address): UserDashboard {
        let account = getAccount(userAddress)

        // 1. Get Profile Reference (borrow safely)
        let profile = account.capabilities.borrow<&{FlowWagerV2.UserProfilePublic}>(FlowWagerV2.UserProfilePublicPath)

        // 2. Get Stats from Contract State
        let stats = FlowWagerV2.getUserStats(user: userAddress)

        // 3. Get All Positions (borrow safely)
        var positions: {UInt64: FlowWagerV2.UserPosition} = {}
        let positionsCap = account.capabilities.borrow<&{FlowWagerV2.UserPositionsPublic}>(FlowWagerV2.UserPositionsPublicPath)
        if positionsCap != nil {
            positions = positionsCap!.getAllPositions()
        }

        // 4. Calculate Claimable Winnings (using helper)
        var claimableWinnings: [FlowWagerV2.ClaimableWinnings] = []
        for position in positions.values {
            // Call the helper defined within this script's scope
            let amount = self.safeCalculateWinnings(marketId: position.marketId, userPosition: position)
            if amount != nil && amount! > 0.0 {
                claimableWinnings.append(FlowWagerV2.ClaimableWinnings(marketId: position.marketId, amount: amount!))
            }
        }

        // 5. Check Registration Status (Presence of all key components)
        let isRegistered = profile != nil && stats != nil && positionsCap != nil

        // 6. Get Created Markets
        let createdMarkets = FlowWagerV2.getMarketsByCreator(creator: userAddress)

        // 7. Construct and Return Dashboard Data
        return UserDashboard(
            profile: profile,
            stats: stats,
            positions: positions,
            claimableWinnings: claimableWinnings,
            isRegistered: isRegistered,
            createdMarkets: createdMarkets
        )
    }
  `,

  // --- MUTATIONS (Transactions) ---

  createUserAccount: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}
    import FungibleToken from ${getFungibleTokenAddress()}
    import FlowToken from ${getFlowTokenAddress()}

    transaction(username: String, displayName: String, bio: String, profileImageUrl: String) {
        prepare(signer: auth(BorrowValue, SaveValue, PublishCapability, StorageCapabilities) &Account) {

            // ==========================================
            // STEP 1: Register user in contract
            // ==========================================
            FlowWagerV2.registerUser(
                userAddress: signer.address,
                username: username,
                displayName: displayName,
                bio: bio,
                profileImageUrl: profileImageUrl
            )

            // ==========================================
            // STEP 2: Create and save UserProfile resource
            // ==========================================
            let userProfile <- FlowWagerV2.createUserProfile(
                userAddress: signer.address,
                username: username,
                displayName: displayName,
                bio: bio,
                profileImageUrl: profileImageUrl
            )
            signer.storage.save(<-userProfile, to: FlowWagerV2.UserProfileStoragePath)

            // Create and publish UserProfile public capability
            let userProfileCap = signer.capabilities.storage.issue<&{FlowWagerV2.UserProfilePublic}>(
                FlowWagerV2.UserProfileStoragePath
            )
            signer.capabilities.publish(userProfileCap, at: FlowWagerV2.UserProfilePublicPath)

            // ==========================================
            // STEP 3: Create and save UserPositions resource
            // ==========================================
            let userPositions <- FlowWagerV2.createUserPositions()
            signer.storage.save(<-userPositions, to: FlowWagerV2.UserPositionsStoragePath)

            // Create and publish UserPositions public capability
            let userPositionsCap = signer.capabilities.storage.issue<&{FlowWagerV2.UserPositionsPublic}>(
                FlowWagerV2.UserPositionsStoragePath
            )
            signer.capabilities.publish(userPositionsCap, at: FlowWagerV2.UserPositionsPublicPath)

            // ==========================================
            // STEP 4: Create and save UserStatsResource
            // ==========================================
            let userStats <- FlowWagerV2.createUserStatsResource()
            signer.storage.save(<-userStats, to: FlowWagerV2.UserStatsStoragePath)

            // Create and publish UserStats public capability
            let userStatsCap = signer.capabilities.storage.issue<&{FlowWagerV2.UserStatsPublic}>(
                FlowWagerV2.UserStatsStoragePath
            )
            signer.capabilities.publish(userStatsCap, at: FlowWagerV2.UserStatsPublicPath)

            log("User account setup completed for: ".concat(username))
        }

        execute {
            log("User registration transaction executed successfully")
        }
    }
  `,

  createMarket: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    transaction(
            title: String,
            description: String,
            categoryRaw: UInt8,
            options: [String], // Use options array
            endTime: UFix64,
            minBet: UFix64,
            maxBet: UFix64,
            imageUrl: String
            // 9th argument (creationFeeAmount) removed to match your 8-arg JS call
        ) {
            let feeVault: @FlowToken.Vault?
            let category: FlowWagerV2.MarketCategory
            let signerAddress: Address

            prepare(signer: auth(Storage) &Account) {
                self.category = FlowWagerV2.MarketCategory(rawValue: categoryRaw)
                    ?? panic("Invalid market category raw value: ".concat(categoryRaw.toString()))
                self.signerAddress = signer.address

                let feeAmount = FlowWagerV2.marketCreationFee
                let deployerAddress = FlowWagerV2.deployerAddress

                if self.signerAddress == deployerAddress || feeAmount <= 0.0 {
                    log("No market creation fee required.")
                    self.feeVault <- nil
                } else {
                    log("Preparing market creation fee vault...")
                    let mainVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
                        ?? panic("Could not borrow authorized FlowToken vault from /storage/flowTokenVault.")

                    assert(mainVault.balance >= feeAmount, message: "Insufficient FLOW balance for market creation fee.")
                    self.feeVault <- mainVault.withdraw(amount: feeAmount) as! @FlowToken.Vault
                    log("Fee vault prepared.")
                }
            }

            execute {
                log("Executing V2 market creation...")
                // Call the V2 createMarket function in the contract
                let marketId = FlowWagerV2.createMarket(
                    title: title,
                    description: description,
                    category: self.category,
                    options: options, // Pass the array
                    endTime: endTime,
                    minBet: minBet,
                    maxBet: maxBet,
                    imageUrl: imageUrl,
                    creationFeeVault: <-self.feeVault,
                    address: self.signerAddress
                )
                log("V2 Market created successfully with ID: ".concat(marketId.toString()))
            }
        }
 `,

  placeBet: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    transaction(marketId: UInt64, optionIndex: UInt8, betAmount: UFix64) {

    let bettorAddress: Address
        let paymentVault: @FlowToken.Vault
        let userPositionsRef: &FlowWagerV2.UserPositions

        prepare(signer: auth(Storage) &Account) {
            self.bettorAddress = signer.address



            // 2. Get the user's main FLOW vault

            // --- THIS IS THE FIX ---
            // We must borrow the reference and explicitly authorize it with the 'Withdraw' entitlement
            let mainVault = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("Could not borrow authorized FlowToken vault from /storage/flowTokenVault.")

            // 3. Withdraw the bet amount (this will now work)
            assert(mainVault.balance >= betAmount, message: "Insufficient FLOW balance to place this bet")
            self.paymentVault <- mainVault.withdraw(amount: betAmount) as! @FlowToken.Vault

            // 4. Get the user's UserPositions resource
            // This borrow doesn't need special auth because we're just passing the reference,
            // and the contract will call the public 'addPosition' function.
            self.userPositionsRef = signer.storage.borrow<&FlowWagerV2.UserPositions>(from: FlowWagerV2.UserPositionsStoragePath)
                ?? panic("Could not borrow UserPositions resource. Has the user set up their account?")
        }

        execute {
            // 5. Call the main contract function to purchase the shares
            FlowWagerV2.purchaseShares(
                marketId: marketId,
                optionIndex: optionIndex,
                payment: <-self.paymentVault,
                bettorAddress: self.bettorAddress,
                userPositions: self.userPositionsRef
            )

            log("Bet placed successfully! Market: ".concat(marketId.toString()).concat(", Option: ").concat(optionIndex.toString()).concat(", Amount: ").concat(betAmount.toString()))
        }
    }
  `,

  resolveMarket: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    // Transaction for ADMIN to resolve a V2 market
    transaction(marketId: UInt64, winningOptionIndex: UInt8, justification: String) {
        let adminRef: &FlowWagerV2.Admin

        prepare(signer: auth(Storage) Account) {
            // Borrow the Admin resource from the signer's (admin's) storage
            self.adminRef = signer.storage.borrow<&FlowWagerV2.Admin>(from: FlowWagerV2.AdminStoragePath)
                ?? panic("Could not borrow Admin resource. Signer is not admin or resource path is incorrect: ".concat(FlowWagerV2.AdminStoragePath.toString()))
             log("Admin resource borrowed.")
        }

        execute {
             log("Calling resolveMarket on Admin resource...")
            // Call the resolveMarket function *on the borrowed Admin resource*
            self.adminRef.resolveMarket(
                marketId: marketId,
                winningOptionIndex: winningOptionIndex,
                justification: justification
            )

            log("Admin resolved Market ".concat(marketId.toString()).concat(". Winning Option Index: ").concat(winningOptionIndex.toString()))
        }
    }
  `,

  claimWinnings: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    // Transaction for a user to claim V2 winnings for a specific market
    transaction(marketId: UInt64) {

        let userPositionsRef: &FlowWagerV2.UserPositions
        // Reference to the user's FLOW vault receiver (needs deposit auth)
        let flowReceiverRef: &{FungibleToken.Receiver}

        prepare(signer: auth(Storage) Account) {
            // 1. Borrow the UserPositions resource reference from the signer's storage
            self.userPositionsRef = signer.storage.borrow<&FlowWagerV2.UserPositions>(
                from: FlowWagerV2.UserPositionsStoragePath
            ) ?? panic("Could not borrow UserPositions resource. Account may not be set up.")
             log("UserPositions resource borrowed.")

            // 2. Borrow the Flow token receiver reference with deposit authorization
            self.flowReceiverRef = signer.storage.borrow<auth(FungibleToken.Receiver) &FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("Could not borrow authorized Flow token receiver reference from /storage/flowTokenVault.")
             log("Authorized FlowToken receiver reference borrowed.")
        }

        execute {
             log("Calling FlowWagerV2.claimWinnings for market ID: ".concat(marketId.toString()))
            // 3. Call the contract's V2 claimWinnings function
            let winningsVault <- FlowWagerV2.claimWinnings(
                marketId: marketId,
                claimerAddress: signer.address,
                userPositions: self.userPositionsRef // Pass the direct reference
            )

            let amount = winningsVault.balance
             log("Winnings vault received from contract with balance: ".concat(amount.toString()))

            // 4. Deposit the winnings into the user's vault
            self.flowReceiverRef.deposit(from: <-winningsVault)
             log("Winnings deposited successfully into user's vault.")

            log("Successfully claimed ".concat(amount.toString()).concat(" FLOW from market ").concat(marketId.toString()))
        }
    }
  `,

  submitResolutionEvidence: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    // Transaction for market CREATOR to submit V2 evidence for resolution
    transaction(marketId: UInt64, evidence: String, requestedWinningOption: UInt8) {

        prepare(signer: auth(Storage) Account) { // auth(Storage) likely not needed but harmless
            // Pre-checks (Optional but recommended)
            let market = FlowWagerV2.getMarketById(marketId: marketId)
                ?? panic("Market ".concat(marketId.toString()).concat(" does not exist."))
            assert(market.creator == signer.address, message: "Only the market creator can submit evidence.")
            assert(!market.resolved, message: "Market is already resolved.")
            assert(Int(requestedWinningOption) < market.options.length, message: "Invalid requested winning option index.")
             log("Pre-checks passed for submitting evidence.")
        }

        execute {
             log("Calling FlowWagerV2.submitEvidence...")
            // Call the V2 submitEvidence function in the contract
            FlowWagerV2.submitEvidence(
                marketId: marketId,
                evidence: evidence,
                requestedWinningOption: requestedWinningOption,
                creatorAddress: signer.address
            )

            log("Evidence submitted successfully for market ID: ".concat(marketId.toString()))
        }
    }
  `,

  withdrawPlatformFees: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    // Transaction for ADMIN to withdraw specific amount of fees
    transaction(amount: UFix64) {
        let adminRef: &FlowWagerV2.Admin
        let vaultReceiverRef: &{FungibleToken.Receiver}

        prepare(signer: auth(Storage) Account) {
            self.adminRef = signer.storage.borrow<&FlowWagerV2.Admin>(from: FlowWagerV2.AdminStoragePath)
                ?? panic("Could not borrow Admin resource")
             log("Admin resource borrowed.")

            self.vaultReceiverRef = signer.storage.borrow<auth(FungibleToken.Receiver) &FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("Could not borrow authorized FlowToken Vault Receiver reference")
             log("Vault receiver borrowed.")
        }

        execute {
             log("Calling withdrawPlatformFees on Admin resource...")
            let feesVault <- self.adminRef.withdrawPlatformFees(amount: amount)
            let withdrawnAmount = feesVault.balance
             log("Fees vault received with amount: ".concat(withdrawnAmount.toString()))

            self.vaultReceiverRef.deposit(from: <-feesVault)
             log("Fees deposited to admin vault.")
            log(withdrawnAmount.toString().concat(" platform fees withdrawn successfully"))
        }
    }
  `,

  withdrawAllPlatformFees: `
    import FlowWagerV2 from ${getFlowWagerV2Address()}
    import FlowToken from ${getFlowTokenAddress()}
    import FungibleToken from ${getFungibleTokenAddress()}

    // Transaction for ADMIN to withdraw ALL available platform fees
    transaction {
        let adminRef: &FlowWagerV2.Admin
        let vaultReceiverRef: &{FungibleToken.Receiver}

        prepare(signer: auth(Storage) Account) {
            self.adminRef = signer.storage.borrow<&FlowWagerV2.Admin>(from: FlowWagerV2.AdminStoragePath)
                ?? panic("Could not borrow Admin resource")
             log("Admin resource borrowed.")

            self.vaultReceiverRef = signer.storage.borrow<auth(FungibleToken.Receiver) &FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("Could not borrow authorized FlowToken Vault Receiver reference")
             log("Vault receiver borrowed.")
        }

        execute {
             log("Calling withdrawAllPlatformFees on Admin resource...")
            let feesVault <- self.adminRef.withdrawAllPlatformFees()
            let amount = feesVault.balance
             log("Fees vault received with amount: ".concat(amount.toString()))

            self.vaultReceiverRef.deposit(from: <-feesVault)
             log("Fees deposited to admin's vault.")
            log("All available platform fees (".concat(amount.toString()).concat(") withdrawn successfully"))
        }
    }
  `,

  // --- SCRIPTS REMOVED or ADAPTED ---

  getPendingMarketDetails: ` // Simplified as evidence isn't public
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    access(all) struct PendingMarketDetails {
        access(all) let market: FlowWagerV2.Market
        access(all) let totalVolume: UFix64
        access(all) let participantCount: UInt64
        access(all) let daysSinceEnded: UFix64

        init( market: FlowWagerV2.Market ) {
            self.market = market
            self.totalVolume = market.totalPool
            self.participantCount = UInt64(FlowWagerV2.getMarketParticipants(marketId: market.id).length)
            let currentTime = getCurrentBlock().timestamp
            let secondsSinceEnded = currentTime >= market.endTime ? currentTime - market.endTime : 0.0
            self.daysSinceEnded = secondsSinceEnded / 86400.0 // seconds in a day
        }
    }

    access(all) fun main(creatorAddress: Address): [PendingMarketDetails] {
        let creatorMarkets = FlowWagerV2.getMarketsByCreator(creator: creatorAddress)
        let pendingMarkets: [PendingMarketDetails] = []
        let currentTime = getCurrentBlock().timestamp
        for market in creatorMarkets {
            // Check if status is PendingResolution or Active but past end time
             if market.status == FlowWagerV2.MarketStatus.PendingResolution || (market.status == FlowWagerV2.MarketStatus.Active && market.endTime <= currentTime && !market.resolved) {
                pendingMarkets.append(PendingMarketDetails(market: market))
            }
        }
        return pendingMarkets
    }
   `,
  getMarketEvidence: ` // Returns market info, notes evidence is private
    import FlowWagerV2 from ${getFlowWagerV2Address()}

    access(all) fun main(marketId: UInt64): {String: AnyStruct}? {
        let market = FlowWagerV2.getMarketById(marketId: marketId)
        if market == nil {
             log("Market not found: ".concat(marketId.toString()))
             return nil
        }

        // Evidence is private to the contract state in V2
        let evidence: FlowWagerV2.ResolutionEvidence? = nil

        return {
            "marketInfo": market!,
            "evidence": evidence, // Will always be nil
            "evidenceNote": "Resolution evidence is private to the contract state in FlowWagerV2."
        }
    }
   `,
  // Simplified pending market scripts as evidence isn't public
  getPendingMarketsBasic: `
        import FlowWagerV2 from ${getFlowWagerV2Address()}
        // Returns markets created by a specific address that are pending resolution
        access(all) fun main(creatorAddress: Address): [FlowWagerV2.Market] {
            let creatorMarkets = FlowWagerV2.getMarketsByCreator(creator: creatorAddress)
            var pendingMarkets: [FlowWagerV2.Market] = []
            let currentTime = getCurrentBlock().timestamp
            for market in creatorMarkets {
                 if market.status == FlowWagerV2.MarketStatus.PendingResolution || (market.status == FlowWagerV2.MarketStatus.Active && market.endTime <= currentTime && !market.resolved) {
                    pendingMarkets.append(market)
                }
            }
            return pendingMarkets
        }
    `,
  // Scripts filtering *by* evidence are not possible. These return all pending markets for the creator.
  getPendingMarketsWithEvidence: `
        import FlowWagerV2 from ${getFlowWagerV2Address()}
        // NOTE: Cannot filter by evidence presence. Returns all pending markets by creator.
        access(all) fun main(creatorAddress: Address): [FlowWagerV2.Market] {
            let creatorMarkets = FlowWagerV2.getMarketsByCreator(creator: creatorAddress)
            var pendingMarkets: [FlowWagerV2.Market] = []
            let currentTime = getCurrentBlock().timestamp
            for market in creatorMarkets {
                 if market.status == FlowWagerV2.MarketStatus.PendingResolution || (market.status == FlowWagerV2.MarketStatus.Active && market.endTime <= currentTime && !market.resolved) {
                    pendingMarkets.append(market)
                }
            }
            return pendingMarkets
        }
    `,
  getPendingMarketsWithoutEvidence: `
        import FlowWagerV2 from ${getFlowWagerV2Address()}
        // NOTE: Cannot filter by evidence absence. Returns all pending markets by creator.
        access(all) fun main(creatorAddress: Address): [FlowWagerV2.Market] {
             let creatorMarkets = FlowWagerV2.getMarketsByCreator(creator: creatorAddress)
            var pendingMarkets: [FlowWagerV2.Market] = []
            let currentTime = getCurrentBlock().timestamp
            for market in creatorMarkets {
                 if market.status == FlowWagerV2.MarketStatus.PendingResolution || (market.status == FlowWagerV2.MarketStatus.Active && market.endTime <= currentTime && !market.resolved) {
                    pendingMarkets.append(market)
                }
            }
            return pendingMarkets
        }
    `,
  // This script also cannot filter by evidence. Returns all pending markets globally.
  getAllPendingMarketsWithEvidence: `
        import FlowWagerV2 from ${getFlowWagerV2Address()}
        // NOTE: Cannot filter by evidence presence. Returns all pending markets globally.
        access(all) fun main(): [FlowWagerV2.Market] {
             let allMarkets = FlowWagerV2.getAllMarkets()
             var pendingMarkets: [FlowWagerV2.Market] = []
             let currentTime = getCurrentBlock().timestamp
             for market in allMarkets {
                 // Check for PendingResolution status or Active status past end time and not yet resolved
                 if market.status == FlowWagerV2.MarketStatus.PendingResolution || (market.status == FlowWagerV2.MarketStatus.Active && market.endTime <= currentTime && !market.resolved) {
                     pendingMarkets.append(market)
                 }
             }
             return pendingMarkets
        }
    `,
}; // End CADENCE_SCRIPTS

export class FlowWagerScripts {
  private static cache: Map<string, string> = new Map();

  static async getScript(scriptName: string): Promise<string> {
    if (this.cache.has(scriptName)) {
      return this.cache.get(scriptName)!;
    }

    if (scriptName in CADENCE_SCRIPTS) {
      const script =
        CADENCE_SCRIPTS[scriptName as keyof typeof CADENCE_SCRIPTS];
      this.cache.set(scriptName, script);
      return script;
    }

    throw new Error(`Flow Wager script not found: ${scriptName}`);
  }

  static async getTransaction(transactionName: string): Promise<string> {
    return this.getScript(transactionName);
  }

  static async getQuery(queryName: string): Promise<string> {
    return this.getScript(queryName);
  }

  static clearCache(): void {
    this.cache.clear();
  }
}

export const getScript = FlowWagerScripts.getScript.bind(FlowWagerScripts);
export const getTransaction =
  FlowWagerScripts.getTransaction.bind(FlowWagerScripts);
export const getQuery = FlowWagerScripts.getQuery.bind(FlowWagerScripts);

export const getActiveMarkets = () =>
  FlowWagerScripts.getScript("getActiveMarkets");
export const getAllMarkets = () => FlowWagerScripts.getScript("getAllMarkets");
export const getMarketById = () => FlowWagerScripts.getScript("getMarketById");
export const getMarketCreator = () =>
  FlowWagerScripts.getScript("getMarketByCreator");
export const getPlatformStats = () =>
  FlowWagerScripts.getScript("getPlatformStats");
export const getUserFlowBalance = () =>
  FlowWagerScripts.getScript("getUserFlowBalance");
export const getUserProfile = () =>
  FlowWagerScripts.getScript("getUserProfile");
export const getPendingMarkets = () =>
  FlowWagerScripts.getScript("getPendingMarkets");
export const getPendingMarketsWithEvidence = () =>
  FlowWagerScripts.getScript("getPendingMarketsWithEvidence");
export const getUserPositions = () =>
  FlowWagerScripts.getScript("getUserPositions");
export const getUserDashboardData = () =>
  FlowWagerScripts.getScript("getUserDashboardData");
export const getActiveUserPositions = () =>
  FlowWagerScripts.getScript("activeUserPositions");
export const getClaimableWinnings = () =>
  FlowWagerScripts.getScript("getClaimableWinnings");
export const checkUserRegistered = () =>
  FlowWagerScripts.getScript("checkUserRegistered");
export const getUserTrades = () => FlowWagerScripts.getScript("getUserTrades");
export const getPendingMarketDetails = () =>
  FlowWagerScripts.getScript("getPendingMarketDetails");
export const getPendingMarketsBasic = () =>
  FlowWagerScripts.getScript("getPendingMarketsBasic");
export const getAllPendingMarketsWithEvidence = () =>
  FlowWagerScripts.getScript("getAllPendingMarketsWithEvidence");
export const getPendingMarketsWithoutEvidence = () =>
  FlowWagerScripts.getScript("getPendingMarketsWithoutEvidence");
export const getAllPendingMarkets = () =>
  FlowWagerScripts.getScript("getAllPendingMarkets");
export const getMarketEvidence = () =>
  FlowWagerScripts.getScript("getMarketEvidence");
export const getAllUserTrades = () =>
  FlowWagerScripts.getScript("getAllUserTrades");

// Contract info script - returns basic contract information
export const getContractInfo = () => `
  import FlowWager from ${getFlowWagerAddress()}

  access(all) fun main(): {String: String} {
      let info: {String: String} = {}
      info["deployerAddress"] = FlowWager.deployerAddress.toString()
      info["platformFeePercentage"] = FlowWager.platformFeePercentage.toString()
      info["marketCreationFee"] = FlowWager.marketCreationFee.toString()
      return info
  }
`;

// export const submitResolutionEvidenceTransaction = () => FlowWagerScripts.getTransaction("submitResolutionEvidence");
// export const checkUsernameAvailability = () =>
//   FlowWagerScripts.getScript("checkUsernameAvailability");

export const createUserAccountTransaction = () =>
  FlowWagerScripts.getTransaction("createUserAccount");
export const createMarketTransaction = () =>
  FlowWagerScripts.getTransaction("createMarket");
export const placeBetTransaction = () =>
  FlowWagerScripts.getTransaction("placeBet");
export const resolveMarketTransaction = () =>
  FlowWagerScripts.getTransaction("resolveMarket");
export const claimWinningsTransaction = () =>
  FlowWagerScripts.getTransaction("claimWinnings");
export const submitResolutionEvidenceTransaction = () =>
  FlowWagerScripts.getTransaction("submitResolutionEvidence");
export const withdrawPlatformFeesTransaction = () =>
  FlowWagerScripts.getTransaction("withdrawPlatformFees");
export const withdrawAllPlatformFeesTransaction = () =>
  FlowWagerScripts.getTransaction("withdrawAllPlatformFees");

export type ScriptName = keyof typeof CADENCE_SCRIPTS;

export type TransactionName =
  | "createUserAccount"
  | "createMarket"
  | "placeBet"
  | "resolveMarket"
  | "claimWinnings"
  | "submitResolutionEvidence"
  | "withdrawPlatformFees"
  | "withdrawAllPlatformFees"
  | "checkUserRegistered"
  | "checkUsernameAvailability";

export type QueryName =
  | "getPendingMarketDetails"
  | "getPendingMarketsBasic"
  | "getPendingMarketsWithEvidence"
  | "getPendingMarketsWithoutEvidence"
  | "getActiveMarkets"
  | "getAllMarkets"
  | "getMarketById"
  | "getMarketCreator"
  | "getPlatformStats"
  | "getUserFlowBalance"
  | "getUserProfile"
  | "getPendingMarkets"
  | "getUserPositions"
  | "getUserDashboardData"
  | "activeUserPositions"
  | "getClaimableWinnings"
  | "checkUserRegistered"
  | "checkUsernameAvailability"
  | "getUserTrades";
