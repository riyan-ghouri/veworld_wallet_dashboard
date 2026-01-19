"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const B3TRChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [trendUp, setTrendUp] = useState(true);

  const usdToPkr = 285;

  const formatData = (prices) =>
    prices.map((p) => ({
      time: new Date(p[0]).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      price: p[1],
    }));

  const fetchPriceData = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        "https://api.coingecko.com/api/v3/coins/vebetterdao/market_chart?vs_currency=usd&days=1",
        { cache: "no-store" }
      );
      const json = await res.json();

      if (json?.prices?.length) {
        const formatted = formatData(json.prices);
        setData(formatted);

        const first = json.prices[0][1];
        const last = json.prices[json.prices.length - 1][1];
        setTrendUp(last >= first);
        setLastUpdated(new Date().toLocaleTimeString());

        localStorage.setItem(
          "b3tr_cache",
          JSON.stringify({ data: formatted, updated: Date.now() })
        );
      }
    } catch (err) {
      console.error("Error fetching B3TR chart data:", err);
      const cache = localStorage.getItem("b3tr_cache");
      if (cache) {
        const parsed = JSON.parse(cache);
        setData(parsed.data);
        setLastUpdated(
          new Date(parsed.updated).toLocaleTimeString() + " (cached)"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceData();
    const interval = setInterval(fetchPriceData, 60_000);
    return () => clearInterval(interval);
  }, []);

  const lineColor = useMemo(
    () => (trendUp ? "#4ade80" : "#f87171"),
    [trendUp]
  );

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/70 p-4 sm:p-6 rounded-2xl shadow-2xl w-full overflow-hidden backdrop-blur-md transition-all duration-500 hover:shadow-green-400/20 hover:-translate-y-1">
      {/* subtle animated gradient blur */}
      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-transparent to-transparent animate-pulse pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-emerald-400 flex items-center gap-2">
          B3TR Price (24h)
          <span
            className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-md ${
              trendUp
                ? "bg-emerald-600/30 text-emerald-300"
                : "bg-red-600/30 text-red-300"
            }`}
          >
            {trendUp ? "↑ Rising" : "↓ Falling"}
          </span>
        </h2>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {lastUpdated && (
            <span className="text-[10px] sm:text-xs text-gray-400">
              Updated: {lastUpdated}
            </span>
          )}
          <button
            onClick={fetchPriceData}
            disabled={loading}
            className="bg-emerald-600/90 hover:bg-emerald-500 px-2.5 sm:px-3 py-1 rounded-md text-[11px] sm:text-sm font-medium text-white transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-emerald-400/20"
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>

      {/* Chart */}
      {data.length > 0 ? (
        <div className="h-60 sm:h-72 md:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="time"
                tick={{ fill: "#9CA3AF", fontSize: 9 }}
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
                minTickGap={15}
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                domain={["auto", "auto"]}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #374151",
                  borderRadius: "10px",
                  color: "#fff",
                  boxShadow: "0 0 12px rgba(34,197,94,0.15)",
                }}
                itemStyle={{ fontSize: "12px" }}
                formatter={(value) => [
                  <>
                    <div className="text-xs sm:text-sm">
                      <span className="font-semibold text-emerald-400">
                        ${value.toFixed(5)} USD
                      </span>
                      <br />
                      <span className="text-gray-300">
                        {(value * usdToPkr).toFixed(2)} PKR
                      </span>
                    </div>
                  </>,
                  "Price",
                ]}
              />
              <defs>
                <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={lineColor} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={lineColor} stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Line
                type="monotone"
                dataKey="price"
                stroke="url(#lineColor)"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={true}
                animationDuration={800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-center text-gray-400 text-xs sm:text-sm py-10">
          Loading chart data...
        </p>
      )}
    </div>
  );
};

export default B3TRChart;
