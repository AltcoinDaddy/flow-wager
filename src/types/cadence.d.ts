declare module "*.cdc" {
  const content: string;
  export default content;
}

// Declare the @flow-wager alias for TypeScript
declare module "@flow-wager/*" {
  const content: string;
  export default content;
}

// Specific module declarations for better type safety
declare module "@flow-wager/transactions/place_bet.cdc" {
  const content: string;
  export default content;
}

declare module "@flow-wager/transactions/create_market.cdc" {
  const content: string;
  export default content;
}

declare module "@flow-wager/transactions/resolve_market.cdc" {
  const content: string;
  export default content;
}

declare module "@flow-wager/transactions/claim_ winnings.cdc" {
  const content: string;
  export default content;
}



declare module "@flow-wager/scripts/get_active_markets.cdc" {
  const content: string;
  export default content;
}

declare module "@flow-wager/scripts/get_all_markets.cdc" {
  const content: string;
  export default content;
}

declare module "@flow-wager/scripts/get_contract_info.cdc" {
  const content: string;
  export default content;
}

declare module "@flow-wager/scripts/get_market_creator.cdc" {
  const content: string;
  export default content;
}

declare module "@flow-wager/scripts/get_platform_stats.cdc" {
  const content: string;
  export default content;
}

declare module "@flow-wager/scripts/get_user_flow_balance.cdc" {
  const content: string;
  export default content;
}

declare module "@flow-wager/scripts/get_user_profile.cdc" {
  const content: string;
  export default content;
}

declare module "@flow-wager/scripts/test_bet_validation.cdc" {
  const content: string;
  export default content;
}