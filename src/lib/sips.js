export const SIPS = [
  {
    id: "SIP-1",
    name: "Block Trade",
    lore: "Büyük emirler, piyasayı az etkilemek için public defterin dışında gerçekleşebilir.",
    live: "X-ray yalnızca public defteri gösterir. Block akışı bu feed’de yok.",
  },
  {
    id: "SIP-2",
    name: "Position Yield",
    lore: "Protokol ücretinin bir payı, uygun açık pozisyonlara gidebilir.",
    live: "Her düğümdeki open interest canlı. Getiri ödemeleri public market API’de yok.",
  },
  {
    id: "SIP-3",
    name: "DUSD Native Yield",
    lore: "Platform işlem ücretleri, margin ve fiyatlama varlığı DUSD’nin getirisini büyütebilir.",
    live: "Boruların kalınlığı 24 saatlik hacimdir (ücret aktivitesi), vault TVL değildir.",
  },
  {
    id: "SIP-4",
    name: "Block Options",
    lore: "Çıkış niyeti, mevcut pozisyon üzerinde zincir üstü opsiyon benzeri bir hak olabilir.",
    live: "Opsiyon envanteri burada yayınlanmaz. Bu katman protokol anatomisidir.",
  },
  {
    id: "SIP-5",
    name: "Universal Markets",
    lore: "Herkes piyasa açabilir. Reward Vault maker tutar. Shield Vault, ADL’den önce zararları karşılar.",
    live: "Bu modüller canlı listelerdir. Vault bakiyeleri yok — vault explorer değil.",
  },
];
