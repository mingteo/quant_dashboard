import React from "react";

interface GaugeProps {
  title: string;
  bias: string;
  value: string | number;
}

export default function GaugeCard({ title, bias, value }: GaugeProps) {
  const isBullish = bias === "Bullish";
  const isBearish = bias === "Bearish";
  
  const numValue = Number(value);
  const displayValue = isNaN(numValue) ? 0 : numValue;
  const barWidth = Math.min(Math.abs(displayValue) * 10, 100);

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm w-[200px]">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
        {title}
      </p>
      <div
        className={`text-xs font-bold px-2 py-0.5 rounded inline-block mb-3 ${
          isBullish
            ? "bg-green-100 text-green-700"
            : isBearish
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
        }`}
      >
        {bias ? bias.toUpperCase() : "NEUTRAL"}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-2xl font-black text-gray-900">{displayValue}</span>
        <span className="text-[10px] text-gray-500 font-bold mb-1">% ROC</span>
      </div>
      {/* Visual Bar Sederhana ala Shida */}
      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${isBullish ? "bg-green-500" : isBearish ? "bg-red-500" : "bg-gray-400"}`}
          style={{ width: `${barWidth}%` }}
        ></div>
      </div>
    </div>
  );
}
