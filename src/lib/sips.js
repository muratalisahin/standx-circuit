export const SIPS = [
  {
    id: "SIP-1",
    name: "Block Trade",
    lore: "Large orders execute off the public book to cut market impact.",
    live: "The x-ray is the public book only. Block flow is not in this feed.",
  },
  {
    id: "SIP-2",
    name: "Position Yield",
    lore: "A share of protocol fee flow can go to eligible open positions.",
    live: "Open interest on each node is live. Yield payouts are not in the public market API.",
  },
  {
    id: "SIP-3",
    name: "DUSD Native Yield",
    lore: "Platform trading fees expand yield on DUSD, the margin and pricing asset.",
    live: "Pipe thickness is 24h volume (fee activity proxy), not a vault TVL.",
  },
  {
    id: "SIP-4",
    name: "Block Options",
    lore: "Exit intent can become an on-chain option-like right on an existing position.",
    live: "No option inventory is published here. This layer is protocol anatomy.",
  },
  {
    id: "SIP-5",
    name: "Universal Markets",
    lore: "Anyone can create a market. Reward Vault hires makers. Shield Vault takes losses before ADL.",
    live: "These 11 modules are live listings. Vault balances are not exposed — not a vault explorer.",
  },
];
