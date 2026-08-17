import { SIPS } from "./sips.js";

const SCANS = [
  { claim: "DUSD, StandX’in getirili stablecoin’i ve margin / fiyatlama varlığıdır.", truth: true },
  { claim: "DUSD getiri için önce ayrı bir staking kilidi gerekir.", truth: false },
  { claim: "Perps Wallet’taki DUSD puan ve getiri kazanır. Cash Wallet’taki DUSD kazanmaz.", truth: true },
  { claim: "StandX sadece spot borsadır, perpetual piyasa yoktur.", truth: false },
  { claim: "Maker Points, hiç dolmayan limit emirde de birikebilir; emir yeterince beklerse.", truth: true },
  { claim: "Limit emir 0.1 saniyede iptal edilse bile anında Maker Points verir.", truth: false },
  { claim: "SIP-1 Block Trade: büyük emirler public defterin dışında geçebilir.", truth: true },
  { claim: "SIP-1 Universal Markets’tır: herkes ticker açar.", truth: false },
  { claim: "SIP-2 Position Yield, protokol ücretinin bir payını açık pozisyonlara verebilir.", truth: true },
  { claim: "SIP-3: işlem ücretleri DUSD native getirisini büyütebilir.", truth: true },
  { claim: "SIP-4 Block Options, çıkış niyetini mevcut pozisyon üzerinde opsiyon benzeri hak yapar.", truth: true },
  { claim: "SIP-5 Universal Markets: herkes piyasa açabilir.", truth: true },
  { claim: "SIP-5’te Shield Vault, ADL’den önce zararları karşılar.", truth: true },
  { claim: "Reward Vault, maker likiditesi sağlamak için tutulur.", truth: true },
  { claim: "Bu Circuit ekranı Shield/Reward TVL gösteren bir vault explorer’dır.", truth: false },
  { claim: "Boruların kalınlığı 24s hacimdir, vault TVL değildir.", truth: true },
  { claim: "Düğüm boyutu open interest’i gösterir.", truth: true },
  { claim: "Public depth x-ray, gizli block-trade envanterini de gösterir.", truth: false },
  { claim: "Pozitif funding genelde long’ların short’lara ödediği anlamına gelir.", truth: true },
  { claim: "StandX perp’ler DUSD etrafında fiyatlanır ve marginlenir.", truth: true },
  { claim: "Community Maker Yield, mark’a yakın iki yönlü kotasyon ve uptime içindir.", truth: true },
  { claim: "Holder puanı için DUSD’nin Perps Wallet veya Vault’ta olması gerekirdi.", truth: true },
  { claim: "ADL, sigorta / shield katmanından sonra son çare sosyalize zarardır.", truth: true },
  { claim: "Maker emir defterde bekler. Taker spread’i geçer.", truth: true },
  { claim: "Open interest açık pozisyon notional’ıdır; 24s hacimle aynı şey değildir.", truth: true },
  { claim: "Mark price funding ve likidasyon referansıdır, sadece son işlem değildir.", truth: true },
  { claim: "Bu uygulamanın sayıları public market / depth / kline feed’inden gelir.", truth: true },
  { claim: "SIP-5A Community Maker Yield, SIP-1 Block Trade’in yeni adıdır.", truth: false },
  { claim: "Funding, perpetual’de long ile short arasında transferdir; hisse temettüsü değildir.", truth: true },
  { claim: "Stander, bu devrenin DUSD çekirdeğindeki StandX maskotudur.", truth: true },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function ranked(symbols, key) {
  return [...symbols].sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0));
}

function volOf(s) {
  return Number(s.volume_quote_24h || 0);
}
function oiOf(s) {
  return Number(s.open_interest_notional || s.open_interest || 0);
}
function fundOf(s) {
  return Number(s.funding_rate || 0);
}
function chgOf(s) {
  return Number(s.price_change_pct || 0);
}

export function makeIntercept({ symbols, book, wave, selected }) {
  const liveOk = symbols?.length >= 3;
  const types = [];
  if (liveOk) types.push("vol", "oi", "green", "red", "fund");
  types.push("scan", "sip");
  if (book && Number.isFinite(book.imbalance)) types.push("book");
  if (wave > 0 && wave % 6 === 0) return bossIntercept({ symbols, wave });

  const type = pick(types);
  if (type === "vol") return hunt(symbols, "vol", "En kalın boruyu seç: 24 saatlik hacmi en yüksek piyasaya tıkla.");
  if (type === "oi") return hunt(symbols, "oi", "En şişkin düğüm: open interest’i en yüksek piyasaya tıkla.");
  if (type === "green") return sideHunt(symbols, 1);
  if (type === "red") return sideHunt(symbols, -1);
  if (type === "fund") return fundHunt(symbols);
  if (type === "sip") return sipFault();
  if (type === "book") return bookCall(book, selected);
  return protocolScan();
}

function hunt(symbols, kind, prompt) {
  const key = kind === "vol" ? volOf : oiOf;
  const sorted = [...symbols].sort((a, b) => key(b) - key(a));
  const winner = sorted[0];
  const close = sorted[1] && key(sorted[0]) > 0 && key(sorted[0]) / Math.max(key(sorted[1]), 1) < 1.08;
  return {
    kind: kind === "vol" ? "HACİM BORUSU" : "OI DÜĞÜMÜ",
    prompt,
    hint: close ? "İki boru yakın. Canlı halkaya bak, ezbere değil." : "Canlı halkaya bak. Kalın boru / büyük düğüm.",
    target: winner.symbol,
    mode: "tap-mod",
    seconds: 14,
    score: 10,
  };
}

