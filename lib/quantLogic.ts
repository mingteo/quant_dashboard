import { supabase } from "./supabase";

/**
 * 1. PERHITUNGAN TPI (Efficiency Ratio)
 * Mengukur "kebersihan" tren.
 * Nilai mendekati 1 = Tren sangat kuat/lurus.
 * Nilai mendekati 0 = Banyak noise/sideways.
 */
export function calculateEfficiencyRatio(prices: number[]) {
  if (prices.length < 2) return 0;

  const netChange = Math.abs(prices[prices.length - 1] - prices[0]);
  let totalVolatility = 0;

  for (let i = 1; i < prices.length; i++) {
    totalVolatility += Math.abs(prices[i] - prices[i - 1]);
  }

  return totalVolatility === 0
    ? 0
    : parseFloat((netChange / totalVolatility).toFixed(2));
}

/**
 * 2. PERHITUNGAN Z-SCORE (Cycle Valuation)
 * Mengukur seberapa jauh Mayer Multiple saat ini menyimpang dari rata-rata historisnya.
 */
export function calculateZScore(currentMM: number, mmHistory: number[]) {
  if (mmHistory.length < 2) return 0;

  const n = mmHistory.length;
  const mean = mmHistory.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(
    mmHistory.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / n,
  );

  return parseFloat(((currentMM - mean) / stdDev).toFixed(2));
}

/**
 * LOGIKA UTAMA QUANT ORACLE
 */
export async function getDetailedQuantMetrics(symbol: string = "BTCUSDT") {
  // Ambil data harga historis (500 candle terakhir untuk akurasi Z-Score & SMA200)
  const { data: candles } = await supabase
    .from("market_data")
    .select("close, timestamp")
    .order("timestamp", { ascending: false })
    .limit(500);

  if (!candles || candles.length < 200) {
    return null;
  }

  const prices = candles.map((c) => parseFloat(c.close)).reverse(); // Urutan dari lama ke baru
  const currentPrice = prices[prices.length - 1];

  // A. Kalkulasi TPI (Efficiency Ratio)
  const mTpi = calculateEfficiencyRatio(prices.slice(-14)); // Medium-Term
  const lTpi = calculateEfficiencyRatio(prices.slice(-50)); // Long-Term

  // B. Kalkulasi Mayer Multiple & Z-Score
  const sma200 = prices.slice(-200).reduce((a, b) => a + b, 0) / 200;
  const currentMM = currentPrice / sma200;

  // Hitung histori MM untuk Z-Score
  const mmHistory: number[] = [];
  for (let i = 200; i <= prices.length; i++) {
    const window = prices.slice(i - 200, i);
    const avg = window.reduce((a, b) => a + b, 0) / 200;
    mmHistory.push(window[window.length - 1] / avg);
  }
  const zScore = calculateZScore(currentMM, mmHistory);

  // C. Market Regime Logic (Trend vs Mean Reversion)
  // Menggunakan perbandingan SMA cepat (20) dan lambat (50) + TPI
  const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;

  let regime = "MEAN REVERSION";
  let regimeNote = "Pasar sedang dalam fase konsolidasi/sideways.";

  if (mTpi > 0.6 || Math.abs((sma20 - sma50) / sma50) > 0.05) {
    regime = currentPrice > sma200 ? "TREND BULLISH" : "TREND BEARISH";
    regimeNote =
      currentPrice > sma200
        ? "Momentum ekspansi harga terdeteksi (Markup Phase)."
        : "Tekanan jual dominan (Markdown Phase).";
  } else if (zScore > 2 || zScore < -2) {
    regime = "EXTREME MR";
    regimeNote = "Harga berada di titik jenuh, potensi pembalikan arah tinggi.";
  }

  // D. Exposure Type (Risk-On vs Risk-Off)
  // Mengambil korelasi DXY secara implisit dari tren macro
  let exposure = "RISK-OFF";
  if (currentPrice > sma200 && mTpi > 0.4) {
    exposure = "RISK-ON";
  }

  return {
    tpi: { mTpi, lTpi, status: mTpi > 0.5 ? "Strong Trend" : "Weak/Noisy" },
    cycle: {
      zScore,
      value: currentMM.toFixed(2),
      status:
        zScore > 2 ? "OVERBOUGHT" : zScore < -1.5 ? "OVERSOLD" : "FAIR VALUE",
    },
    regime: { type: regime, note: regimeNote },
    exposure: {
      type: exposure,
      sentiment:
        exposure === "RISK-ON"
          ? "Aggressive Accumulation"
          : "Capital Preservation",
    },
  };
}

/**
 * REVISI ALOKASI TARGET (Logic Eksekusi)
 */
export function calculateTargetAllocation(metrics: any) {
  const { zScore } = metrics.cycle;
  const { mTpi } = metrics.tpi;
  const { type: regime } = metrics.regime;

  let cryptoWeight = 0;

  // 1. Base Weight berdasarkan Regime
  if (regime === "TREND BULLISH") cryptoWeight = 80;
  if (regime === "MEAN REVERSION") cryptoWeight = 40;
  if (regime === "TREND BEARISH") cryptoWeight = 0;

  // 2. Adjust berdasarkan TPI (Keyakinan Tren)
  if (mTpi > 0.7) cryptoWeight += 20;

  // 3. Risk Management berdasarkan Cycle (Z-Score)
  if (zScore > 2.5) cryptoWeight -= 40; // Kurangi exposure jika sudah bubble
  if (zScore < -1.5) cryptoWeight += 20; // Tambah exposure jika sangat murah

  // Clamp 0 - 100
  cryptoWeight = Math.max(0, Math.min(100, cryptoWeight));

  return {
    crypto: cryptoWeight,
    cash: 100 - cryptoWeight,
  };
}
