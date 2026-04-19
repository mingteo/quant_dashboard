import { supabase } from "./supabase";

// Tambahkan fungsi ini di dalam lib/quantLogic.ts
export async function getBias(symbolA: string, symbolB: string) {
  const dataA = await getAssetROC(symbolA, 5);
  const dataB = await getAssetROC(symbolB, 5);

  let biasResult = "Neutral";

  if (dataA.roc > dataB.roc) {
    biasResult = `${symbolA.replace("USDT", "")} Bias`;
  } else if (dataB.roc > dataA.roc) {
    biasResult = `${symbolB.replace("USDT", "")} Bias`;
  }

  return {
    biasResult,
    rocA: dataA.roc,
    rocB: dataB.roc,
  };
}

// --- FUNGSI PEMBANTU (UTILITIES) ---

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const k = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// --- CORE ANALYSIS FUNCTIONS ---

export async function getAssetROC(symbol: string, days = 14) {
  const { data: assetData } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", symbol)
    .single();

  if (!assetData) return { roc: 0 };

  const { data: candles } = await supabase
    .from("market_data")
    .select("close, timestamp")
    .eq("asset_id", assetData.id)
    .order("timestamp", { ascending: false })
    .limit(days);

  if (!candles || candles.length < days) return { roc: 0 };

  const currentClose = parseFloat(candles[0].close);
  const pastClose = parseFloat(candles[candles.length - 1].close);
  const roc = ((currentClose - pastClose) / pastClose) * 100;

  return { roc };
}

export async function getMarketRegime(symbol: string) {
  const { data: assetData } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", symbol)
    .single();

  if (!assetData)
    return {
      regime: "UNKNOWN",
      trendDirection: "UNKNOWN",
      ema20: 0,
      ema50: 0,
      distance: 0,
    };

  // Ambil 150 data agar EMA 50 lebih stabil (Warm-up period)
  const { data: candles } = await supabase
    .from("market_data")
    .select("close, timestamp")
    .eq("asset_id", assetData.id)
    .order("timestamp", { ascending: true })
    .limit(150);

  if (!candles || candles.length < 50)
    return {
      regime: "NOT_ENOUGH_DATA",
      trendDirection: "UNKNOWN",
      ema20: 0,
      ema50: 0,
      distance: 0,
    };

  const closingPrices = candles.map((c) => parseFloat(c.close));
  const ema20 = calculateEMA(closingPrices, 20);
  const ema50 = calculateEMA(closingPrices, 50);
  const distance = Math.abs((ema20 - ema50) / ema50) * 100;

  let regime = distance < 2 ? "MR" : "TREND";
  let trendDirection = "Sideways";
  if (regime === "TREND") {
    trendDirection = ema20 > ema50 ? "Bullish" : "Bearish";
  }

  return { regime, trendDirection, ema20, ema50, distance };
}

export async function getCycleValuation(symbol: string = "BTCUSDT") {
  const { data: assetData } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", symbol)
    .single();
  if (!assetData)
    return {
      value: 0,
      state: "UNKNOWN",
      color: "gray",
      metricName: "Mayer Multiple",
    };

  const { data: candles } = await supabase
    .from("market_data")
    .select("close")
    .eq("asset_id", assetData.id)
    .order("timestamp", { ascending: false })
    .limit(200);

  if (!candles || candles.length < 200)
    return {
      value: 0,
      state: "NEED_DATA",
      color: "gray",
      metricName: "Mayer Multiple",
    };

  const currentPrice = parseFloat(candles[0].close);
  const sma200 =
    candles.reduce((acc, curr) => acc + parseFloat(curr.close), 0) /
    candles.length;
  const mm = currentPrice / sma200;

  let state = "Neutral",
    color = "gray";
  if (mm < 0.8) {
    state = "DEEP OVERSOLD";
    color = "green";
  } else if (mm < 1.5) {
    state = "FAIR VALUE";
    color = "yellow";
  } else if (mm < 2.4) {
    state = "HEATING UP";
    color = "orange";
  } else {
    state = "OVERBOUGHT";
    color = "red";
  }

  return { value: mm, state, color, metricName: "Mayer Multiple" };
}

export async function getTPI(symbol: string = "BTCUSDT") {
  const { data: assetData } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", symbol)
    .single();
  if (!assetData) return { mTpi: "UNKNOWN", lTpi: "UNKNOWN" };

  const { data: candles } = await supabase
    .from("market_data")
    .select("close")
    .eq("asset_id", assetData.id)
    .order("timestamp", { ascending: true })
    .limit(200);

  if (!candles || candles.length < 200)
    return { mTpi: "NEED_DATA", lTpi: "NEED_DATA" };

  const prices = candles.map((c) => parseFloat(c.close));
  const current = prices[prices.length - 1];
  const ema20 = calculateEMA(prices, 20);
  const ema50 = calculateEMA(prices, 50);
  const sma200 = prices.reduce((a, b) => a + b, 0) / prices.length;

  let mTpi = "Neutral";
  if (ema20 > ema50 && current > ema20) mTpi = "Bullish";
  else if (ema20 < ema50 && current < ema20) mTpi = "Bearish";

  let lTpi = "Neutral";
  if (ema50 > sma200 && current > sma200) lTpi = "Bullish";
  else if (ema50 < sma200 && current < sma200) lTpi = "Bearish";

  return { mTpi, lTpi };
}