function sideHunt(symbols, dir) {
  const hits = symbols.filter((s) => (dir > 0 ? chgOf(s) > 0 : chgOf(s) < 0));
  if (hits.length < 1) return protocolScan();
  return {
    kind: dir > 0 ? "YEŞİL TICK" : "KIRMIZI TICK",
    prompt: dir > 0 ? "24s değişimi yeşil olan herhangi bir piyasaya tıkla." : "24s değişimi kırmızı olan herhangi bir piyasaya tıkla.",
    hint: "Halkadaki % yazısına bak.",
    accept: new Set(hits.map((s) => s.symbol)),
    mode: "tap-mod",
    seconds: 12,
    score: 10,
  };
}

function fundHunt(symbols) {
  const pos = symbols.filter((s) => fundOf(s) > 0);
  const neg = symbols.filter((s) => fundOf(s) < 0);
  if (pos.length && Math.random() < 0.55) {
    return {
      kind: "FUNDING",
      prompt: "Long’lar ödüyor. Funding’i pozitif olan bir piyasaya tıkla.",
      hint: "Pozitif funding = long short’a öder.",
      accept: new Set(pos.map((s) => s.symbol)),
      mode: "tap-mod",
      seconds: 13,
      score: 10,
    };
  }
  if (neg.length) {
    return {
      kind: "FUNDING",
      prompt: "Short’lar ödüyor. Funding’i negatif olan bir piyasaya tıkla.",
      hint: "Negatif funding = short long’a öder.",
      accept: new Set(neg.map((s) => s.symbol)),
      mode: "tap-mod",
      seconds: 13,
      score: 10,
    };
  }
  return {
    kind: "FUNDING",
    prompt: "Halkada yüklü funding yok. Ortadaki Stander’a (DUSD çekirdek) tıkla.",
    hint: "Çekirdek Stander’dır.",
    target: "CORE",
    mode: "tap-core",
    seconds: 10,
    score: 10,
  };
}

function sipFault() {
  const sip = pick(SIPS);
  const decoys = shuffle(SIPS.filter((s) => s.id !== sip.id)).slice(0, 2);
  return {
    kind: "SIP ARIZA",
    prompt: `${sip.id} — ${sip.name}: ${sip.lore}  Hangisi? Aşağıdaki SIP’e bas.`,
    hint: "Doğru SIP çipine bas.",
    target: sip.id,
    mode: "tap-sip",
    options: shuffle([sip, ...decoys]),
    seconds: 16,
    score: 10,
  };
}

function protocolScan() {
  const row = pick(SCANS);
  return {
    kind: "PROTOKOL",
    prompt: row.claim,
    hint: "Doğruysa DOĞRU’ya bas. Yanlışsa YANLIŞ’a bas.",
    target: row.truth ? "CORE" : "MODULE",
    mode: "truth",
    seconds: 12,
    score: 10,
  };
}

function bookCall(book, symbol) {
  const bid = book.imbalance >= 0;
  return {
    kind: "DEFTER",
    prompt: `${symbol || "Bu piyasa"} canlı defteri: hangi taraf daha ağır?`,
    hint: "Bid = alış duvarı, Ask = satış duvarı.",
    target: bid ? "BID" : "ASK",
    mode: "tap-side",
    seconds: 11,
    score: 10,
  };
}

function bossIntercept({ symbols }) {
  const sorted = ranked(symbols, "volume_quote_24h");
  const sip = pick(SIPS);
  const sipOpts = shuffle([sip, ...shuffle(SIPS.filter((s) => s.id !== sip.id)).slice(0, 2)]);
  return {
    kind: "BOSS",
    prompt: `İki adım. Önce ${sorted[0]?.symbol || "hacim kralı"} piyasasına tıkla, sonra SIP: ${sip.name}.`,
    hint: sip.lore,
    steps: [
      { mode: "tap-mod", target: sorted[0]?.symbol, label: "Volume king" },
      { mode: "tap-sip", target: sip.id, label: sip.id, options: sipOpts },
    ],
    step: 0,
    seconds: 22,
    score: 10,
    sip,
  };
}

export function resolveHit(intercept, hit) {
  if (!intercept) return false;
  if (intercept.steps) {
    const step = intercept.steps[intercept.step || 0];
    return hitMatches(step, hit);
  }
  return hitMatches(intercept, hit);
}

function hitMatches(rule, hit) {
  if (rule.mode === "tap-mod") {
    if (rule.accept) return rule.accept.has(hit.symbol);
    return hit.symbol === rule.target;
  }
  if (rule.mode === "tap-core") return hit.kind === "core";
  if (rule.mode === "tap-sip") return hit.sip === rule.target;
  if (rule.mode === "tap-side") return hit.side === rule.target;
  if (rule.mode === "truth") {
    if (rule.target === "CORE") return hit.kind === "core";
    return hit.kind === "mod";
  }
  return false;
}

export function advanceBoss(intercept) {
  if (!intercept?.steps) return { done: true, intercept };
  const next = (intercept.step || 0) + 1;
  if (next >= intercept.steps.length) return { done: true, intercept };
  return { done: false, intercept: { ...intercept, step: next } };
}

export const RANKS = [
  { min: 0, id: "SPARK", line: "Akım henüz çekirdekten çıkıyor." },
  { min: 30, id: "MAKER", line: "Kotasyon oturdu." },
  { min: 60, id: "SHIELD", line: "Zarar en son sana gelir." },
  { min: 100, id: "CIRCUIT", line: "Halka cevap veriyor." },
  { min: 150, id: "UNIVERSAL", line: "Piyasa açıp canlı tutarsın." },
];

export function rankFor(score) {
  return [...RANKS].reverse().find((r) => score >= r.min) || RANKS[0];
}
