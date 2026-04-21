"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { getDetailedQuantMetrics } from "@/lib/quantLogic";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Activity,
  ShieldAlert,
  TrendingUp,
  Wallet,
  BarChart3,
  Compass,
  Repeat,
  Zap,
  Globe,
  Info,
} from "lucide-react";
import { PerformanceChart } from "./components/PerformanceChart";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Komponen GaugeCard Dinamis
const GaugeCard = ({
  title,
  bias,
  value,
  isWhale = false,
}: {
  title: string;
  bias: string;
  value: string;
  isWhale?: boolean;
}) => {
  const isBullish =
    bias.toLowerCase().includes("bullish") ||
    bias.toLowerCase().includes("outperform");
  const isBearish =
    bias.toLowerCase().includes("bearish") ||
    bias.toLowerCase().includes("underperform");

  const colorText = isBullish
    ? "text-cyan-400"
    : isBearish
      ? "text-orange-400"
      : "text-slate-300";
  const colorBg = isBullish
    ? "bg-cyan-950/20 border-cyan-500/20"
    : isBearish
      ? "bg-orange-950/20 border-orange-500/20"
      : "bg-slate-900 border-slate-800";

  return (
    <div
      className={`p-4 rounded-xl border ${colorBg} flex flex-col justify-between items-center text-center relative overflow-hidden group`}
    >
      {isWhale && (
        <div
          className="absolute top-1 right-1 animate-pulse"
          title="Institutional Volume Detected"
        >
          🐋
        </div>
      )}
      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">
        {title}
      </p>
      <p className={`text-xl font-mono font-bold ${colorText} mb-2`}>{value}</p>
      <div
        className={`text-[9px] px-2 py-0.5 rounded uppercase tracking-widest ${isBullish ? "bg-cyan-500/10 text-cyan-400" : "bg-slate-800 text-slate-400"}`}
      >
        {bias}
      </div>
    </div>
  );
};

