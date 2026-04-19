import React from "react";
import { BarChart2, AlertCircle } from "lucide-react";

interface RegimeCardProps {
  asset: string;
  regime: string; // "TREND" atau "MR"
  trendDirection: string; // "Bullish", "Bearish", atau "Sideways"
  distance: number; // Jarak persentase antara EMA 20 dan 50
}

export default function RegimeCard({
  asset,
  regime,
  trendDirection,
  distance,
}: RegimeCardProps) {
  // Logika pewarnaan otomatis
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let borderColor = "border-gray-300";
  let badgeColor = "bg-gray-200 text-gray-700";

  if (regime === "TREND") {
    if (trendDirection === "Bullish") {
      bgColor = "bg-green-50";
      textColor = "text-green-700";
      borderColor = "border-green-400";
      badgeColor = "bg-green-200 text-green-800";
    } else if (trendDirection === "Bearish") {
      bgColor = "bg-red-50";
      textColor = "text-red-700";
      borderColor = "border-red-400";
      badgeColor = "bg-red-200 text-red-800";
    }
  } else if (regime === "MR") {
    bgColor = "bg-yellow-50";
    textColor = "text-yellow-700";
    borderColor = "border-yellow-400";
    badgeColor = "bg-yellow-200 text-yellow-800";
  }

  return (
    <div
      className={`p-6 rounded-xl border-2 ${borderColor} ${bgColor} shadow-sm w-80 transition-all`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          {asset} REGIME
        </h3>
        {regime === "MR" ? (
          <AlertCircle className={`w-5 h-5 ${textColor}`} />
        ) : (
          <BarChart2 className={`w-5 h-5 ${textColor}`} />
        )}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-extrabold ${textColor}`}>{regime}</h1>
          <p className="text-xs text-gray-500 mt-1">Market State Analysis</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold ${badgeColor}`}
        >
          {trendDirection}
        </span>
      </div>

      <div className="space-y-2 border-t pt-4 border-gray-200/60">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-gray-600">EMA Spread</span>
          <span className="font-bold text-gray-800">
            {distance !== undefined &&
            distance !== null &&
            !isNaN(Number(distance))
              ? Number(distance).toFixed(2)
              : "0.00"}
            %
          </span>
        </div>
        <div className="flex justify-between items-center text-xs mt-2 text-gray-500">
          <span>
            {regime === "MR"
              ? "Risiko Whipsaw Tinggi"
              : regime === "TREND"
                ? "Aman untuk Trend Following"
                : "Butuh Data / Analisis Netral"}
          </span>
        </div>
      </div>
    </div>
  );
}
