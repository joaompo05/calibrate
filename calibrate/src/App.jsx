import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: async () => ({ error: null }),
        signInWithPassword: async () => ({ error: null }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: async () => ({ error: null }) }),
        insert: async () => ({ error: null }),
      }),
    };

const STORAGE_KEY = "calibrate_apple_stocks_v1";
// SAFE ROLLBACK POINT: dashboard state before landing page addition.
// To return to the old behavior, set initial screen to "dashboard" and remove LandingPage rendering.

const CLASSIC_UI = {
  bg: "#000000",
  card: "#1c1c1e",
  card2: "#2c2c2e",
  card3: "#3a3a3c",
  text: "#f5f5f7",
  muted: "#8e8e93",
  muted2: "#636366",
  green: "#30d158",
  red: "#ff453a",
  blue: "#3b5fcc",
  orange: "#ff9f0a",
  purple: "#3b5fcc",
  cyan: "#64d2ff",
  border: "rgba(255,255,255,0.08)",
};

const UI = {
  ...CLASSIC_UI,
  bg: "radial-gradient(circle at top left, rgba(10,26,80,0.55), transparent 35%), radial-gradient(circle at top right, rgba(20,50,130,0.35), transparent 32%), #000000",
  card: "rgba(28,28,30,0.92)",
  card2: "rgba(44,44,46,0.94)",
  card3: "#3a3a3c",
  border: "rgba(255,255,255,0.075)",
  shadow: "0 18px 50px rgba(0,0,0,0.32)",
};

const COLORS = [UI.blue, UI.green, UI.cyan, UI.blue, UI.orange, UI.red, "#4c6ef5", "#8e8e93"];

const ETF_DATA = {
  SXR8: {
    name: "iShares Core S&P 500",
    provider: "iShares",
    sector: { Technology: 32, Financials: 13, Healthcare: 11, Consumer: 10, Industrials: 8, Other: 26 },
    currency: { USD: 100 },
    holdings: { AAPL: 7, MSFT: 6.8, NVDA: 6.4, AMZN: 3.8, META: 2.6, GOOGL: 2.1, GOOG: 1.8, TSLA: 1.5, OTHER_SP500: 66 },
  },
  SXRV: {
    name: "iShares NASDAQ 100",
    provider: "iShares",
    sector: { Technology: 51, Communication: 15, Consumer: 14, Healthcare: 6, Industrials: 4, Other: 10 },
    currency: { USD: 100 },
    holdings: { AAPL: 8.8, MSFT: 8.1, NVDA: 7.6, AMZN: 5.5, AVGO: 4.5, META: 3.7, TSLA: 3.2, GOOGL: 2.5, GOOG: 2.3, OTHER_NASDAQ: 48.8 },
  },
  VUAA: {
    name: "Vanguard S&P 500",
    provider: "Vanguard",
    sector: { Technology: 32, Financials: 13, Healthcare: 11, Consumer: 10, Industrials: 8, Other: 26 },
    currency: { USD: 100 },
    holdings: { AAPL: 7, MSFT: 6.8, NVDA: 6.4, AMZN: 3.8, META: 2.6, GOOGL: 2.1, GOOG: 1.8, TSLA: 1.5, OTHER_SP500: 66 },
  },
};

const STOCK_META = {
  AMZN: { name: "Amazon", sector: "Consumer", currency: "USD" },
  COIN: { name: "Coinbase", sector: "Financials", currency: "USD" },
  AAPL: { name: "Apple", sector: "Technology", currency: "USD" },
  MSFT: { name: "Microsoft", sector: "Technology", currency: "USD" },
  NVDA: { name: "NVIDIA", sector: "Technology", currency: "USD" },
  META: { name: "Meta", sector: "Communication", currency: "USD" },
  TSLA: { name: "Tesla", sector: "Consumer", currency: "USD" },
  BTC: { name: "Bitcoin", sector: "Crypto", currency: "USD" },
  ETH: { name: "Ethereum", sector: "Crypto", currency: "USD" },
};

const LOGOS = {
  AMZN: "https://logo.clearbit.com/amazon.com",
  GOOGL: "https://logo.clearbit.com/google.com",
  GOOG: "https://logo.clearbit.com/google.com",
  COIN: "https://logo.clearbit.com/coinbase.com",
  AAPL: "https://logo.clearbit.com/apple.com",
  MSFT: "https://logo.clearbit.com/microsoft.com",
  NVDA: "https://logo.clearbit.com/nvidia.com",
  META: "https://logo.clearbit.com/meta.com",
  TSLA: "https://logo.clearbit.com/tesla.com",
  SXR8: "https://logo.clearbit.com/ishares.com",
  SXRV: "https://logo.clearbit.com/ishares.com",
  CNDX: "https://logo.clearbit.com/ishares.com",
  VUAA: "https://logo.clearbit.com/vanguard.com",
};

const FALLBACK_PRICES = {
  SXR8: 595,
  SXRV: 675,
  VUAA: 112,
  AMZN: 200,
  COIN: 245,
  AAPL: 210,
  MSFT: 430,
  NVDA: 880,
  META: 520,
  TSLA: 240,
  BTC: 65000,
  ETH: 3200,
};

const DEFAULT_POSITIONS = [
  { id: 1, ticker: "SXR8", name: "iShares Core S&P 500", type: "ETF", shares: "4.2", buyPrice: "520", fallbackPrice: "595", useLivePrice: true, conviction: "High", purchaseDate: "2025-01-15" },
  { id: 2, ticker: "SXRV", name: "iShares NASDAQ 100", type: "ETF", shares: "2.4", buyPrice: "610", fallbackPrice: "675", useLivePrice: true, conviction: "High", purchaseDate: "2025-02-10" },
  { id: 3, ticker: "AMZN", name: "Amazon", type: "Stock", shares: "3", buyPrice: "170", fallbackPrice: "200", useLivePrice: true, conviction: "High", purchaseDate: "2025-03-05" },
  { id: 4, ticker: "COIN", name: "Coinbase", type: "Stock", shares: "2", buyPrice: "160", fallbackPrice: "245", useLivePrice: true, conviction: "Exploratory", purchaseDate: "2025-04-01" },
];

const DEFAULT_TARGETS = [
  { id: 1, ticker: "SXR8", percent: "45" },
  { id: 2, ticker: "SXRV", percent: "35" },
  { id: 3, ticker: "AMZN", percent: "12" },
  { id: 4, ticker: "COIN", percent: "8" },
];

const DEFAULT_NOTES = {
  AMZN: "Thesis: logistics scale + AWS + advertising. Watch cloud margins, retail efficiency, and AI capex ROI.",
  COIN: "Thesis: exchange + custody + tokenization infrastructure. High cyclicality, high upside.",
  SXR8: "Core ETF thesis: broad US equity exposure and long-term compounding.",
  SXRV: "Growth ETF thesis: concentrated exposure to technology and innovation leaders.",
};

const DEFAULT_SCORES = {
  AMZN: { moat: 8, management: 8, growth: 9, valuation: 6, balance: 7, risk: 6, conviction: 8 },
  COIN: { moat: 6, management: 7, growth: 8, valuation: 7, balance: 6, risk: 8, conviction: 7 },
  SXR8: { moat: 8, management: 7, growth: 7, valuation: 7, balance: 8, risk: 3, conviction: 8 },
  SXRV: { moat: 7, management: 7, growth: 8, valuation: 6, balance: 7, risk: 5, conviction: 8 },
};

const DEFAULT_PREDICTIONS = [
  { id: 1, ticker: "AMZN", claim: "AMZN will outperform the S&P 500 over the next 12 months", confidence: "65", expectedReturn: "18", horizon: "12 months", status: "Open", actualReturn: "", result: "" },
];

function n(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value, decimals = 0) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: decimals }).format(n(value));
}