export default function AdvancedQuantDashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [macro, setMacro] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [btcMatrix, setBtcMatrix] = useState<any[]>([]);
  const [ethMatrix, setEthMatrix] = useState<any[]>([]);
  const [solMatrix, setSolMatrix] = useState<any[]>([]);
  const [dogeMatrix, setDogeMatrix] = useState<any[]>([]);

  const [quantMetrics, setQuantMetrics] = useState<any>(null);

  useEffect(() => {
    async function fetchMetrics() {
      const data = await getDetailedQuantMetrics("BTCUSDT");
      setQuantMetrics(data);
    }
    fetchMetrics();
  }, []);

  // Helper untuk Tooltip sederhana
  const Tooltip = ({ text }: { text: string }) => (
    <div className="group relative inline-block ml-1">
      <Info size={10} className="text-slate-600 cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-slate-800 text-[9px] text-slate-300 rounded-lg border border-slate-700 z-50 shadow-2xl">
        {text}
      </div>
    </div>
  );

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Basic Dashboard Data
      const { data: histData } = await supabase
        .from("portfolio_history")
        .select("*")
        .order("date", { ascending: true });
      const { data: posData } = await supabase
        .from("current_positions")
        .select("*")
        .order("percentage", { ascending: false });
      const { data: macroData } = await supabase
        .from("macro_data")
        .select("*")
        .order("timestamp", { ascending: false });

      // 2. Fetch Assets & Market Data untuk Matriks Dinamis
      const { data: assetsData } = await supabase
        .from("assets")
        .select("id, symbol");
      const assetMap = new Map();
      if (assetsData) {
        assetsData.forEach((a: any) => assetMap.set(a.id, a.symbol));
      }

      // Ambil ~200 baris terakhir untuk memastikan kita punya data 5 hari ke belakang untuk semua koin
      const { data: marketData } = await supabase
        .from("market_data")
        .select("asset_id, close, timestamp")
        .order("timestamp", { ascending: false });

      if (marketData && assetMap.size > 0) {
        // Kelompokkan harga berdasarkan koin
        const coinData: Record<string, any[]> = {};
        marketData.forEach((row) => {
          const sym = assetMap.get(row.asset_id);
          if (sym) {
            if (!coinData[sym]) coinData[sym] = [];
            coinData[sym].push(row);
          }
        });

        // Hitung ROC (Rate of Change) 5 Hari
        const rocs: Record<string, number> = {};
        Object.keys(coinData).forEach((sym) => {
          const data = coinData[sym];
          // Pastikan data mencukupi untuk 14 hari
          if (data.length >= 14) {
            const currentP = parseFloat(data[0].close);
            const pastP = parseFloat(data[13].close); // <--- Sekarang melihat tren 14 Hari
            rocs[sym] = ((currentP - pastP) / pastP) * 100;
          } else {
            rocs[sym] = 0;
          }
        });

        // Fungsi Pembuat Matriks Dinamis
        const createMatrixItem = (base: string, quote: string) => {
          const baseRoc = rocs[base] || 0;
          const quoteRoc = rocs[quote] || 0;
          const diff = baseRoc - quoteRoc;

          // Deteksi Whale (Jika volume koin dasar > 1.5x rata-rata 20 hari)
          const baseVols =
            coinData[base]?.map((d) => parseFloat(d.volume)) || [];
          const avgVol =
            baseVols.length >= 20
              ? baseVols.slice(0, 20).reduce((a, b) => a + b, 0) / 20
              : 0;
          const isWhale = baseVols[0] > avgVol * 1.5;

          let bias = "Neutral";
          if (diff >= 5) bias = "Outperforming";
          else if (diff > 0) bias = "Bullish";
          else if (diff > -5) bias = "Bearish";
          else bias = "Underperforming";

          return {
            title: `${base.replace("USDT", "")}/${quote.replace("USDT", "")}`,
            bias: bias,
            value: `${diff > 0 ? "+" : ""}${diff.toFixed(2)}%`,
            isWhale: isWhale,
          };
        };

        // Render Data ke Matriks (Termasuk PAXG dan ZEC yang baru kamu tambahkan)
        setBtcMatrix([
          createMatrixItem("ETHUSDT", "BTCUSDT"),
          createMatrixItem("SOLUSDT", "BTCUSDT"),
          createMatrixItem("HYPEUSDT", "BTCUSDT"),
          createMatrixItem("SUIUSDT", "BTCUSDT"),
          createMatrixItem("LINKUSDT", "BTCUSDT"),
          createMatrixItem("PAXGUSDT", "BTCUSDT"),
        ]);

        setEthMatrix([
          createMatrixItem("SOLUSDT", "ETHUSDT"),
          createMatrixItem("SUIUSDT", "ETHUSDT"),
          createMatrixItem("HYPEUSDT", "ETHUSDT"),
          createMatrixItem("AVAXUSDT", "ETHUSDT"),
          createMatrixItem("LINKUSDT", "ETHUSDT"),
        ]);

        setSolMatrix([
          createMatrixItem("HYPEUSDT", "SOLUSDT"),
          createMatrixItem("SUIUSDT", "SOLUSDT"),
          createMatrixItem("AVAXUSDT", "SOLUSDT"),
          createMatrixItem("LINKUSDT", "SOLUSDT"),
          createMatrixItem("ZECUSDT", "SOLUSDT"),
        ]);

        setDogeMatrix([
          createMatrixItem("HYPEUSDT", "DOGEUSDT"),
          createMatrixItem("SUIUSDT", "DOGEUSDT"),
          createMatrixItem("LINKUSDT", "DOGEUSDT"),
        ]);
      }

      if (histData) setHistory(histData);
      if (posData) setPositions(posData);
      if (macroData) setMacro(macroData);
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center text-slate-400 bg-slate-950">
        Initializing Oracle Command Center...
      </div>
    );

  const latest = history[history.length - 1] || {};
  const totalValue = parseFloat(latest.total_value || 0);
  const cryptoExposurePct = (
    (parseFloat(latest.crypto_value || 0) / totalValue) *
    100
  ).toFixed(1);

  // Logic untuk TPI, Regime, dan Bias (Derived dari backtest logic)
  const isBullish = parseFloat(latest.system_roi) > parseFloat(latest.btc_roi);
  const tpiScore = isBullish ? 78 : 42; // Simulasi TPI berbasis outperformance
  const regime = parseFloat(latest.btc_roi) > 0 ? "Markup" : "Accumulation";
  const cycle = "Mid-Cycle";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-4">
        {/* HEADER & NAV */}
        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight text-white">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
              ORACLE COMMAND CENTER
            </h1>
          </div>
          <div className="flex gap-6 items-center">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                Equity Value
              </p>
              <p className="text-xl font-mono font-bold text-white">
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* TOP ROW: QUANT CARDS (TPI, REGIME, CYCLE, BIAS) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* TPICard - Trend Persistence */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-visible group">
            <TrendingUp className="absolute -right-2 -bottom-2 w-16 h-16 text-slate-800 group-hover:text-cyan-900/40 transition-colors" />
            <div className="flex items-center">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Trend Persistence
              </p>
              <Tooltip text="MTPI (14d) & LTPI (50d) mengukur efisiensi tren. Skor > 0.5 menunjukkan tren yang stabil dan minim noise." />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-mono font-bold text-cyan-400">
                {quantMetrics?.tpi.mTpi || "0.00"}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                / {quantMetrics?.tpi.lTpi}
              </p>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              Status: {quantMetrics?.tpi.status || "Analyzing..."}
            </p>
          </div>

          {/* RegimeCard - Market Regime */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-visible group">
            <Globe className="absolute -right-2 -bottom-2 w-16 h-16 text-slate-800 group-hover:text-purple-900/40 transition-colors" />
            <div className="flex items-center">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Market Regime
              </p>
              <Tooltip text="Menentukan apakah pasar dalam fase Trending (Markup/Markdown) atau Mean Reversion (Sideways) berdasarkan SMA200 & ADX." />
            </div>
            <p className="text-2xl font-bold text-purple-400 mt-2 truncate">
              {quantMetrics?.regime.type || "NEUTRAL"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 italic leading-tight">
              {quantMetrics?.regime.note || "Calculating market bias..."}
            </p>
          </div>

          {/* CycleCard - Cycle Position */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-visible group">
            <Repeat className="absolute -right-2 -bottom-2 w-16 h-16 text-slate-800 group-hover:text-amber-900/40 transition-colors" />
            <div className="flex items-center">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Cycle Position
              </p>
              <Tooltip text="Z-Score Mayer Multiple. Skor > +2.0 berarti Overbought (Panas), Skor < -1.5 berarti Oversold (Murah)." />
            </div>
            <p className="text-2xl font-bold text-amber-400 mt-2">
              {quantMetrics?.cycle.zScore || "0.0"}σ
            </p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">
              {quantMetrics?.cycle.status || "FAIR VALUE"} (
              {quantMetrics?.cycle.value}x MM)
            </p>
          </div>

          {/* BiasCard - Directional Bias */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl relative overflow-visible group">
            <Zap className="absolute -right-2 -bottom-2 w-16 h-16 text-slate-800 group-hover:text-green-900/40 transition-colors" />
            <div className="flex items-center">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">
                Exposure Mode
              </p>
              <Tooltip text="Risk-On: Kondisi mendukung aset kripto. Risk-Off: Sistem memprioritaskan keamanan modal (Cash/Stable)." />
            </div>
            <p
              className={`text-2xl font-bold mt-2 ${quantMetrics?.exposure.type === "RISK-ON" ? "text-green-400" : "text-red-400"}`}
            >
              {quantMetrics?.exposure.type || "WAITING"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Sentiment: {quantMetrics?.exposure.sentiment || "Neutral"}
            </p>
          </div>
        </div>

        {/* MIDDLE ROW: PERFORMANCE CHART & GAUGES */}
        {/* SECTION PERFORMANCE CHART */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-8 rounded-3xl min-h-[500px] relative overflow-hidden group">
            {/* Dekorasi Background Guna Menghilangkan Wall of Text */}
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity size={120} className="text-cyan-500" />
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
                  Alpha Engine Performance (ROI %)
                </h3>
                {/* Indikator Live */}
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] text-slate-400 font-mono uppercase">
                    Live Connection
                  </span>
                </div>
              </div>

              <div className="h-[400px] w-full">
                <PerformanceChart data={history || []} />
              </div>
            </div>
          </div>

          {/* Slot Kosong di sebelah kanan bisa kamu isi dengan ExposureCard atau GaugeCard besar */}
          {/* ExposureCard & GaugeCard */}
          <div className="space-y-4">
            {/* ExposureCard */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <p className="text-xs text-slate-500 uppercase font-bold mb-4">
                Risk Exposure
              </p>
              <div className="relative h-32 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 50">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${parseFloat(cryptoExposurePct) * 1.25}, 125`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                  <span className="text-2xl font-bold text-white">
                    {cryptoExposurePct}%
                  </span>
                  <span className="text-[10px] text-slate-500">
                    ACTIVE POSITION
                  </span>
                </div>
              </div>
            </div>

            {/* GaugeCard: ALT vs BTC */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">
                Altcoin Season Index
              </p>
              <div className="flex justify-between items-end">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-slate-500 mb-1">BTC Dom</p>
                  <p className="text-lg font-bold text-orange-400">Low</p>
                </div>
                <div className="text-center flex-1 border-x border-slate-800 px-2">
                  <p className="text-[10px] text-slate-500 mb-1">Ratio</p>
                  <p className="text-lg font-bold text-white">1.4x</p>
                </div>
                <div className="text-center flex-1">
                  <p className="text-[10px] text-slate-500 mb-1">Alt Season</p>
                  <p className="text-lg font-bold text-cyan-400">High</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM ROW: ALLOCATIONS */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Compass className="w-4 h-4" /> Real-Time Allocation Engine
            </h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-slate-500 text-[10px] uppercase bg-slate-950/30">
              <tr>
                <th className="px-6 py-3">Asset</th>
                <th className="px-6 py-3">Porsi (%)</th>
                <th className="px-6 py-3">Avg Price</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {positions.map((p, i) => {
                // 1. Ambil data koin dari btcMatrix yang sudah kita hitung di useEffect
                const assetStatus = btcMatrix.find((m) =>
                  m.title.startsWith(p.symbol),
                );

                // 2. Tentukan warna berdasarkan bias
                const isOutperform =
                  assetStatus?.bias === "Outperforming" ||
                  assetStatus?.bias === "Bullish";
                const isUnderperform =
                  assetStatus?.bias === "Underperforming" ||
                  assetStatus?.bias === "Bearish";

                return (
                  <tr
                    key={i}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                      {p.symbol}
                      {p.symbol === "PAXG" && (
                        <span className="bg-yellow-500/10 text-yellow-500 text-[9px] px-1.5 py-0.5 rounded border border-yellow-500/20">
                          SAFE HAVEN
                        </span>
                      )}
                      {p.symbol !== "USDT" && parseFloat(p.percentage) > 25 && (
                        <span className="bg-cyan-500/10 text-cyan-500 text-[9px] px-1.5 py-0.5 rounded border border-cyan-500/20">
                          WHALE LOAD
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-cyan-400">
                      {p.percentage}%
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      ${parseFloat(p.avg_price || 0).toLocaleString()}
                    </td>

                    {/* REVISI BAGIAN STATUS DI SINI */}
                    <td
                      className={`px-6 py-4 text-right text-xs font-bold tracking-widest uppercase`}
                    >
                      {p.symbol === "USDT" ? (
                        <span className="text-slate-500">STABLE</span>
                      ) : (
                        <span
                          className={
                            isOutperform
                              ? "text-cyan-400"
                              : isUnderperform
                                ? "text-orange-400"
                                : "text-slate-400"
                          }
                        >
                          {assetStatus?.bias || "NEUTRAL"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* ============================================================== */}
        {/* RELATIVE STRENGTH HEATMAP SECTIONS                             */}
        {/* ============================================================== */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl space-y-2 mt-8">
          {/* ROW 1: ALPHA MATRIX (VS BTC) */}
          <section className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>{" "}
                Alpha Matrix (vs BTC)
              </h2>
              <div className="h-[1px] flex-grow bg-slate-800"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {btcMatrix.map((item, i) => (
                <GaugeCard
                  key={i}
                  title={item.title}
                  bias={item.bias}
                  value={item.value}
                />
              ))}
            </div>
          </section>

          {/* MATRIX 2: ALTS / ETH (Rotation Matrix) */}
          <section className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xs font-black text-cyan-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>{" "}
                Rotation Matrix (Alts vs ETH)
              </h2>
              <div className="h-[1px] flex-grow bg-cyan-900/30"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {ethMatrix.map((item, i) => (
                <GaugeCard
                  key={i}
                  title={item.title}
                  bias={item.bias}
                  value={item.value}
                />
              ))}
            </div>
          </section>

          {/* ROW 3: BETA MATRIX (VS SOL) */}
          <section className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xs font-black text-purple-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>{" "}
                Solana Beta Matrix (vs SOL)
              </h2>
              <div className="h-[1px] flex-grow bg-purple-900/30"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {solMatrix.map((item, i) => (
                <GaugeCard
                  key={i}
                  title={item.title}
                  bias={item.bias}
                  value={item.value}
                />
              ))}
            </div>
          </section>

          {/* ROW 4: SENTIMENT MATRIX (VS DOGE) */}
          <section>
            <div className="flex items-center gap-4 mb-6">
              <h2 className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>{" "}
                Retail Sentiment Matrix (vs DOGE)
              </h2>
              <div className="h-[1px] flex-grow bg-amber-900/30"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {dogeMatrix.map((item, i) => (
                <GaugeCard
                  key={i}
                  title={item.title}
                  bias={item.bias}
                  value={item.value}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
