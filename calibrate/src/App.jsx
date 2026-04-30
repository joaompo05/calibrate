import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "calibrate_apple_stocks_v1";

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
  blue: "#0a84ff",
  orange: "#ff9f0a",
  purple: "#bf5af2",
  cyan: "#64d2ff",
  border: "rgba(255,255,255,0.08)",
};

const UI = {
  ...CLASSIC_UI,
  bg: "radial-gradient(circle at top left, rgba(10,132,255,0.18), transparent 28%), #000000",
  card: "rgba(28,28,30,0.92)",
  card2: "rgba(44,44,46,0.94)",
  card3: "#3a3a3c",
  border: "rgba(255,255,255,0.075)",
  shadow: "0 18px 50px rgba(0,0,0,0.32)",
};

const COLORS = [UI.blue, UI.green, UI.cyan, UI.purple, UI.orange, UI.red, "#5e5ce6", "#8e8e93"];

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
  COIN: "https://logo.clearbit.com/coinbase.com",
  AAPL: "https://logo.clearbit.com/apple.com",
  MSFT: "https://logo.clearbit.com/microsoft.com",
  NVDA: "https://logo.clearbit.com/nvidia.com",
  META: "https://logo.clearbit.com/meta.com",
  TSLA: "https://logo.clearbit.com/tesla.com",
  SXR8: "https://logo.clearbit.com/ishares.com",
  SXRV: "https://logo.clearbit.com/ishares.com",
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
  { id: 1, ticker: "SXR8", name: "iShares Core S&P 500", type: "ETF", shares: "4.2", buyPrice: "520", fallbackPrice: "595", useLivePrice: true, conviction: "High" },
  { id: 2, ticker: "SXRV", name: "iShares NASDAQ 100", type: "ETF", shares: "2.4", buyPrice: "610", fallbackPrice: "675", useLivePrice: true, conviction: "High" },
  { id: 3, ticker: "AMZN", name: "Amazon", type: "Stock", shares: "3", buyPrice: "170", fallbackPrice: "200", useLivePrice: true, conviction: "High" },
  { id: 4, ticker: "COIN", name: "Coinbase", type: "Stock", shares: "2", buyPrice: "160", fallbackPrice: "245", useLivePrice: true, conviction: "Exploratory" },
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