/**
 * REVISI UTAMA: getPairBias (Relative Strength)
 * Menghitung ETH/BTC secara sinkron per timestamp
 */
export async function getPairBias(altSymbol: string, baseSymbol: string) {
  const { data: altAsset } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", altSymbol)
    .single();
  const { data: baseAsset } = await supabase
    .from("assets")
    .select("id")
    .eq("symbol", baseSymbol)
    .single();

  if (!altAsset || !baseAsset) return { bias: "Neutral", value: 0 };

  const { data: altData } = await supabase
    .from("market_data")
    .select("close, timestamp")
    .eq("asset_id", altAsset.id)
    .order("timestamp", { ascending: false })
    .limit(30);
  const { data: baseData } = await supabase
    .from("market_data")
    .select("close, timestamp")
    .eq("asset_id", baseAsset.id)
    .order("timestamp", { ascending: false })
    .limit(30);

  if (!altData || !baseData) return { bias: "Neutral", value: 0 };

  // Sinkronisasi Data berdasarkan Timestamp agar tidak membandingkan hari yang berbeda
  const baseMap = new Map(
    baseData.map((d) => [d.timestamp, parseFloat(d.close)]),
  );
  const pairPrices: number[] = [];

  altData.forEach((alt) => {
    const baseClose = baseMap.get(alt.timestamp);
    if (baseClose) pairPrices.push(parseFloat(alt.close) / baseClose);
  });

  if (pairPrices.length < 15) return { bias: "Neutral", value: 0 };

  // ROC 14 Hari pada Ratio ETH/BTC
  const currentRatio = pairPrices[0];
  const pastRatio = pairPrices[14];
  const roc = ((currentRatio - pastRatio) / pastRatio) * 100;

  let bias = "Neutral";
  if (roc > 0.5)
    bias = "Bullish"; // Alt (ETH) lebih kuat dari Base (BTC)
  else if (roc < -0.5) bias = "Bearish"; // Base (BTC) lebih kuat dari Alt (ETH)

  return { bias, value: isNaN(roc) ? 0 : roc.toFixed(2) };
}

export async function getMacroPrice(symbol: string) {
  const { data } = await supabase
    .from("macro_data")
    .select("close")
    .eq("symbol", symbol)
    .order("timestamp", { ascending: false })
    .limit(2);
  if (!data || data.length < 2) return { price: 0, change: 0 };
  const current = parseFloat(data[0].close);
  const prev = parseFloat(data[1].close);
  const change = ((current - prev) / prev) * 100;
  return { price: current, change: isNaN(change) ? 0 : change.toFixed(2) };
}

export function getExposureType(
  regime: string,
  trendDirection: string,
  cycleState: string,
) {
  let type = "UNKNOWN",
    actionPlan = "Menunggu data",
    alertLevel = "gray";

  if (regime === "TREND" && trendDirection === "Bullish") {
    if (cycleState === "DEEP OVERSOLD") {
      type = "HEAVY ACCUMULATION";
      actionPlan = "Tren naik + Harga Murah. Gaspol Spot.";
      alertLevel = "green";
    } else if (cycleState === "OVERBOUGHT") {
      type = "TAKE PROFIT";
      actionPlan = "Tren naik tapi Bubble. Jual bertahap.";
      alertLevel = "yellow";
    } else {
      type = "RISK ON";
      actionPlan = "Tren sehat. Tahan posisi atau DCA.";
      alertLevel = "green";
    }
  } else if (regime === "TREND" && trendDirection === "Bearish") {
    if (cycleState === "DEEP OVERSOLD") {
      type = "WATCH CLOSELY";
      actionPlan = "Murah tapi downtrend. Tunggu reversal.";
      alertLevel = "yellow";
    } else {
      type = "RISK OFF";
      actionPlan = "Bear market. Amankan kas ke USDT.";
      alertLevel = "red";
    }
  } else if (regime === "MR") {
    type = "NEUTRAL";
    actionPlan = "Sideways. Kurangi trading, hold investasi.";
    alertLevel = "yellow";
  }

  return { type, actionPlan, alertLevel };
}

export function calculateTargetAllocation(
  regime: string,
  trendDirection: string,
  cycleState: string,
  mTpi: string,
  lTpi: string,
): number {
  let cryptoWeight = 0;
  if (regime === "TREND" && trendDirection === "Bullish") cryptoWeight += 45;
  else if (regime === "MR") cryptoWeight += 15;

  if (cycleState === "DEEP OVERSOLD") cryptoWeight += 35;
  else if (cycleState === "FAIR VALUE") cryptoWeight += 20;
  else if (cycleState === "OVERBOUGHT") cryptoWeight -= 40;

  if (lTpi === "Bullish") cryptoWeight += 15;
  if (mTpi === "Bullish") cryptoWeight += 5;

  return Math.max(0, Math.min(cryptoWeight, 100));
}
