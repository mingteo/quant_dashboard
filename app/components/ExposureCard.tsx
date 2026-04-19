import React from "react";
import { ShieldAlert, Zap, AlertTriangle } from "lucide-react";

interface ExposureCardProps {
  type: string;
  actionPlan: string;
  alertLevel: string;
}

export default function ExposureCard({
  type,
  actionPlan,
  alertLevel,
}: ExposureCardProps) {
  let bgColor = "bg-gray-800";
  let textColor = "text-white";
  let borderColor = "border-gray-700";
  let Icon = ShieldAlert;

  if (alertLevel === "green") {
    bgColor = "bg-green-600";
    borderColor = "border-green-500";
    Icon = Zap;
  } else if (alertLevel === "red") {
    bgColor = "bg-red-600";
    borderColor = "border-red-500";
    Icon = ShieldAlert;
  } else if (alertLevel === "yellow") {
    bgColor = "bg-yellow-500";
    textColor = "text-gray-900";
    borderColor = "border-yellow-400";
    Icon = AlertTriangle;
  }

  return (
    <div
      className={`p-6 rounded-xl border-2 ${borderColor} ${bgColor} ${textColor} shadow-lg w-80 transition-all flex flex-col justify-between`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">
          EXPOSURE TYPE
        </h3>
        <Icon className="w-6 h-6 opacity-90" />
      </div>

      <div className="mb-2">
        <h1 className="text-4xl font-black tracking-tight mb-2">{type}</h1>
        <div className="h-px w-full bg-white/20 my-3"></div>
        <p className="text-sm font-medium opacity-90 leading-relaxed">
          <span className="opacity-70 text-xs block mb-1">
            SYSTEM ACTION PLAN:
          </span>
          {actionPlan}
        </p>
      </div>
    </div>
  );
}