function Card({ children, style }) {
  return (
    <div
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
  const provider = ETF_DATA[cleanTicker]?.provider;
  const isETF = type === "ETF";
  const fallbackLabel = isETF ? provider || cleanTicker : cleanTicker;

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
      title={isETF ? `${cleanTicker} · ${provider || "ETF"}` : cleanTicker}
    >
      {source && !failed ? (
        <img
          src={source}
          alt={cleanTicker}
          onError={() => setFailed(true)}
          style={{
            width: isETF ? "82%" : "72%",
            height: isETF ? "82%" : "72%",
            objectFit: "contain",
            borderRadius: 8,
            background: isETF ? "white" : "transparent",
            padding: isETF ? 3 : 0,
          }}
        />
      ) : (
        <span
          style={{
            fontWeight: 700,
            fontSize: isETF ? Math.max(size * 0.22, 10) : Math.max(size * 0.24, 10),
            color: isETF ? UI.blue : UI.text,
            letterSpacing: -0.2,
          }}
        >
          {fallbackLabel}
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

function ConvictionPill({ conviction }) {
  const normalized = conviction || "Medium";
  const color = normalized === "High" ? UI.green : normalized === "Exploratory" ? UI.orange : UI.blue;
  return <span style={{ color, fontSize: 12, padding: "4px 8px", background: `${color}18`, borderRadius: 999 }}>{normalized}</span>;
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
          <div style={{ fontSize: "clamp(42px, 7vw, 66px)", fontWeight: 600, letterSpacing: -2, marginTop: 4 }}>{money(displayedValue)}</div>
          <div style={{ color: positive ? UI.green : UI.red, fontSize: 17, marginTop: 6 }}>{positive ? "+" : ""}{money(change)} ({positive ? "+" : ""}{pct(changePct)})</div>
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
                    <div style={{ marginTop: 5, display: "flex", gap: 6, flexWrap: "wrap" }}><StatusPill status={meta.status} /><ConvictionPill conviction={position.conviction} /></div>
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
                <Select value={position.conviction || "Medium"} onChange={(event) => updatePosition(position.id, "conviction", event.target.value)}>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Exploratory</option>
                </Select>
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
  let offset = 0;

  return (
    <Card style={{ padding: 22 }}>
      <h2 style={{ margin: "0 0 18px", fontSize: 24, fontWeight: 600 }}>Allocation</h2>
      <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: size, height: size }} onMouseLeave={() => setActiveHolding(null)}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={UI.card3} strokeWidth={stroke} />
            {holdings.map((item) => {
              const dash = (item.value / 100) * circumference;
              const isActive = selectedHolding?.name === item.name;
              const circle = (
                <circle
                  key={item.name}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={isActive ? stroke + 5 : stroke}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  onMouseEnter={() => setActiveHolding(item)}
                  style={{ cursor: "pointer", opacity: selectedHolding && !isActive ? 0.45 : 1, transition: "all 0.15s ease" }}
                />
              );
              offset += dash;
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
          <Select value={form.conviction || "Medium"} onChange={(event) => setForm({ ...form, conviction: event.target.value })}><option>High</option><option>Medium</option><option>Exploratory</option></Select>
          <Input type="number" placeholder="Shares" value={form.shares} onChange={(event) => setForm({ ...form, shares: event.target.value })} />
          <Input type="number" placeholder="Buy price" value={form.buyPrice} onChange={(event) => setForm({ ...form, buyPrice: event.target.value })} />
          <Input type="number" placeholder="Fallback price" value={form.fallbackPrice} onChange={(event) => setForm({ ...form, fallbackPrice: event.target.value })} />
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
  const [form, setForm] = useState({ ticker: "", name: "", type: "Stock", shares: "", buyPrice: "", fallbackPrice: "", useLivePrice: true, conviction: "Medium" });
  const [targetForm, setTargetForm] = useState({ ticker: "", percent: "" });
  const [targetTotal, setTargetTotal] = useState(saved?.targetTotal || "7000");
  const [cashToInvest, setCashToInvest] = useState(saved?.cashToInvest || "500");
  const [predictionForm, setPredictionForm] = useState({ ticker: "", claim: "", confidence: "60", expectedReturn: "", horizon: "12 months" });
  const [priceStatus, setPriceStatus] = useState("Using fallback prices");

  const totalValue = useMemo(() => positions.reduce((sum, position) => sum + positionValue(position, prices), 0), [positions, prices]);
  const totalCost = useMemo(() => positions.reduce((sum, position) => sum + positionCost(position), 0), [positions]);
  const totalProfit = totalValue - totalCost;
  const totalProfitPercent = totalCost ? (totalProfit / totalCost) * 100 : 0;

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ positions, targets, notes, scores, predictions, prices, priceMeta, history, activeTab, selectedTicker, targetTotal, cashToInvest }));
  }, [positions, targets, notes, scores, predictions, prices, priceMeta, history, activeTab, selectedTicker, targetTotal, cashToInvest]);

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
        return [...current, { id: Date.now(), ticker, name: form.name || STOCK_META[ticker]?.name || ETF_DATA[ticker]?.name || ticker, type: form.type, shares: form.shares, buyPrice: form.buyPrice || String(fallback), fallbackPrice: form.fallbackPrice || String(fallback), useLivePrice: form.useLivePrice, conviction: form.conviction || "Medium" }];
      }
      const existingShares = n(existing.shares);
      const addedShares = n(form.shares);
      const existingAverage = n(existing.buyPrice);
      const addedPrice = n(form.buyPrice || form.fallbackPrice || fallback);
      const newShares = existingShares + addedShares;
      const newAverage = newShares ? ((existingShares * existingAverage) + (addedShares * addedPrice)) / newShares : existingAverage;
      return current.map((position) => position.id === existing.id ? { ...position, shares: String(newShares), buyPrice: String(newAverage), fallbackPrice: form.fallbackPrice || position.fallbackPrice, useLivePrice: form.useLivePrice, conviction: form.conviction || position.conviction || "Medium" } : position);
    });
    setTargets((current) => current.some((target) => target.ticker.toUpperCase() === ticker) ? current : [...current, { id: Date.now() + 1, ticker, percent: "0" }]);
    setForm({ ticker: "", name: "", type: "Stock", shares: "", buyPrice: "", fallbackPrice: "", useLivePrice: true, conviction: "Medium" });
  }

  function updatePosition(id, field, value) { setPositions((current) => current.map((position) => position.id === id ? { ...position, [field]: value } : position)); }
  function deletePosition(id) { setPositions((current) => current.filter((position) => position.id !== id)); }
  function addSnapshot() { setHistory((current) => [...current.filter((item) => item.date !== todayKey()), { date: todayKey(), value: totalValue }].slice(-500)); }
  function resetAll() { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }

  const nav = ["Home", "Portfolio", "Exposure", "Targets", "Predictions", "Notes"];

  return (
    <main style={{ minHeight: "100vh", background: UI.bg, color: UI.text, fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, SF Pro Text, Inter, system-ui, sans-serif", padding: isMobile ? "14px 12px 34px" : "24px 16px 48px" }}>
      <div style={{ width: "100%", maxWidth: "1540px", margin: "0 auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18, flexWrap: "wrap", marginBottom: 22, flexDirection: isMobile ? "column" : "row" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(34px, 8vw, 48px)", letterSpacing: -1.5, fontWeight: 700 }}>Calibrate</h1>
            <p style={{ color: UI.muted, margin: "6px 0 0", fontSize: 17 }}>Your personal investing operating system</p>
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
        <div style={{ color: UI.muted, fontSize: 13, marginBottom: 14 }}>{priceStatus}</div>

        {activeTab === "Home" && <Dashboard totalValue={totalValue} totalProfit={totalProfit} totalProfitPercent={totalProfitPercent} allocation={allocation} history={history} addSnapshot={addSnapshot} riskScore={riskScore} riskLabel={riskLabel} techExposure={techExposure} top3Weight={top3Weight} hitRate={hitRate} updatePosition={updatePosition} deletePosition={deletePosition} priceMeta={priceMeta} />}
        {activeTab === "Portfolio" && <PortfolioPanel form={form} setForm={setForm} addPosition={addPosition} allocation={allocation} updatePosition={updatePosition} deletePosition={deletePosition} priceMeta={priceMeta} />}
        {activeTab === "Exposure" && <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))", gap: 16 }}><AllocationDonut allocation={allocation} totalValue={totalValue} /><ExposureCard title="Stock Exposure" data={stockExposure} /><ExposureCard title="Sector Exposure" data={sectorExposure} /><ExposureCard title="Currency Exposure" data={currencyExposure} /></section>}
        {activeTab === "Targets" && <TargetsPanel targets={targets} setTargets={setTargets} targetForm={targetForm} setTargetForm={setTargetForm} targetSum={targetSum} targetTotal={targetTotal} setTargetTotal={setTargetTotal} cashToInvest={cashToInvest} setCashToInvest={setCashToInvest} rebalancePlan={rebalancePlan} />}
        {activeTab === "Predictions" && <PredictionsPanel predictions={predictions} setPredictions={setPredictions} predictionForm={predictionForm} setPredictionForm={setPredictionForm} hitRate={hitRate} />}
        {activeTab === "Notes" && <NotesPanel tickers={tickers} selectedTicker={selectedTicker} setSelectedTicker={setSelectedTicker} notes={notes} setNotes={setNotes} scores={scores} setScores={setScores} />}
      </div>
    </main>
  );
}
