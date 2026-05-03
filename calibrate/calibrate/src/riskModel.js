export const DISPERSION_SCORES = {
  ETF_BROAD: 2,
  ETF_GROWTH: 4,
  STOCK_QUALITY: 5,
  STOCK_GROWTH: 7,
  SPECULATIVE: 8,
  CRYPTO: 9,
};

// mapping simples (podes expandir depois)
export function getDispersionScore(ticker, type) {
  const t = ticker.toUpperCase();

  if (["SXR8", "VUAA"].includes(t)) return DISPERSION_SCORES.ETF_BROAD;
  if (["SXRV", "CNDX"].includes(t)) return DISPERSION_SCORES.ETF_GROWTH;

  if (["AAPL", "MSFT", "GOOG"].includes(t)) return DISPERSION_SCORES.STOCK_QUALITY;
  if (["AMZN", "META", "NVDA"].includes(t)) return DISPERSION_SCORES.STOCK_GROWTH;

  if (["TSLA", "COIN"].includes(t)) return DISPERSION_SCORES.SPECULATIVE;

  if (["BTC", "ETH"].includes(t)) return DISPERSION_SCORES.CRYPTO;

  return 6; // default
}

export function calculateRisk(allocation) {
  const total = allocation.reduce((s, p) => s + p.value, 0);

  if (!total) return 0;

  // base dispersion
  let base = allocation.reduce((sum, p) => {
    const weight = p.value / total;
    const score = getDispersionScore(p.ticker, p.type);
    return sum + weight * score;
  }, 0);

  // concentração
  const weights = allocation.map(p => p.value / total).sort((a,b)=>b-a);
  const top1 = weights[0] || 0;
  const top3 = weights.slice(0,3).reduce((a,b)=>a+b,0);

  let concentrationPenalty = 0;
  if (top1 > 0.4) concentrationPenalty += 1;
  if (top3 > 0.7) concentrationPenalty += 1;

  // high dispersion exposure
  const highDisp = allocation
    .filter(p => getDispersionScore(p.ticker) >= 7)
    .reduce((s,p)=> s + p.value/total, 0);

  let tailPenalty = highDisp > 0.5 ? 1.5 : 0;

  return Math.min(10, base + concentrationPenalty + tailPenalty);
}