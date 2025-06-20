import { config } from "@onflow/fcl"

// Configure FCL for your network
const flowConfig = () => {
  config({
    // Mainnet Configuration
    "accessNode.api": "https://rest-mainnet.onflow.org",
    "discovery.wallet": "https://fcl-discovery.onflow.org/authn",
    
    // Testnet Configuration (use this for development)
    // "accessNode.api": "https://rest-testnet.onflow.org",
    // "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
    
    // Your contract addresses - UPDATE THESE AFTER DEPLOYMENT
    "0xFlowWager": "0xYOUR_CONTRACT_ADDRESS",
    "0xUserRegistry": "0xYOUR_USER_REGISTRY_ADDRESS", 
    "0xMarketFactory": "0xYOUR_MARKET_FACTORY_ADDRESS",
    "0xFlowToken": "0x1654653399040a61", // Mainnet FlowToken
    "0xFungibleToken": "0xf233dcee88fe0abe", // Mainnet FungibleToken
    
    // For Testnet, use these addresses instead:
    // "0xFlowToken": "0x7e60df042a9c0868",
    // "0xFungibleToken": "0x9a0766d93b6608b7",
    
    // App info for wallet display
    "app.detail.title": "FlowWager",
    "app.detail.icon": "https://your-domain.com/favicon.ico",
    
    // Enable authn (authentication) inclusion in authorization
    "fcl.authz.default": "https://fcl-discovery.onflow.org/api/authn",
  })
}

export default flowConfig