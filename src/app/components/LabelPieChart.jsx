"use client";
import React, { useMemo, useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FaSyncAlt, FaArrowLeft } from "react-icons/fa";

const COLORS = [
  "#10B981", // emerald
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#EF4444", // red
  "#14B8A6", // teal
];





// 🥧 Pie Chart: Balance by Label (✅ now with sublabel drilldown)
const LabelPieChart = ({ wallets }) => {
  const [selectedLabel, setSelectedLabel] = useState(null);

  // 🧮 Main label data
  const labelData = useMemo(() => {
    const map = {};
    wallets.forEach((w) => {
      const label = w.label || "Unlabeled";
      map[label] = (map[label] || 0) + Number(w.balance || 0);
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  }, [wallets]);

  // 🧩 Sublabel data (when a label is selected)
  const sublabelData = useMemo(() => {
    if (!selectedLabel) return [];
    const map = {};
    wallets
      .filter((w) => (w.label || "Unlabeled") === selectedLabel)
      .forEach((w) => {
        const sublabel = w.sublabel || "No Sublabel";
        map[sublabel] = (map[sublabel] || 0) + Number(w.balance || 0);
      });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2)),
    }));
  }, [wallets, selectedLabel]);

  const dataToShow = selectedLabel ? sublabelData : labelData;

  return (
    <div className="bg-gray-800/70 p-5 rounded-2xl shadow-md mb-8 relative">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {selectedLabel && (
            <button
              onClick={() => setSelectedLabel(null)}
              className="text-gray-400 hover:text-white transition-colors"
              title="Back to all labels"
            >
              <FaArrowLeft />
            </button>
          )}
          <h3 className="text-lg font-bold text-white">
            {selectedLabel
              ? `${selectedLabel} — Sublabel Breakdown`
              : "Balance by Label"}
          </h3>
        </div>
      </div>

      {dataToShow.length === 0 ? (
        <p className="text-gray-400 text-center py-10">No data available</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={dataToShow}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#10B981"
              label={({ name, value }) => `${name}: ${value}`}
              onClick={(data) => {
                if (!selectedLabel) setSelectedLabel(data.name);
              }}
            >
              {dataToShow.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "none",
                color: "#fff",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
            />
            {/* <Legend /> */}
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

// 🕒 Pie Chart: Tokens received in 24h (from API)
const Token24hPieChart = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWallets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/last_balance/details");
      const data = await res.json();
      if (data.success) setWallets(data.wallets);
    } catch (err) {
      console.error("❌ Error fetching 24h token data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const data = useMemo(() => {
    return wallets
      .filter((w) => w.received24h > 0)
      .map((w) => ({
        name: `${w.sublabel || "Unknown"} (${w.label || "No Label"})`,
        value: parseFloat(Number(w.received24h || 0).toFixed(2)),
      }));
  }, [wallets]);

  return (
    <div className="bg-gray-800/70 p-5 rounded-2xl shadow-md mb-8 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">
          Tokens Received (Last 24h)
        </h3>
        <button
          onClick={fetchWallets}
          className="text-gray-300 hover:text-white transition-colors"
          title="Refresh"
        >
          <FaSyncAlt
            className={`${
              loading ? "animate-spin text-blue-400" : ""
            } w-5 h-5`}
          />
        </button>
      </div>

      {loading ? (
        <div className="text-gray-400 text-center py-10">Loading...</div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#3B82F6"
              label={({ name, value }) => `${name}: ${value}`}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell2-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#FFFFFF",
                border: "none",
                color: "#fff",
                borderRadius: "8px",
                fontWeight: "bold",
              }}
            />
            {/* <Legend /> */}
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

// 💡 Combined Section
const ChartsSection = ({ wallets }) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <LabelPieChart wallets={wallets} />
      <Token24hPieChart />
    </div>
  );
};

export default ChartsSection;
