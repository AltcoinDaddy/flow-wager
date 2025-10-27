import FlowWagerV2 from  "FlowWagerV2"

    //// Borrows the public capability for user profile
    access(all) fun main(address: Address): &{FlowWagerV2.UserProfilePublic}? {
      let account = getAccount(address)
      return account.capabilities.borrow<&{FlowWagerV2.UserProfilePublic}>(
          FlowWagerV2.UserProfilePublicPath
      )
    }
