import { config } from "@onflow/fcl";

// Configure FCL for your network
const flowConfig = () => {
  config({
    // Mainnet Configuration
    "accessNode.api": "https://rest-mainnet.onflow.org", // or testnet: "https://rest-testnet.onflow.org"
    "discovery.wallet": "https://fcl-discovery.onflow.org/authn",

    "0xFlowWager": process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT || "",
    "0xUserRegistry": process.env.NEXT_PUBLIC_USER_REGISTRY_CONTRACT || "",
    "0xMarketFactory": process.env.NEXT_PUBLIC_MARKET_FACTORY_CONTRACT || "",
    "0xFlowToken": "0x1654653399040a61", // Mainnet FlowToken
    "0xFungibleToken": "0xf233dcee88fe0abe", // Mainnet FungibleToken
    "app.detail.title": "FlowWager",
    "app.detail.icon": "https://your-domain.com/favicon.ico",

    "fcl.authz.default": "https://fcl-discovery.onflow.org/api/authn",
  });
};

export default flowConfig;