function pct(value) {
  return `${n(value).toFixed(1)}%`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yahooSymbol(ticker, type) {
  const clean = String(ticker || "").trim().toUpperCase();
  return type === "Crypto" ? `${clean}-USD` : clean;
}

async function fetchYahooPrice(ticker, type) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol(ticker, type))}?range=1d&interval=1m`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Market data request failed");
  const data = await response.json();
  const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice || data?.chart?.result?.[0]?.meta?.previousClose;
  if (!price) throw new Error("No price returned");
  return Number(price);
}

function getPrice(position, prices) {
  const ticker = String(position.ticker || "").toUpperCase();
  if (position.useLivePrice && prices[ticker]) return prices[ticker];
  return n(position.fallbackPrice);
}

function positionValue(position, prices) {
  return n(position.shares) * getPrice(position, prices);
}

function positionCost(position) {
  return n(position.shares) * n(position.buyPrice);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function createHistory(total) {
  return Array.from({ length: 56 }, (_, index) => {
    const progress = index / 55;
    const wave = Math.sin(index * 0.48) * total * 0.018 + Math.cos(index * 0.23) * total * 0.01;
    return { date: `T-${55 - index}`, value: Math.max(0, total * (0.86 + progress * 0.15) + wave) };
  });
}

function buildPortfolioHistoryFromPurchaseDates(positions, prices) {
  const datedPositions = positions
    .filter((position) => position.purchaseDate)
    .map((position) => ({ ...position, purchaseTime: new Date(position.purchaseDate).getTime() }))
    .filter((position) => Number.isFinite(position.purchaseTime));

  if (!datedPositions.length) {
    const total = positions.reduce((sum, position) => sum + positionValue(position, prices), 0);
    return createHistory(total);
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date(todayKey()).getTime();
  const earliest = Math.min(...datedPositions.map((position) => position.purchaseTime));
  const days = Math.max(1, Math.min(730, Math.round((today - earliest) / dayMs) + 1));

  return Array.from({ length: days }, (_, index) => {
    const currentTime = earliest + index * dayMs;
    const value = datedPositions.reduce((sum, position) => {
      if (position.purchaseTime > currentTime) return sum;
      const shares = n(position.shares);
      const buyPrice = n(position.buyPrice);
      const currentPrice = getPrice(position, prices);
      const elapsed = Math.max(currentTime - position.purchaseTime, 0);
      const totalElapsed = Math.max(today - position.purchaseTime, dayMs);
      const progress = Math.min(elapsed / totalElapsed, 1);
      const interpolatedPrice = buyPrice + (currentPrice - buyPrice) * progress;
      return sum + shares * interpolatedPrice;
    }, 0);

    return { date: new Date(currentTime).toISOString().slice(0, 10), value };
  });
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth <= 760 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 760);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isMobile;
}

function GlobalStyles() {
  return (
    <style>{`
      html, body, #root {
        width: 100%;
        min-width: 100%;
        min-height: 100%;
        margin: 0;
        padding: 0;
        background: #000;
      }

      body {
        display: block !important;
        place-items: initial !important;
        overflow-x: hidden;
      }

      #root {
        max-width: none !important;
        margin: 0 !important;
        padding: 0 !important;
        text-align: initial !important;
      }

      * {
        box-sizing: border-box;
      }
    `}</style>
  );
}

function Card({ children, style, ...props }) {
  return (
    <div
      {...props}
      style={{
        background: UI.card,
        borderRadius: 26,
        border: `1px solid ${UI.border}`,
        boxShadow: UI.shadow,
        backdropFilter: "blur(18px)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Input(props) {
  return <input {...props} style={{ width: "100%", boxSizing: "border-box", padding: "13px 15px", border: 0, borderRadius: 14, outline: "none", background: UI.card2, color: UI.text, fontSize: 15, ...(props.style || {}) }} />;
}

function Select(props) {
  return <select {...props} style={{ width: "100%", boxSizing: "border-box", padding: "13px 15px", border: 0, borderRadius: 14, outline: "none", background: UI.card2, color: UI.text, fontSize: 15, ...(props.style || {}) }} />;
}

function Bar({ value, color = UI.blue }) {
  return <div style={{ height: 6, background: UI.card3, borderRadius: 999, overflow: "hidden" }}><div style={{ height: "100%", width: `${Math.min(Math.max(n(value), 0), 100)}%`, background: color, borderRadius: 999 }} /></div>;
}

function Logo({ ticker, type, size = 44 }) {
  const [failed, setFailed] = useState(false);
  const cleanTicker = String(ticker || "").toUpperCase();
  const source = LOGOS[cleanTicker];
  const isETF = type === "ETF";

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        background: isETF ? "rgba(10,132,255,0.16)" : UI.card2,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        flex: "0 0 auto",
        border: `1px solid ${UI.border}`,
      }}
      title={isETF ? `${cleanTicker} · ${ETF_DATA[cleanTicker]?.provider || "ETF"}` : cleanTicker}
    >
      {source && !failed ? (
        <img
          src={source}
          alt={cleanTicker}
          onError={() => setFailed(true)}
          style={{
            width: "75%",
            height: "75%",
            objectFit: "contain",
            borderRadius: 8,
            background: "white",
            padding: 4,
          }}
        />
      ) : (
        <span
          style={{
            fontWeight: 700,
            fontSize: Math.max(size * 0.24, 10),
            color: UI.text,
            letterSpacing: -0.2,
          }}
        >
          {cleanTicker}
        </span>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const color = status === "live" ? UI.green : status === "error" ? UI.red : status === "manual" ? UI.orange : UI.muted;
  const label = status === "live" ? "Live" : status === "error" ? "Error" : status === "manual" ? "Manual" : "Fallback";
  return <span style={{ color, fontSize: 12, padding: "4px 8px", background: `${color}18`, borderRadius: 999 }}>{label}</span>;
}



function PortfolioChart({ history, totalValue, addSnapshot }) {
  const isMobile = useIsMobile();
  const [range, setRange] = useState("1M");
  const [hoverPoint, setHoverPoint] = useState(null);
  const count = range === "1D" ? 20 : range === "1W" ? 32 : range === "1M" ? 56 : range === "1Y" ? 365 : 9999;
  const data = history.slice(-count).length ? history.slice(-count) : [{ date: todayKey(), value: totalValue }];
  const width = 900;
  const height = 310;
  const min = Math.min(...data.map((d) => d.value));
  const max = Math.max(...data.map((d) => d.value));
  const coords = data.map((item, index) => {
    const x = 18 + (index / Math.max(data.length - 1, 1)) * (width - 46);
    const y = 20 + (1 - (item.value - min) / Math.max(max - min, 1)) * (height - 58);
    return { x, y, value: item.value };
  });
  const points = coords.map((p) => `${p.x},${p.y}`).join(" ");
  const last = data[data.length - 1]?.value || totalValue;
  const displayedValue = hoverPoint?.value || last;
  const first = data[0]?.value || totalValue;
  const change = displayedValue - first;
  const changePct = first ? (change / first) * 100 : 0;
  const positive = change >= 0;
  const lastPoint = coords[coords.length - 1] || { x: width - 24, y: height / 2 };
  const activePoint = hoverPoint || lastPoint;

  function handleChartMove(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * width;
    const nearest = coords.reduce((best, point) => Math.abs(point.x - relativeX) < Math.abs(best.x - relativeX) ? point : best, coords[0]);
    setHoverPoint(nearest);
  }

  return (
    <Card style={{ padding: isMobile ? 18 : 24, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div style={{ color: UI.muted, fontSize: 15 }}>Portfolio</div>
          <div style={{ fontSize: "clamp(42px, 7vw, 66px)", fontWeight: 600, letterSpacing: -2, marginTop: 4, lineHeight: 1.02 }}>{money(displayedValue)}</div>
          <div style={{ color: positive ? UI.green : UI.red, fontSize: 17, marginTop: 12, lineHeight: 1.25 }}>{positive ? "+" : ""}{money(change)} ({positive ? "+" : ""}{pct(changePct)})</div>
        </div>
        <button onClick={addSnapshot} style={{ alignSelf: "start", border: 0, background: UI.card2, color: UI.blue, borderRadius: 999, padding: "10px 14px", fontSize: 15, cursor: "pointer" }}>Save Snapshot</button>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        onMouseMove={handleChartMove}
        onMouseLeave={() => setHoverPoint(null)}
        style={{ width: "100%", height: isMobile ? 230 : 320, display: "block", cursor: "crosshair" }}
      >
        <defs>
          <linearGradient id="portfolioFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={positive ? UI.green : UI.red} stopOpacity="0.22" />
            <stop offset="100%" stopColor={positive ? UI.green : UI.red} stopOpacity="0" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        {[0.25, 0.5, 0.75].map((line) => <line key={line} x1="18" x2={width - 28} y1={height * line} y2={height * line} stroke="rgba(255,255,255,.08)" strokeWidth="1" />)}
        <polygon points={`18,${height - 24} ${points} ${width - 28},${height - 24}`} fill="url(#portfolioFill)" />
        <polyline points={points} fill="none" stroke={positive ? UI.green : UI.red} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <line x1={activePoint.x} x2={activePoint.x} y1="18" y2={height - 24} stroke="rgba(255,255,255,.28)" />
        <circle cx={activePoint.x} cy={activePoint.y} r="7" fill={positive ? UI.green : UI.red} filter="url(#glow)" />
        {hoverPoint && (
          <g>
            <rect x={Math.min(Math.max(activePoint.x - 62, 12), width - 136)} y={Math.max(activePoint.y - 52, 14)} width="124" height="34" rx="12" fill="rgba(0,0,0,.78)" stroke="rgba(255,255,255,.12)" />
            <text x={Math.min(Math.max(activePoint.x, 74), width - 74)} y={Math.max(activePoint.y - 30, 36)} textAnchor="middle" fill={UI.text} fontSize="15" fontWeight="700">{money(activePoint.value)}</text>
          </g>
        )}
      </svg>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 10, overflowX: "auto" }}>
        {["1D", "1W", "1M", "1Y", "Max"].map((item) => <button key={item} onClick={() => setRange(item)} style={{ border: 0, background: range === item ? UI.card2 : "transparent", color: range === item ? UI.text : UI.muted, borderRadius: 999, padding: "8px 13px", fontSize: 15, cursor: "pointer" }}>{item}</button>)}
      </div>
    </Card>
  );
}

function PositionsTable({ allocation, updatePosition, deletePosition, priceMeta }) {
  const isMobile = useIsMobile();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "22px 22px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Holdings</h2>
        <button
          onClick={() => setIsEditing((value) => !value)}
          style={{ border: 0, background: "transparent", color: UI.blue, fontSize: 15, cursor: "pointer" }}
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      {allocation.map((position, index) => {
        const meta = priceMeta[position.ticker] || { status: position.useLivePrice ? "fallback" : "manual" };
        return (
          <div key={position.id} style={{ padding: "16px 22px", borderTop: index ? `1px solid ${UI.border}` : 0 }}>
            {!isEditing ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 13, alignItems: "center", minWidth: 0 }}>
                  <Logo ticker={position.ticker} type={position.type} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 600 }}>{position.ticker}</div>
                    <div style={{ color: UI.muted, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{position.name} · {pct(position.percent)}</div>
                    <div style={{ marginTop: 5, display: "flex", gap: 6, flexWrap: "wrap" }}><StatusPill status={meta.status} /></div>
                  </div>
                </div>
                <div style={{ textAlign: isMobile ? "left" : "right" }}>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>{money(position.value)}</div>
                  <div style={{ color: position.profit >= 0 ? UI.green : UI.red, fontSize: 14 }}>{position.profit >= 0 ? "+" : ""}{money(position.profit)} ({position.profitPercent >= 0 ? "+" : ""}{pct(position.profitPercent)})</div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr repeat(4, minmax(90px, 1fr)) 44px", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                  <Logo ticker={position.ticker} type={position.type} size={38} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{position.ticker}</div>
                    <div style={{ color: UI.muted, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{position.name}</div>
                  </div>
                </div>
                <Input type="number" value={position.shares} onChange={(event) => updatePosition(position.id, "shares", event.target.value)} placeholder="Shares" />
                <Input type="number" value={position.buyPrice} onChange={(event) => updatePosition(position.id, "buyPrice", event.target.value)} placeholder="Avg cost" />
                <Input type="number" value={position.fallbackPrice} onChange={(event) => updatePosition(position.id, "fallbackPrice", event.target.value)} placeholder="Fallback" />
                <Input type="date" value={position.purchaseDate || ""} onChange={(event) => updatePosition(position.id, "purchaseDate", event.target.value)} placeholder="Purchase date" />
                <button onClick={() => deletePosition(position.id)} style={{ border: 0, background: UI.card2, color: UI.red, borderRadius: 12, height: 42, cursor: "pointer" }}>×</button>
              </div>
            )}
          </div>
        );
      })}
    </Card>
  );
}

function AllocationDonut({ allocation, totalValue }) {
  const [activeHolding, setActiveHolding] = useState(null);
  const holdings = allocation
    .filter((position) => position.value > 0)
    .map((position, index) => ({
      name: position.ticker,
      value: position.percent,
      moneyValue: position.value,
      color: COLORS[index % COLORS.length],
    }));

  const selectedHolding = activeHolding || holdings[0];
  const size = 240;
  const stroke = 24;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  // small gap between segments (in px along circumference)
  const GAP = 2; 
  let offset = 0;

  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ margin: "0 0 18px", fontSize: 24, fontWeight: 600 }}>Allocation</h2>
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: size, height: size }} onMouseLeave={() => setActiveHolding(null)}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={UI.card3} strokeWidth={stroke} />
            {holdings.map((item) => {
              const rawDash = (item.value / 100) * circumference;
              const dash = Math.max(rawDash - GAP, 0);
              const isActive = selectedHolding?.name === item.name;

              const circle = (
                <circle
                  key={item.name}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${dash} ${circumference}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  onMouseEnter={() => setActiveHolding(item)}
                  style={{ cursor: "pointer", opacity: selectedHolding && !isActive ? 0.4 : 1, transition: "opacity 0.15s ease" }}
                />
              );
              offset += rawDash;
              return circle;
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", pointerEvents: "none" }}>
            <div>
              <div style={{ color: UI.muted, fontSize: 13 }}>{selectedHolding ? selectedHolding.name : "Total"}</div>
              <div style={{ fontSize: 21, fontWeight: 600 }}>{selectedHolding ? pct(selectedHolding.value) : money(totalValue)}</div>
              {selectedHolding && <div style={{ color: UI.muted, fontSize: 12, marginTop: 3 }}>{money(selectedHolding.moneyValue)}</div>}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          {holdings.map((item) => (
            <div
              key={item.name}
              onMouseEnter={() => setActiveHolding(item)}
              onMouseLeave={() => setActiveHolding(null)}
              style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, gap: 14, padding: "6px 8px", borderRadius: 12, background: selectedHolding?.name === item.name ? `${item.color}18` : "transparent", cursor: "pointer" }}
            >
              <span>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: item.color, display: "inline-block", marginRight: 9 }} />
                {item.name}
              </span>
              <span style={{ textAlign: "right" }}>
                {pct(item.value)}
                <div style={{ color: UI.muted, fontSize: 12 }}>{money(item.moneyValue)}</div>
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function ExposureCard({ title, data }) {
  return <Card style={{ padding: 22 }}><h2 style={{ margin: "0 0 18px", fontSize: 23, fontWeight: 600 }}>{title}</h2>{data.map((item, index) => <div key={item.ticker || item.name} style={{ marginBottom: 14 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}><span>{item.ticker || item.name}</span><span>{pct(item.value)}</span></div><Bar value={item.value} color={COLORS[index % COLORS.length]} /></div>)}</Card>;
}

function getExposure(positions, prices, key) {
  const output = {};
  const total = positions.reduce((sum, position) => sum + positionValue(position, prices), 0);
  if (!total) return [];
  positions.forEach((position) => {
    const ticker = String(position.ticker || "").toUpperCase();
    const weight = (positionValue(position, prices) / total) * 100;
    const etf = ETF_DATA[ticker];
    if (position.type === "ETF" && etf?.[key]) Object.entries(etf[key]).forEach(([name, value]) => { output[name] = (output[name] || 0) + (weight * value) / 100; });
    else {
      const meta = STOCK_META[ticker];
      const name = meta?.[key] || "Unknown";
      output[name] = (output[name] || 0) + weight;
    }
  });
  return Object.entries(output).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

function calculateEtfOverlap(inputs) {
  const normalized = inputs
    .map((item) => ({ ticker: String(item.ticker || "").trim().toUpperCase(), percent: n(item.percent) }))
    .filter((item) => item.ticker && item.percent > 0 && ETF_DATA[item.ticker]?.holdings);

  const contributions = {};
  normalized.forEach((etf) => {
    Object.entries(ETF_DATA[etf.ticker].holdings).forEach(([holding, holdingWeight]) => {
      if (!contributions[holding]) contributions[holding] = [];
      contributions[holding].push({ etf: etf.ticker, contribution: (etf.percent * holdingWeight) / 100 });
    });
  });

  const rows = Object.entries(contributions)
    .map(([holding, sources]) => {
      const total = sources.reduce((sum, source) => sum + source.contribution, 0);
      const duplicated = sources.length > 1 ? total : 0;
      return { holding, sources, total, duplicated };
    })
    .filter((row) => row.sources.length > 1)
    .sort((a, b) => b.duplicated - a.duplicated);

  const totalOverlap = rows.reduce((sum, row) => sum + row.duplicated, 0);
  return { rows, totalOverlap, etfCount: normalized.length };
}

function MetricStrip({ totalValue, totalProfit, totalProfitPercent, riskScore, techExposure, top3Weight, hitRate }) {
  const metrics = [
    { label: "Value", value: money(totalValue), tone: UI.text },
    { label: "Return", value: `${totalProfit >= 0 ? "+" : ""}${money(totalProfit)} · ${totalProfitPercent >= 0 ? "+" : ""}${pct(totalProfitPercent)}`, tone: totalProfit >= 0 ? UI.green : UI.red },
    { label: "Risk", value: `${riskScore}/100`, tone: riskScore >= 70 ? UI.red : riskScore >= 45 ? UI.orange : UI.green },
    { label: "Tech", value: pct(techExposure), tone: UI.cyan },
    { label: "Top 3", value: pct(top3Weight), tone: UI.blue },
    { label: "Hit rate", value: pct(hitRate), tone: UI.green },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 }}>
      {metrics.map((metric) => (
        <Card key={metric.label} style={{ padding: 16, borderRadius: 20, boxShadow: "none" }}>
          <div style={{ color: UI.muted, fontSize: 13, marginBottom: 6 }}>{metric.label}</div>
          <div style={{ color: metric.tone, fontSize: 18, fontWeight: 650, letterSpacing: -0.2 }}>{metric.value}</div>
        </Card>
      ))}
    </div>
  );
}

function LandingPage({ onOpenDashboard, user, onSignOut }) {
  const isMobile = useIsMobile();
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const features = [
    { title: "Portfolio", text: "Valor, rentabilidade e evolução numa vista limpa." },
    { title: "Exposição real", text: "Ações, setores e moeda por baixo dos teus ETFs." },
    { title: "ETF Overlap", text: "Percebe quando estás a repetir as mesmas empresas." },
    { title: "Teses", text: "Notas, scorecards e previsões por ativo." },

    { title: "Predictions", text: "Faz previsões e mede o teu track record ao longo do tempo." },
    { title: "Track Record", text: "Separa skill de sorte com métricas reais de performance." },
    { title: "Target Allocation", text: "Define objetivos e recebe planos claros de rebalanceamento." },
    { title: "Risk Analysis", text: "Analisa concentração, exposição e risco real do portfólio." },
  ];

  return (
    <>
    <GlobalStyles />
    <main style={{ minHeight: "100vh", width: "100vw", background: UI.bg, color: UI.text, fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, Inter, system-ui, sans-serif" }}>
      <div style={{ width: "100%", boxSizing: "border-box", padding: isMobile ? "20px 18px 48px" : "30px 7vw 72px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, marginBottom: isMobile ? 64 : 104, width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <img src="/logo.png" alt="Calibrate" style={{ height: 34, objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {user ? (
              <button onClick={onSignOut} style={{ border: `1px solid ${UI.border}`, borderRadius: 999, background: UI.card, color: UI.text, padding: "10px 15px", fontSize: 15, fontWeight: 650, cursor: "pointer" }}>Sair</button>
            ) : (
              <>
                <button onClick={() => setAuthMode("signin")} style={{ border: `1px solid ${UI.border}`, borderRadius: 999, background: UI.card, color: UI.text, padding: "10px 15px", fontSize: 15, fontWeight: 650, cursor: "pointer" }}>Iniciar sessão</button>
                <button onClick={() => setAuthMode("signup")} style={{ border: 0, borderRadius: 999, background: UI.blue, color: "white", padding: "10px 15px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Criar conta</button>
              </>
            )}
            <button onClick={onOpenDashboard} style={{ border: `1px solid ${UI.border}`, borderRadius: 999, background: UI.text, color: "#000", padding: "10px 16px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Dashboard</button>
          </div>
        </header>

        <section style={{ textAlign: "center", maxWidth: 980, margin: "0 auto", marginBottom: isMobile ? 58 : 86 }}>
          <div style={{ color: UI.blue, fontSize: 14, fontWeight: 700, marginBottom: 18 }}>Personal Investing OS</div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 46 : 76, lineHeight: 0.96, letterSpacing: isMobile ? -2 : -4, fontWeight: 800 }}>
            O teu portfólio,<br />com pensamento por trás.
          </h1>
          <p style={{ color: UI.muted, fontSize: isMobile ? 18 : 21, lineHeight: 1.45, maxWidth: 690, margin: "24px auto 0" }}>
            Acompanha posições, exposição real, targets, overlap de ETFs, teses e previsões — sem ruído, sem complexidade desnecessária.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap", marginTop: 32 }}>
            <button onClick={onOpenDashboard} style={{ border: 0, borderRadius: 999, background: UI.blue, color: "white", padding: "14px 20px", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>Abrir dashboard</button>
            <a href="#features" style={{ textDecoration: "none", borderRadius: 999, background: UI.card, color: UI.text, padding: "14px 20px", fontSize: 16, fontWeight: 650, border: `1px solid ${UI.border}` }}>Ver funcionalidades</a>
          </div>
        </section>

        <section style={{ maxWidth: 1180, margin: "0 auto", marginBottom: isMobile ? 64 : 96 }}>
          <Card style={{ padding: isMobile ? 18 : 22, borderRadius: 28, boxShadow: "0 24px 80px rgba(0,0,0,.45)", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 22 }}>
              <div>
                <div style={{ color: UI.muted, fontSize: 14 }}>Portfolio</div>
                <div style={{ fontSize: isMobile ? 42 : 54, fontWeight: 750, letterSpacing: -2 }}>€5,209</div>
                <div style={{ color: UI.green, marginTop: 4 }}>+€731 · +16.3%</div>
              </div>
              <div style={{ padding: "8px 11px", borderRadius: 999, background: `${UI.green}18`, color: UI.green, fontSize: 13 }}>Live</div>
            </div>
            <svg viewBox="0 0 620 260" preserveAspectRatio="none" style={{ width: "100%", height: isMobile ? 210 : 260, display: "block" }}>
              <defs>
                <linearGradient id="landingFillClean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={UI.green} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={UI.green} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[65, 130, 195].map((y) => <line key={y} x1="0" x2="620" y1={y} y2={y} stroke="rgba(255,255,255,.08)" />)}
              <polygon points="0,240 0,200 80,178 155,190 245,125 320,140 405,84 488,103 555,52 620,75 620,240" fill="url(#landingFillClean)" />
              <polyline points="0,200 80,178 155,190 245,125 320,140 405,84 488,103 555,52 620,75" fill="none" stroke={UI.green} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            </svg>
          </Card>
        </section>

        <section id="features" style={{ marginBottom: isMobile ? 48 : 74 }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <h2 style={{ margin: 0, fontSize: isMobile ? 32 : 44, letterSpacing: -1.6 }}>Feito para investidores que pensam.</h2>
            <p style={{ color: UI.muted, margin: "12px auto 0", maxWidth: 560, lineHeight: 1.5 }}>Menos dashboard decorativa. Mais clareza sobre decisões, risco e alocação.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, minmax(0, 1fr))", gap: 18, maxWidth: 1180, margin: "0 auto" }}>
            {features.map((feature) => (
              <Card
                key={feature.title}
                style={{
                  padding: 22,
                  minHeight: 148,
                  boxShadow: hoveredFeature === feature.title ? "0 30px 80px rgba(0,0,0,.55), 0 8px 20px rgba(0,0,0,.35)" : "none",
                  transform: hoveredFeature === feature.title ? "translateY(-6px)" : "translateY(0)",
                  transition: "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease, background 180ms ease",
                  borderColor: hoveredFeature === feature.title ? "rgba(255,255,255,.16)" : UI.border,
                  background: hoveredFeature === feature.title ? "rgba(34,34,38,0.96)" : UI.card,
                  cursor: "default",
                }}
                onMouseEnter={() => setHoveredFeature(feature.title)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <h3 style={{ margin: "0 0 10px", fontSize: 18, letterSpacing: -0.4 }}>{feature.title}</h3>
                <p style={{ color: UI.muted, lineHeight: 1.5, margin: 0, fontSize: 14 }}>{feature.text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section style={{ textAlign: "center" }}>
          <button onClick={onOpenDashboard} style={{ border: 0, borderRadius: 999, background: UI.text, color: "#000", padding: "15px 22px", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>Entrar no Calibrate</button>
        </section>
      </div>

      {authMode && <AuthModal mode={authMode} setMode={setAuthMode} onClose={() => setAuthMode(null)} />}
    </main>
    </>
  );
}

function AuthModal({ mode, setMode, onClose }) {
  const isSignUp = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAuth() {
    setMessage("");

    if (!email || !password) {
      setMessage("Preenche email e password.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setMessage("As passwords não coincidem.");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
          },
        });

        if (error) throw error;
        setMessage("Conta criada. Verifica o teu email para confirmar a conta.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        setMessage("Sessão iniciada com sucesso.");
        setTimeout(onClose, 700);
      }
    } catch (error) {
      setMessage(error.message || "Ocorreu um erro. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", backdropFilter: "blur(14px)", display: "grid", placeItems: "center", padding: 18, zIndex: 50 }}>
      <Card style={{ width: "100%", maxWidth: 430, padding: 24, borderRadius: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 16, marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 28, letterSpacing: -0.8 }}>{isSignUp ? "Criar conta" : "Iniciar sessão"}</h2>
            <p style={{ color: UI.muted, margin: "8px 0 0", lineHeight: 1.45 }}>
              {isSignUp ? "Guarda o teu portfólio, notas e previsões num perfil próprio." : "Entra para aceder ao teu portfólio em qualquer dispositivo."}
            </p>
          </div>
          <button onClick={onClose} style={{ border: 0, background: UI.card2, color: UI.text, borderRadius: 999, width: 34, height: 34, cursor: "pointer", fontSize: 18 }}>×</button>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {isSignUp && <Input placeholder="Nome" value={name} onChange={(event) => setName(event.target.value)} />}
          <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {isSignUp && <Input type="password" placeholder="Confirmar password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />}
          <button onClick={handleAuth} disabled={loading} style={{ marginTop: 6, border: 0, borderRadius: 16, background: UI.blue, color: "white", padding: "14px 16px", fontSize: 16, fontWeight: 750, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? .7 : 1 }}>
            {loading ? "A processar..." : isSignUp ? "Criar conta" : "Entrar"}
          </button>
        </div>

        {message && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: UI.card2, color: message.toLowerCase().includes("sucesso") || message.toLowerCase().includes("criada") ? UI.green : UI.orange, fontSize: 13, lineHeight: 1.5 }}>
            {message}
          </div>
        )}

        <div style={{ marginTop: 18, textAlign: "center", color: UI.muted, fontSize: 14 }}>
          {isSignUp ? "Já tens conta? " : "Ainda não tens conta? "}
          <button onClick={() => { setMessage(""); setMode(isSignUp ? "signin" : "signup"); }} style={{ border: 0, background: "transparent", color: UI.blue, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {isSignUp ? "Iniciar sessão" : "Criar conta"}
          </button>
        </div>
      </Card>
    </div>
  );
}

function Dashboard({ totalValue, totalProfit, totalProfitPercent, allocation, history, addSnapshot, riskScore, riskLabel, techExposure, top3Weight, hitRate, updatePosition, deletePosition, priceMeta }) {
  const isMobile = useIsMobile();

  return (
    <>
      <MetricStrip totalValue={totalValue} totalProfit={totalProfit} totalProfitPercent={totalProfitPercent} riskScore={riskScore} techExposure={techExposure} top3Weight={top3Weight} hitRate={hitRate} />
      <section style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.45fr) minmax(310px, .85fr)", gap: 16 }}>
      <div style={{ display: "grid", gap: 16 }}>
        <PortfolioChart history={history} totalValue={totalValue} addSnapshot={addSnapshot} />
        <PositionsTable allocation={allocation} updatePosition={updatePosition} deletePosition={deletePosition} priceMeta={priceMeta} />
      </div>
      <div style={{ display: "grid", gap: 16 }}>
        <AllocationDonut allocation={allocation} totalValue={totalValue} />
        <Card style={{ padding: 22 }}>
          <h2 style={{ margin: "0 0 14px", fontSize: 23, fontWeight: 600 }}>Risk</h2>
          <div style={{ fontSize: 36, fontWeight: 700, color: riskLabel === "High" ? UI.red : riskLabel === "Medium" ? UI.orange : UI.green }}>{riskScore}/100</div>
          <div style={{ color: UI.muted, margin: "6px 0 14px" }}>{riskLabel} risk</div>
          <Bar value={riskScore} color={riskLabel === "High" ? UI.red : riskLabel === "Medium" ? UI.orange : UI.green} />
          <p style={{ color: UI.muted, lineHeight: 1.6 }}>Top 3: {pct(top3Weight)}<br />Tech: {pct(techExposure)}<br />Hit rate: {pct(hitRate)}</p>
          <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: UI.card2, color: UI.muted, fontSize: 13, lineHeight: 1.5 }}>
            Risk combines concentration, top holding weight and tech exposure. Hit rate is closed predictions marked as Hit divided by all closed predictions.
          </div>
        </Card>
      </div>
      </section>
    </>
  );
}

function PortfolioPanel({ form, setForm, addPosition, allocation, updatePosition, deletePosition, priceMeta }) {
  const existing = allocation.find((position) => position.ticker === form.ticker.trim().toUpperCase());
  const addedShares = n(form.shares);
  const addedPrice = n(form.buyPrice || form.fallbackPrice || existing?.currentPrice || 0);
  const existingShares = existing ? n(existing.shares) : 0;
  const existingAverage = existing ? n(existing.buyPrice) : 0;
  const newShares = existingShares + addedShares;
  const newAverage = newShares ? ((existingShares * existingAverage) + (addedShares * addedPrice)) / newShares : 0;
  const isAverageDown = existing && addedShares > 0 && addedPrice < existingAverage;

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <Card style={{ padding: 22 }}>
        <h2 style={{ marginTop: 0 }}>Add Holding</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
          <Input placeholder="Ticker" value={form.ticker} onChange={(event) => setForm({ ...form, ticker: event.target.value })} />
          <Input placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Stock</option><option>ETF</option><option>Crypto</option><option>Cash</option></Select>
          <Input type="number" placeholder="Shares" value={form.shares} onChange={(event) => setForm({ ...form, shares: event.target.value })} />
          <Input type="number" placeholder="Buy price" value={form.buyPrice} onChange={(event) => setForm({ ...form, buyPrice: event.target.value })} />
          <Input type="number" placeholder="Fallback price" value={form.fallbackPrice} onChange={(event) => setForm({ ...form, fallbackPrice: event.target.value })} />
          <Input type="date" placeholder="Purchase date" value={form.purchaseDate} onChange={(event) => setForm({ ...form, purchaseDate: event.target.value })} />
          <button onClick={addPosition} style={{ border: 0, borderRadius: 14, background: UI.blue, color: "white", fontSize: 15, cursor: "pointer" }}>{existing ? "Add to Position" : "Add"}</button>
        </div>
        {existing && addedShares > 0 && (
          <div style={{ marginTop: 14, padding: 16, borderRadius: 18, background: UI.card2 }}>
            <div style={{ color: UI.muted, fontSize: 14, marginBottom: 8 }}>Average down preview</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              <div><div style={{ color: UI.muted, fontSize: 13 }}>Current avg</div><div>{money(existingAverage, 2)}</div></div>
              <div><div style={{ color: UI.muted, fontSize: 13 }}>Add price</div><div>{money(addedPrice, 2)}</div></div>
              <div><div style={{ color: UI.muted, fontSize: 13 }}>New avg</div><div style={{ color: isAverageDown ? UI.green : UI.text }}>{money(newAverage, 2)}</div></div>
              <div><div style={{ color: UI.muted, fontSize: 13 }}>New shares</div><div>{newShares.toFixed(4)}</div></div>
            </div>
          </div>
        )}
      </Card>
      <PositionsTable allocation={allocation} updatePosition={updatePosition} deletePosition={deletePosition} priceMeta={priceMeta} />
    </section>
  );
}

function OverlapPanel({ overlapInputs, setOverlapInputs }) {
  const result = useMemo(() => calculateEtfOverlap(overlapInputs), [overlapInputs]);

  return (
    <section style={{ display: "grid", gridTemplateColumns: "minmax(320px, .8fr) minmax(0, 1.2fr)", gap: 16 }}>
      <Card style={{ padding: 22 }}>
        <h2 style={{ marginTop: 0 }}>ETF Overlap</h2>
        <p style={{ color: UI.muted, lineHeight: 1.5 }}>Add the ETFs and target weights you want to compare. The app estimates which underlying stocks are repeated across ETFs.</p>
        {overlapInputs.map((item) => (
          <div key={item.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 42px", gap: 8, marginBottom: 8 }}>
            <Input value={item.ticker} placeholder="ETF" onChange={(event) => setOverlapInputs((current) => current.map((x) => x.id === item.id ? { ...x, ticker: event.target.value.toUpperCase() } : x))} />
            <Input type="number" value={item.percent} placeholder="%" onChange={(event) => setOverlapInputs((current) => current.map((x) => x.id === item.id ? { ...x, percent: event.target.value } : x))} />
            <button onClick={() => setOverlapInputs((current) => current.filter((x) => x.id !== item.id))} style={{ border: 0, borderRadius: 14, background: UI.card2, color: UI.red, cursor: "pointer" }}>×</button>
          </div>
        ))}
        <button onClick={() => setOverlapInputs((current) => [...current, { id: Date.now(), ticker: "", percent: "" }])} style={{ marginTop: 8, border: 0, borderRadius: 14, background: UI.blue, color: "white", padding: "12px 14px", cursor: "pointer" }}>Add ETF</button>
      </Card>

      <Card style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "start", marginBottom: 18 }}>
          <div>
            <h2 style={{ margin: 0 }}>Overlap Result</h2>
            <div style={{ color: UI.muted, marginTop: 4 }}>{result.etfCount} ETFs compared</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: UI.muted, fontSize: 13 }}>Duplicated exposure</div>
            <div style={{ color: result.totalOverlap > 50 ? UI.orange : UI.green, fontSize: 28, fontWeight: 700 }}>{pct(result.totalOverlap)}</div>
          </div>
        </div>
        {result.rows.slice(0, 12).map((row) => (
          <div key={row.holding} style={{ padding: "12px 0", borderTop: `1px solid ${UI.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontWeight: 650 }}>{row.holding}</span>
              <span>{pct(row.total)}</span>
            </div>
            <div style={{ color: UI.muted, fontSize: 13 }}>{row.sources.map((source) => `${source.etf}: ${pct(source.contribution)}`).join(" · ")}</div>
          </div>
        ))}
        {!result.rows.length && <div style={{ color: UI.muted }}>No overlap detected with the available ETF holdings data.</div>}
      </Card>
    </section>
  );
}

