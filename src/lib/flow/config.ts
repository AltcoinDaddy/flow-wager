import { config } from "@onflow/fcl";

// Configure FCL for your network
const flowConfig = () => {
  config({
    // Mainnet Configuration
    "accessNode.api": "https://rest-mainnet.onflow.org", // or testnet: "https://rest-testnet.onflow.org"
    "discovery.wallet": "https://fcl-discovery.onflow.org/authn",
    "walletconnect.projectId": "c1e023cedfba7685938ff5b9d298cfb9",

    "0xFlowWager": process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT || "",
    "0xUserRegistry": process.env.NEXT_PUBLIC_USER_REGISTRY_CONTRACT || "",
    "0xMarketFactory": process.env.NEXT_PUBLIC_MARKET_FACTORY_CONTRACT || "",
    "0xFlowToken": "0x1654653399040a61", // Mainnet FlowToken
    "0xFungibleToken": "0xf233dcee88fe0abe", // Mainnet FungibleToken
    "app.detail.title": "FlowWager",
    "app.detail.icon": "https://www.flowwager.xyz/favicon.ico",
  });
};

export default flowConfig;
