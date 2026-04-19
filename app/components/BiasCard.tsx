import React from "react";
import { TrendingUp, Activity } from "lucide-react";

// Mendefinisikan tipe data props yang akan diterima komponen ini
interface BiasCardProps {
  title: string;
  biasResult: string; // "BTC Bias", "ETH Bias", atau "Neutral"
  rocA: number;
  rocB: number;
}

export default function BiasCard({
  title,
  biasResult,
  rocA,
  rocB,
}: BiasCardProps) {
  // Logika pewarnaan Tailwind berdasarkan hasil Bias
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let borderColor = "border-gray-300";

  if (biasResult === "BTC Bias") {
    bgColor = "bg-orange-50";
    textColor = "text-orange-600";
    borderColor = "border-orange-400";
  } else if (biasResult === "ETH Bias") {
    bgColor = "bg-blue-50";
    textColor = "text-blue-600";
    borderColor = "border-blue-400";
  }

  return (
    <div
      className={`p-6 rounded-xl border-2 ${borderColor} ${bgColor} shadow-sm w-80 transition-all`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          {title}
        </h3>
        <Activity className={`w-5 h-5 ${textColor}`} />
      </div>

      <div className="mb-6">
        <h1 className={`text-3xl font-extrabold ${textColor}`}>{biasResult}</h1>
        <p className="text-xs text-gray-500 mt-1">
          Sistem menyarankan rotasi modal
        </p>
      </div>

      <div className="space-y-2 border-t pt-4 border-gray-200/60">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-gray-600">BTC Momentum</span>
          <span
            className={`font-bold ${rocA > 0 ? "text-green-600" : "text-red-500"}`}
          >
            {rocA > 0 ? "+" : ""}
            {rocA.toFixed(2)}%
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-gray-600">ETH Momentum</span>
          <span
            className={`font-bold ${rocB > 0 ? "text-green-600" : "text-red-500"}`}
          >
            {rocB > 0 ? "+" : ""}
            {rocB.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
}