function TargetsPanel({ targets, setTargets, targetForm, setTargetForm, targetSum, targetTotal, setTargetTotal, cashToInvest, setCashToInvest, rebalancePlan }) {
  return <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 16 }}><Card style={{ padding: 22 }}><h2 style={{ marginTop: 0 }}>Target Allocation</h2><Input type="number" value={targetTotal} onChange={(event) => setTargetTotal(event.target.value)} placeholder="Target total value" style={{ marginBottom: 10 }} /><Input type="number" value={cashToInvest} onChange={(event) => setCashToInvest(event.target.value)} placeholder="New cash to invest" style={{ marginBottom: 10 }} /><div style={{ display: "grid", gridTemplateColumns: "1fr 90px 70px", gap: 8, marginBottom: 12 }}><Input placeholder="Ticker" value={targetForm.ticker} onChange={(event) => setTargetForm({ ...targetForm, ticker: event.target.value })} /><Input type="number" placeholder="%" value={targetForm.percent} onChange={(event) => setTargetForm({ ...targetForm, percent: event.target.value })} /><button onClick={() => { const ticker = targetForm.ticker.trim().toUpperCase(); if (!ticker) return; setTargets((current) => [...current, { id: Date.now(), ticker, percent: targetForm.percent || "0" }]); setTargetForm({ ticker: "", percent: "" }); }} style={{ border: 0, borderRadius: 14, background: UI.blue, color: "white" }}>Add</button></div>{targets.map((target) => <div key={target.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 40px", gap: 8, marginBottom: 8 }}><Input value={target.ticker} onChange={(event) => setTargets((current) => current.map((item) => item.id === target.id ? { ...item, ticker: event.target.value.toUpperCase() } : item))} /><Input type="number" value={target.percent} onChange={(event) => setTargets((current) => current.map((item) => item.id === target.id ? { ...item, percent: event.target.value } : item))} /><button onClick={() => setTargets((current) => current.filter((item) => item.id !== target.id))} style={{ border: 0, borderRadius: 14, background: UI.card2, color: UI.red }}>×</button></div>)}<div style={{ color: targetSum === 100 ? UI.green : UI.orange, marginTop: 12 }}>Total target: {pct(targetSum)}</div></Card><Card style={{ padding: 22 }}><h2 style={{ marginTop: 0 }}>Plan</h2>{rebalancePlan.map((item) => <div key={item.id} style={{ padding: "14px 0", borderBottom: `1px solid ${UI.border}` }}><div style={{ display: "flex", justifyContent: "space-between" }}><span>{item.ticker}</span><span>{money(item.desiredValue)}</span></div><div style={{ color: item.difference >= 0 ? UI.green : UI.red }}>{item.difference >= 0 ? "+" : ""}{money(item.difference)} vs current</div><div style={{ color: UI.blue }}>New cash: {money(item.newCashAmount)}</div></div>)}</Card></section>;
}

function PredictionsPanel({ predictions, setPredictions, predictionForm, setPredictionForm, hitRate }) {
  return <section style={{ display: "grid", gap: 16 }}><Card style={{ padding: 22 }}><h2 style={{ marginTop: 0 }}>Predictions</h2><div style={{ color: UI.muted, marginBottom: 12 }}>Hit rate: <span style={{ color: UI.green }}>{pct(hitRate)}</span></div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}><Input placeholder="Ticker" value={predictionForm.ticker} onChange={(event) => setPredictionForm({ ...predictionForm, ticker: event.target.value })} /><Input placeholder="Claim" value={predictionForm.claim} onChange={(event) => setPredictionForm({ ...predictionForm, claim: event.target.value })} /><Input type="number" placeholder="Confidence" value={predictionForm.confidence} onChange={(event) => setPredictionForm({ ...predictionForm, confidence: event.target.value })} /><Input type="number" placeholder="Expected return" value={predictionForm.expectedReturn} onChange={(event) => setPredictionForm({ ...predictionForm, expectedReturn: event.target.value })} /><Input placeholder="Horizon" value={predictionForm.horizon} onChange={(event) => setPredictionForm({ ...predictionForm, horizon: event.target.value })} /><button onClick={() => { const ticker = predictionForm.ticker.toUpperCase().trim(); if (!ticker || !predictionForm.claim) return; setPredictions((current) => [...current, { id: Date.now(), ...predictionForm, ticker, status: "Open", actualReturn: "", result: "" }]); setPredictionForm({ ticker: "", claim: "", confidence: "60", expectedReturn: "", horizon: "12 months" }); }} style={{ border: 0, borderRadius: 14, background: UI.blue, color: "white" }}>Add</button></div></Card>{predictions.map((prediction) => <Card key={prediction.id} style={{ padding: 18 }}><div style={{ color: UI.green }}>{prediction.ticker}</div><p style={{ fontSize: 17 }}>{prediction.claim}</p><p style={{ color: UI.muted }}>Confidence {pct(prediction.confidence)} · Expected {pct(prediction.expectedReturn)} · {prediction.horizon}</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}><Select value={prediction.status} onChange={(event) => setPredictions((current) => current.map((item) => item.id === prediction.id ? { ...item, status: event.target.value } : item))}><option>Open</option><option>Closed</option></Select><Input type="number" placeholder="Actual return" value={prediction.actualReturn} onChange={(event) => setPredictions((current) => current.map((item) => item.id === prediction.id ? { ...item, actualReturn: event.target.value } : item))} /><Select value={prediction.result} onChange={(event) => setPredictions((current) => current.map((item) => item.id === prediction.id ? { ...item, result: event.target.value } : item))}><option value="">Result</option><option>Hit</option><option>Miss</option></Select><button onClick={() => setPredictions((current) => current.filter((item) => item.id !== prediction.id))} style={{ border: 0, borderRadius: 14, background: UI.card2, color: UI.red }}>Delete</button></div></Card>)}</section>;
}

