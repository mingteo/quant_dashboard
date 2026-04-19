import React from "react";
import { Database } from "lucide-react";

interface CycleCardProps {
  value: number;
  state: string;
  color: string;
  metricName: string;
}

export default function CycleCard({
  value,
  state,
  color,
  metricName,
}: CycleCardProps) {
  const badgeColors: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    orange: "bg-orange-100 text-orange-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-800",
  };

  const activeColor = badgeColors[color] || badgeColors.gray;

  return (
    <div className="p-6 rounded-xl border-2 border-gray-300 bg-white shadow-sm w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          CYCLE VALUATION
        </h3>
        <Database className="w-5 h-5 text-indigo-500" />
      </div>

      <div className="mb-4">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tighter">
          {value.toFixed(2)}
        </h1>
        <p className="text-xs text-gray-400 mt-1 font-medium">{metricName}</p>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <span className="text-sm font-bold text-gray-600">Market State:</span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${activeColor}`}
        >
          {state}
        </span>
      </div>
    </div>
  );
}
