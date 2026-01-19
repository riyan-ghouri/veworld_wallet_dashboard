"use client";

import React, { useEffect, useState } from "react";
import SkeletonLoader from "./SkeletonLoader";

const BalanceHistory = ({ address }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!address) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/last_balance?address=${address}`);
        const json = await res.json();

        if (!res.ok) throw new Error(json.message || "Failed to fetch");
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address]);

  if (!address)
    return (
      <div className="p-2 text-gray-500 italic text-xs bg-gray-50 rounded-md border border-gray-200">
        ⚠️ No wallet address
      </div>
    );

  if (loading)
    return (
      <div className="grid grid-cols-2 gap-1.5 max-w-[130px]">
        {[...Array(2)].map((_, i) => (
          <div
            key={i}
            className="bg-white/80 shadow-sm rounded-lg p-2 border border-gray-100"
          >
            <SkeletonLoader width="70%" height="1rem" />
            <SkeletonLoader width="50%" height="0.8rem" className="mt-1" />
          </div>
        ))}
      </div>
    );

  if (error)
    return (
      <div className="p-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-md">
        ❌ {error}
      </div>
    );

  if (!data)
    return (
      <div className="p-2 text-gray-500 italic text-xs bg-gray-50 rounded-md border border-gray-200">
        No data
      </div>
    );

  const { received_24h, sent_24h } = data;

  return (
    <div className="grid grid-cols-2 gap-1.5 max-w-[130px]">
      {/* Received Box */}
      <div className="bg-gradient-to-b from-emerald-50 to-white rounded-lg p-2 border border-emerald-100 shadow-sm hover:shadow-md transition-all duration-200">
        <h3 className="text-emerald-600 font-medium text-xs flex items-center gap-0.5">
          🡅 In
        </h3>
        <p className="text-base font-bold text-emerald-700 mt-0.5 leading-tight">
          {received_24h.total}
        </p>
      </div>

      {/* Sent Box */}
      <div className="bg-gradient-to-b from-rose-50 to-white rounded-lg p-2 border border-rose-100 shadow-sm hover:shadow-md transition-all duration-200">
        <h3 className="text-rose-600 font-medium text-xs flex items-center gap-0.5">
          🡇 Out
        </h3>
        <p className="text-base font-bold text-rose-700 mt-0.5 leading-tight">
          {sent_24h.total}
        </p>
      </div>
    </div>
  );
};

export default BalanceHistory;
