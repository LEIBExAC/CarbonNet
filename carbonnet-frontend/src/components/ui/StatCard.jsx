import React from "react";
import Card from "./Card";

const StatCard = ({ title, value, icon: Icon, trend, color = "emerald" }) => {
  const colors = {
    emerald: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
    indigo: "bg-indigo-100 text-indigo-600",
  };

  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <p
              className={`text-sm mt-2 ${
                trend > 0 ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}% from last period
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
