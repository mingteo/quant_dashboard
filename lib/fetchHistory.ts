// lib/fetchHistory.ts

// 1. REVISI: Jangan gunakan require("dotenv") atau createClient di sini.
// Import instance supabase yang SUDAH ADA di proyek dashboard Anda.
import { supabase } from "./supabase";

// Pastikan variabel ini ditambahkan di environment variables Vercel nanti
const CC_API_KEY = process.env.CC_API_KEY;

// 2. REVISI: Tambahkan kata "export" agar bisa dipanggil dari route.ts
export async function recordTrade(
  symbol: string,
  type: string,
  price: number,
  amount: number,
  pnl = 0,
) {
  const { data, error } = await supabase.from("trade_history").insert([
    {
      symbol: symbol,
      type: type,
      exit_price: price,
      amount: amount,
      pnl_percent: pnl,
      timestamp: new Date().toISOString(),
    },
  ]);
  if (error) console.error("Gagal mencatat audit:", error);
}

// 2. REVISI: Tambahkan kata "export"
export async function setupAndFetchHistory() {
  console.log("🛠️ MEMULAI PENARIKAN DATA VIA CRYPTOCOMPARE...");

  const assets = [
    "BTC",
    "ETH",
    "SOL",
    "SUI",
    "BNB",
    "XRP",
    "DOGE",
    "AVAX",
    "LINK",
    "HYPE",
    "ZEC",
    "PAXG",
  ];

  const { data: dbAssets } = await supabase.from("assets").select("id, symbol");

  // Tambahkan validasi jika dbAssets kosong agar tidak error
  if (!dbAssets) {
    throw new Error("Gagal mengambil data aset dari database");
  }

  const assetMap = new Map(
    dbAssets.map((a) => [a.symbol.replace("USDT", ""), a.id]),
  );

  let successCount = 0;

  for (const symbol of assets) {
    const assetId = assetMap.get(symbol);
    if (!assetId) continue;

    console.log(`⏳ Fetching ${symbol}...`);

    const url = `https://min-api.cryptocompare.com/data/v2/histoday?fsym=${symbol}&tsym=USD&limit=1000&api_key=${CC_API_KEY}`;

    try {
      const response = await fetch(url);
      const json = await response.json();

      if (json.Response === "Error") {
        console.error(`❌ API Error ${symbol}: ${json.Message}`);
        continue;
      }

      const klines = json.Data.Data;
      const formatted = klines.map((k: any) => ({
        asset_id: assetId,
        timestamp: new Date(k.time * 1000).toISOString(),
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
        volume: k.volumeto,
        timeframe: "1d",
      }));

      const { error: upsertError } = await supabase
        .from("market_data")
        .upsert(formatted, { onConflict: "asset_id, timestamp, timeframe" });

      if (upsertError) {
        console.error(`❌ DB Error: ${upsertError.message}`);
      } else {
        console.log(`✅ Success: ${formatted.length} rows for ${symbol}`);
        successCount++;
      }
    } catch (err: any) {
      console.error(`💥 Fatal Error ${symbol}: ${err.message}`);
    }

    // Hindari rate limit API
    await new Promise((res) => setTimeout(res, 500));
  }

  return `🎉 SEMUA DATA TERSINKRON! (${successCount} aset berhasil diproses)`;
}

// 3. REVISI: HAPUS pemanggilan fungsi setupAndFetchHistory() di baris paling bawah!
// Di Vercel, pemanggilan ini hanya boleh dipicu (triggered) oleh API Route.
