import React from "react";
import { Layers, ArrowRight } from "lucide-react";

interface TPICardProps {
  mTpi: string;
  lTpi: string;
}

export default function TPICard({ mTpi, lTpi }: TPICardProps) {
  // Fungsi pembantu warna
  const getColor = (state: string) => {
    if (state === "Bullish") return "bg-green-500 text-white border-green-600";
    if (state === "Bearish") return "bg-red-500 text-white border-red-600";
    return "bg-gray-400 text-white border-gray-500";
  };

  const isAligned = mTpi === lTpi && mTpi !== "Neutral";

  return (
    <div className="p-6 rounded-xl border-2 border-gray-300 bg-white shadow-sm w-80">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          TPI CONDITIONS
        </h3>
        <Layers className="w-5 h-5 text-indigo-500" />
      </div>

      <div className="space-y-4">
        {/* Medium Term Row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-600 w-16">M-TPI</span>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <div
            className={`px-4 py-1.5 rounded text-xs font-black tracking-widest uppercase border-b-2 ${getColor(mTpi)} w-24 text-center`}
          >
            {mTpi}
          </div>
        </div>

        {/* Long Term Row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-600 w-16">L-TPI</span>
          <ArrowRight className="w-4 h-4 text-gray-300" />
          <div
            className={`px-4 py-1.5 rounded text-xs font-black tracking-widest uppercase border-b-2 ${getColor(lTpi)} w-24 text-center`}
          >
            {lTpi}
          </div>
        </div>
      </div>

      {/* Kesimpulan Konfluensi */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500">
            Trend Alignment
          </span>
          <span
            className={`text-xs font-bold ${isAligned ? "text-green-600" : "text-orange-500"}`}
          >
            {isAligned ? "✅ SYNCED" : "⚠️ DIVERGENCE"}
          </span>
        </div>
      </div>
    </div>
  );
}