function NotesPanel({ tickers, selectedTicker, setSelectedTicker, notes, setNotes, scores, setScores }) {
  const score = scores[selectedTicker] || { moat: 0, management: 0, growth: 0, valuation: 0, balance: 0, risk: 0, conviction: 0 };
  const average = Object.values(score).reduce((sum, value) => sum + n(value), 0) / 7;
  const updateScore = (field, value) => setScores((current) => ({ ...current, [selectedTicker]: { ...score, [field]: Number(value) } }));
  const Slider = ({ label, field }) => <div style={{ marginBottom: 13 }}><div style={{ display: "flex", justifyContent: "space-between", color: UI.muted, fontSize: 14 }}><span>{label}</span><span>{score[field]}/10</span></div><input type="range" min="0" max="10" value={score[field]} onChange={(event) => updateScore(field, event.target.value)} style={{ width: "100%" }} /></div>;
  return <section style={{ display: "grid", gap: 16 }}><Card style={{ padding: 22 }}><h2 style={{ marginTop: 0 }}>Thesis & Scorecard</h2><div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>{tickers.map((ticker) => <button key={ticker} onClick={() => setSelectedTicker(ticker)} style={{ border: 0, borderRadius: 999, padding: "9px 14px", background: selectedTicker === ticker ? UI.text : UI.card2, color: selectedTicker === ticker ? UI.bg : UI.text }}>{ticker}</button>)}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(330px, 100%), 1fr))", gap: 16 }}><textarea value={notes[selectedTicker] || ""} onChange={(event) => setNotes((current) => ({ ...current, [selectedTicker]: event.target.value }))} style={{ minHeight: 360, border: 0, borderRadius: 18, background: UI.card2, color: UI.text, padding: 16, fontSize: 16, lineHeight: 1.6 }} /><div style={{ background: UI.card2, borderRadius: 18, padding: 18 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18 }}><span>Overall Score</span><span style={{ color: UI.green, fontSize: 26, fontWeight: 700 }}>{average.toFixed(1)}/10</span></div><Slider label="Moat" field="moat" /><Slider label="Management" field="management" /><Slider label="Growth" field="growth" /><Slider label="Valuation" field="valuation" /><Slider label="Balance Sheet" field="balance" /><Slider label="Risk" field="risk" /><Slider label="Conviction" field="conviction" /></div></div></Card></section>;
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [cloudReady, setCloudReady] = useState(false);
  const isMobile = useIsMobile();
  const saved = useMemo(() => loadState(), []);
  const [positions, setPositions] = useState(saved?.positions || DEFAULT_POSITIONS);
  const [targets, setTargets] = useState(saved?.targets || DEFAULT_TARGETS);
  const [notes, setNotes] = useState(saved?.notes || DEFAULT_NOTES);
  const [scores, setScores] = useState(saved?.scores || DEFAULT_SCORES);
  const [predictions, setPredictions] = useState(saved?.predictions || DEFAULT_PREDICTIONS);
  const [prices, setPrices] = useState({ ...FALLBACK_PRICES, ...(saved?.prices || {}) });
  const [priceMeta, setPriceMeta] = useState(saved?.priceMeta || {});
  const initialTotal = DEFAULT_POSITIONS.reduce((sum, position) => sum + positionValue(position, FALLBACK_PRICES), 0);
  const [history, setHistory] = useState(saved?.history || createHistory(initialTotal));
  const [activeTab, setActiveTab] = useState(saved?.activeTab || "Home");
  const [selectedTicker, setSelectedTicker] = useState(saved?.selectedTicker || "AMZN");
  const [form, setForm] = useState({ ticker: "", name: "", type: "Stock", shares: "", buyPrice: "", fallbackPrice: "", purchaseDate: todayKey(), useLivePrice: true });
  const [overlapInputs, setOverlapInputs] = useState(saved?.overlapInputs || [
    { id: 1, ticker: "SXR8", percent: "50" },
    { id: 2, ticker: "SXRV", percent: "50" },
  ]);
  const [targetForm, setTargetForm] = useState({ ticker: "", percent: "" });
  const [targetTotal, setTargetTotal] = useState(saved?.targetTotal || "7000");
  const [cashToInvest, setCashToInvest] = useState(saved?.cashToInvest || "500");
  const [predictionForm, setPredictionForm] = useState({ ticker: "", claim: "", confidence: "60", expectedReturn: "", horizon: "12 months" });
  const [priceStatus, setPriceStatus] = useState("Using fallback prices");

  const totalValue = useMemo(() => positions.reduce((sum, position) => sum + positionValue(position, prices), 0), [positions, prices]);
  const totalCost = useMemo(() => positions.reduce((sum, position) => sum + positionCost(position), 0), [positions]);
  const totalProfit = totalValue - totalCost;
  const totalProfitPercent = totalCost ? (totalProfit / totalCost) * 100 : 0;
  const chartHistory = useMemo(() => buildPortfolioHistoryFromPurchaseDates(positions, prices), [positions, prices]);

  const allocation = useMemo(() => positions.map((position) => {
    const value = positionValue(position, prices);
    const cost = positionCost(position);
    const profit = value - cost;
    return { ...position, ticker: String(position.ticker).toUpperCase(), currentPrice: getPrice(position, prices), value, cost, profit, profitPercent: cost ? (profit / cost) * 100 : 0, percent: totalValue ? (value / totalValue) * 100 : 0 };
  }).sort((a, b) => b.percent - a.percent), [positions, prices, totalValue]);

  const stockExposure = useMemo(() => {
    const output = {};
    allocation.forEach((position) => {
      const etf = ETF_DATA[position.ticker];
      if (position.type === "ETF" && etf?.holdings) Object.entries(etf.holdings).forEach(([ticker, value]) => { output[ticker] = (output[ticker] || 0) + (position.percent * value) / 100; });
      else output[position.ticker] = (output[position.ticker] || 0) + position.percent;
    });
    return Object.entries(output).map(([ticker, value]) => ({ ticker, value })).sort((a, b) => b.value - a.value);
  }, [allocation]);

  const sectorExposure = useMemo(() => getExposure(positions, prices, "sector"), [positions, prices]);
  const currencyExposure = useMemo(() => getExposure(positions, prices, "currency"), [positions, prices]);
  const top3Weight = allocation.slice(0, 3).reduce((sum, position) => sum + position.percent, 0);
  const techExposure = sectorExposure.find((item) => item.name === "Technology")?.value || 0;
  const riskScore = Math.min(100, Math.round(top3Weight * 0.55 + techExposure * 0.35 + (allocation[0]?.percent || 0) * 0.4));
  const riskLabel = riskScore >= 70 ? "High" : riskScore >= 45 ? "Medium" : "Low";
  const tickers = [...new Set([...positions.map((position) => position.ticker.toUpperCase()), ...targets.map((target) => target.ticker.toUpperCase()), ...predictions.map((prediction) => prediction.ticker.toUpperCase())])];
  const closedPredictions = predictions.filter((prediction) => prediction.status === "Closed");
  const hitRate = closedPredictions.length ? (closedPredictions.filter((prediction) => prediction.result === "Hit").length / closedPredictions.length) * 100 : 0;

  const currentByTicker = useMemo(() => {
    const map = {};
    allocation.forEach((position) => { map[position.ticker] = (map[position.ticker] || 0) + position.value; });
    return map;
  }, [allocation]);

  const targetSum = targets.reduce((sum, target) => sum + n(target.percent), 0);
  const rebalancePlan = targets.map((target) => {
    const targetPercent = n(target.percent);
    const desiredValue = n(targetTotal) * targetPercent / 100;
    const currentValue = currentByTicker[target.ticker] || 0;
    return { ...target, targetPercent, desiredValue, currentValue, difference: desiredValue - currentValue, newCashAmount: n(cashToInvest) * targetPercent / 100 };
  }).sort((a, b) => b.targetPercent - a.targetPercent);

  useEffect(() => {
    const data = getPortfolioData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    if (!user || !cloudReady) return;

    const timer = setTimeout(() => {
      savePortfolioToCloud(data);
    }, 700);

    return () => clearTimeout(timer);
  }, [positions, targets, notes, scores, predictions, prices, priceMeta, history, activeTab, selectedTicker, targetTotal, cashToInvest, overlapInputs, user, cloudReady]);

  useEffect(() => {
    setHistory((current) => {
      const date = todayKey();
      const last = current[current.length - 1];
      if (last?.date === date) return current.map((item, index) => index === current.length - 1 ? { ...item, value: totalValue } : item);
      return [...current, { date, value: totalValue }].slice(-500);
    });
  }, [totalValue]);

  useEffect(() => {
    refreshPrices();
    const timer = setInterval(refreshPrices, 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setCloudReady(false);
      return;
    }

    let cancelled = false;

    async function loadCloudPortfolio() {
      const { data, error } = await supabase
        .from("portfolios")
        .select("id,data")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("Failed to load cloud portfolio", error);
        setCloudReady(true);
        return;
      }

      if (data?.data) {
        applyPortfolioData(data.data);
      } else {
        await savePortfolioToCloud(getPortfolioData());
      }

      setCloudReady(true);
    }

    loadCloudPortfolio();

    return () => {
      cancelled = true;
    };
  }, [user]);

  function getPortfolioData() {
    return { positions, targets, notes, scores, predictions, prices, priceMeta, history, activeTab, selectedTicker, targetTotal, cashToInvest, overlapInputs };
  }

  function applyPortfolioData(data) {
    if (data.positions) setPositions(data.positions);
    if (data.targets) setTargets(data.targets);
    if (data.notes) setNotes(data.notes);
    if (data.scores) setScores(data.scores);
    if (data.predictions) setPredictions(data.predictions);
    if (data.prices) setPrices(data.prices);
    if (data.priceMeta) setPriceMeta(data.priceMeta);
    if (data.history) setHistory(data.history);
    if (data.activeTab) setActiveTab(data.activeTab);
    if (data.selectedTicker) setSelectedTicker(data.selectedTicker);
    if (data.targetTotal) setTargetTotal(data.targetTotal);
    if (data.cashToInvest) setCashToInvest(data.cashToInvest);
    if (data.overlapInputs) setOverlapInputs(data.overlapInputs);
  }

  async function savePortfolioToCloud(data) {
    if (!user) return;

    const { data: existing, error: selectError } = await supabase
      .from("portfolios")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (selectError) {
      console.error("Cloud select error", selectError);
      return;
    }

    if (existing?.id) {
      const { error } = await supabase
        .from("portfolios")
        .update({ data, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) console.error("Cloud update error", error);
    } else {
      const { error } = await supabase
        .from("portfolios")
        .insert({ user_id: user.id, data, updated_at: new Date().toISOString() });
      if (error) console.error("Cloud insert error", error);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setUser(null);
    setCloudReady(false);
  }

  async function refreshPrices() {
    setPriceStatus("Refreshing prices...");
    const next = { ...prices };
    const meta = { ...priceMeta };
    let updated = 0;
    await Promise.all([...new Map(positions.map((position) => [position.ticker.toUpperCase(), position])).values()].map(async (position) => {
      const ticker = position.ticker.toUpperCase();
      if (!position.useLivePrice) {
        meta[ticker] = { status: "manual", updatedAt: new Date().toLocaleTimeString() };
        return;
      }
      try {
        next[ticker] = await fetchYahooPrice(ticker, position.type);
        meta[ticker] = { status: "live", updatedAt: new Date().toLocaleTimeString() };
        updated += 1;
      } catch {
        meta[ticker] = { status: next[ticker] ? "fallback" : "error", updatedAt: new Date().toLocaleTimeString() };
      }
    }));
    setPrices(next);
    setPriceMeta(meta);
    setPriceStatus(updated ? `Updated ${updated} live price${updated === 1 ? "" : "s"}` : "Live data blocked; using fallback prices");
  }

  function addPosition() {
    const ticker = form.ticker.trim().toUpperCase();
    if (!ticker || n(form.shares) <= 0) return;
    const fallback = prices[ticker] || FALLBACK_PRICES[ticker] || n(form.fallbackPrice) || n(form.buyPrice);
    setPositions((current) => {
      const existing = current.find((position) => position.ticker.toUpperCase() === ticker);
      if (!existing) {
        return [...current, { id: Date.now(), ticker, name: form.name || STOCK_META[ticker]?.name || ETF_DATA[ticker]?.name || ticker, type: form.type, shares: form.shares, buyPrice: form.buyPrice || String(fallback), fallbackPrice: form.fallbackPrice || String(fallback), purchaseDate: form.purchaseDate || todayKey(), useLivePrice: form.useLivePrice, conviction: undefined }];
      }
      const existingShares = n(existing.shares);
      const addedShares = n(form.shares);
      const existingAverage = n(existing.buyPrice);
      const addedPrice = n(form.buyPrice || form.fallbackPrice || fallback);
      const newShares = existingShares + addedShares;
      const newAverage = newShares ? ((existingShares * existingAverage) + (addedShares * addedPrice)) / newShares : existingAverage;
      return current.map((position) => position.id === existing.id ? { ...position, shares: String(newShares), buyPrice: String(newAverage), fallbackPrice: form.fallbackPrice || position.fallbackPrice, purchaseDate: position.purchaseDate || form.purchaseDate || todayKey(), useLivePrice: form.useLivePrice, conviction: position.conviction } : position);
    });
    setTargets((current) => current.some((target) => target.ticker.toUpperCase() === ticker) ? current : [...current, { id: Date.now() + 1, ticker, percent: "0" }]);
    setForm({ ticker: "", name: "", type: "Stock", shares: "", buyPrice: "", fallbackPrice: "", purchaseDate: todayKey(), useLivePrice: true });
  }

  function updatePosition(id, field, value) { setPositions((current) => current.map((position) => position.id === id ? { ...position, [field]: value } : position)); }
  function deletePosition(id) { setPositions((current) => current.filter((position) => position.id !== id)); }
  function addSnapshot() { setHistory((current) => [...current.filter((item) => item.date !== todayKey()), { date: todayKey(), value: totalValue }].slice(-500)); }
  function resetAll() { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }

  const nav = ["Home", "Portfolio", "Exposure", "ETF Overlap", "Targets", "Predictions", "Notes"];

  if (screen === "landing") {
    return <LandingPage onOpenDashboard={() => setScreen("dashboard")} user={user} onSignOut={handleSignOut} />;
  }

  return (
    <>
    <GlobalStyles />
    <main style={{ minHeight: "100vh", width: "100vw", background: UI.bg, color: UI.text, fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, Inter, system-ui, sans-serif", padding: isMobile ? "14px 12px 34px" : "24px 16px 48px" }}>
      <div style={{ width: "100%", maxWidth: "1540px", margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap", marginBottom: 22, flexDirection: isMobile ? "column" : "row" }}>
          <div onClick={() => setScreen("landing")} style={{ cursor: "pointer" }}>
            <img src="/logo.png" alt="Calibrate" style={{ height: 42, objectFit: "contain" }} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: UI.muted, fontSize: 14 }}>Total</div>
            <div style={{ fontSize: 30, fontWeight: 700 }}>{money(totalValue)}</div>
            <div style={{ color: totalProfit >= 0 ? UI.green : UI.red, fontSize: 16 }}>{totalProfit >= 0 ? "+" : ""}{money(totalProfit)} ({totalProfitPercent >= 0 ? "+" : ""}{pct(totalProfitPercent)})</div>
          </div>
        </header>

        <nav style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 18, paddingBottom: 2 }}>
          {nav.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} style={{ border: 0, borderRadius: 999, padding: "9px 14px", whiteSpace: "nowrap", background: activeTab === tab ? UI.text : UI.card, color: activeTab === tab ? "#000000" : UI.text, fontSize: 15, cursor: "pointer" }}>{tab}</button>)}
          <button onClick={refreshPrices} style={{ border: 0, borderRadius: 999, padding: "9px 14px", background: UI.card, color: UI.blue, whiteSpace: "nowrap", cursor: "pointer" }}>Refresh</button>
          <button onClick={resetAll} style={{ border: 0, borderRadius: 999, padding: "9px 14px", background: UI.card, color: UI.red, whiteSpace: "nowrap", cursor: "pointer" }}>Reset</button>
        </nav>
        <div style={{ color: UI.muted, fontSize: 13, marginBottom: 14 }}>{user ? `Signed in · Cloud sync ${cloudReady ? "active" : "loading"}` : "Not signed in · using local storage"} · {priceStatus}</div>

        {activeTab === "Home" && <Dashboard totalValue={totalValue} totalProfit={totalProfit} totalProfitPercent={totalProfitPercent} allocation={allocation} history={chartHistory} addSnapshot={addSnapshot} riskScore={riskScore} riskLabel={riskLabel} techExposure={techExposure} top3Weight={top3Weight} hitRate={hitRate} updatePosition={updatePosition} deletePosition={deletePosition} priceMeta={priceMeta} />}
        {activeTab === "Portfolio" && <PortfolioPanel form={form} setForm={setForm} addPosition={addPosition} allocation={allocation} updatePosition={updatePosition} deletePosition={deletePosition} priceMeta={priceMeta} />}
        {activeTab === "Exposure" && <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 16 }}><AllocationDonut allocation={allocation} totalValue={totalValue} /><ExposureCard title="Stock Exposure" data={stockExposure} /><ExposureCard title="Sector Exposure" data={sectorExposure} /><ExposureCard title="Currency Exposure" data={currencyExposure} /></section>}
        {activeTab === "ETF Overlap" && <OverlapPanel overlapInputs={overlapInputs} setOverlapInputs={setOverlapInputs} />}
        {activeTab === "Targets" && <TargetsPanel targets={targets} setTargets={setTargets} targetForm={targetForm} setTargetForm={setTargetForm} targetSum={targetSum} targetTotal={targetTotal} setTargetTotal={setTargetTotal} cashToInvest={cashToInvest} setCashToInvest={setCashToInvest} rebalancePlan={rebalancePlan} />}
        {activeTab === "Predictions" && <PredictionsPanel predictions={predictions} setPredictions={setPredictions} predictionForm={predictionForm} setPredictionForm={setPredictionForm} hitRate={hitRate} />}
        {activeTab === "Notes" && <NotesPanel tickers={tickers} selectedTicker={selectedTicker} setSelectedTicker={setSelectedTicker} notes={notes} setNotes={setNotes} scores={scores} setScores={setScores} />}
      </div>
    </main>
    </>
  );
}
