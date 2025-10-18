import { config } from "@onflow/fcl";

// Configure FCL for your network
const flowConfig = () => {
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet";

  if (network === "mainnet") {
    config({
      "accessNode.api": "https://rest-mainnet.onflow.org",
      "discovery.wallet": "https://fcl-discovery.onflow.org/authn",
      "walletconnect.projectId": "c1e023cedfba7685938ff5b9d298cfb9",

      // Mainnet addresses
      // "0xFlowWager": process.env.NEXT_PUBLIC_FLOWWAGER_CONTRACT || "",
      "0xFlowToken": "0x1654653399040a61", // Mainnet FlowToken
      "0xFungibleToken": "0xf233dcee88fe0abe", // Mainnet FungibleToken

      // Forte Mainnet contract addresses
      "0xDeFiActions": "0x92195d814edf9cb0",
      "0xDeFiActionsMathUtils": "0x92195d814edf9cb0",
      "0xDeFiActionsUtils": "0x92195d814edf9cb0",
      "0xFungibleTokenConnectors": "0x1d9a619393e9fb53",
      "0xEVMNativeFLOWConnectors": "0xcc15a0c9c656b648",
      "0xEVMTokenConnectors": "0xcc15a0c9c656b648",
      "0xSwapConnectors": "0x0bce04a00aedf132",
      "0xIncrementFiSwapConnectors": "0xefa9bd7d1b17f1ed",
      "0xIncrementFiFlashloanConnectors": "0xefa9bd7d1b17f1ed",
      "0xIncrementFiPoolLiquidityConnectors": "0xefa9bd7d1b17f1ed",
      "0xIncrementFiStakingConnectors": "0xefa9bd7d1b17f1ed",
      "0xBandOracleConnectors": "0xf627b5c89141ed99",
      "0xUniswapV2Connectors": "0x0e5b1dececaca3a8",

      "app.detail.title": "FlowWager",
      "app.detail.icon": "https://www.flowwager.xyz/favicon.ico",
    });
  } else {
    // Testnet configuration (default)
    config({
      "accessNode.api": "https://rest-testnet.onflow.org",
      "discovery.wallet": "https://fcl-discovery.onflow.org/testnet/authn",
      "walletconnect.projectId": "c1e023cedfba7685938ff5b9d298cfb9",

      // Testnet addresses
      // "0xFlowWager": "0xb17b2ac32498a3f9", // Your actual contract address
      "0xFlowToken": "0x7e60df042a9c0868", // Testnet FlowToken
      "0xFungibleToken": "0x9a0766d93b6608b7", // Testnet FungibleToken

      // Forte Testnet contract addresses
      "0xDeFiActions": "0x4c2ff9dd03ab442f",
      "0xDeFiActionsMathUtils": "0x4c2ff9dd03ab442f",
      "0xDeFiActionsUtils": "0x4c2ff9dd03ab442f",
      "0xFungibleTokenConnectors": "0x5a7b9cee9aaf4e4e",
      "0xEVMNativeFLOWConnectors": "0xb88ba0e976146cd1",
      "0xEVMTokenConnectors": "0xb88ba0e976146cd1",
      "0xSwapConnectors": "0xaddd594cf410166a",
      "0xIncrementFiSwapConnectors": "0x49bae091e5ea16b5",
      "0xIncrementFiFlashloanConnectors": "0x49bae091e5ea16b5",
      "0xIncrementFiPoolLiquidityConnectors": "0x49bae091e5ea16b5",
      "0xIncrementFiStakingConnectors": "0x49bae091e5ea16b5",
      "0xBandOracleConnectors": "0x1a9f5d18d096cd7a",
      "0xUniswapV2Connectors": "0xfef8e4c5c16ccda5",

      "app.detail.title": "FlowWager - Testnet",
      "app.detail.icon": "https://www.flowwager.xyz/favicon.ico",
    });
  }
};

export default flowConfig;
