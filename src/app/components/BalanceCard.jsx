"use client";
import React, { useState } from "react";
import {
  FaArrowUp,
  FaEllipsisV,
  FaPlus,
  FaEye,
  FaTags,
  FaFilter,
} from "react-icons/fa";

const BalanceCard = ({
  filteredWallets,
  totalB3TR,
  setShowModal,
  setShowLabelModal,
  setShowFilterModal,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  // Calculate totals safely
  const totalUSD = filteredWallets
    ?.reduce((acc, w) => acc + Number(w.totalValueUSD || 0), 0)
    ?.toFixed(2);
  const totalPKR = filteredWallets
    ?.reduce((acc, w) => acc + Number(w.totalValuePKR || 0), 0)
    ?.toFixed(2);

  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-5 sm:p-6 mt-2 rounded-2xl mb-6 shadow-2xl border border-gray-700/60 backdrop-blur-md overflow-hidden group transition-all duration-500 hover:shadow-emerald-500/10 hover:-translate-y-1">
      {/* Subtle glowing accent */}
      <div className="absolute -top-20 -right-20 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl opacity-30 group-hover:opacity-60 transition duration-700" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-sm sm:text-base font-semibold text-gray-400 uppercase tracking-widest">
          Total Balance
        </h2>

        {/* Dropdown Trigger */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition"
          >
            <FaEllipsisV />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-44 bg-gray-800/95 border border-gray-700 rounded-xl shadow-lg backdrop-blur-md z-20 overflow-hidden animate-fadeIn">
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-emerald-600/60 transition"
                onClick={() => {
                  setShowModal(true);
                  setShowDropdown(false);
                }}
              >
                <FaPlus /> Add Wallet
              </button>
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/70 transition"
                onClick={() => setShowDropdown(false)}
              >
                <FaEye /> View Details
              </button>
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-blue-600/60 transition"
                onClick={() => {
                  setShowLabelModal(true);
                  setShowDropdown(false);
                }}
              >
                <FaTags /> New Label
              </button>
              <button
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-white hover:bg-purple-600/60 transition"
                onClick={() => {
                  setShowFilterModal(true);
                  setShowDropdown(false);
                }}
              >
                <FaFilter /> Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Balance Section */}
      <div className="mt-4 sm:mt-5 text-center sm:text-left">
        <p className="text-4xl sm:text-5xl font-extrabold flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
          <span className="bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent drop-shadow-md">
            ${totalUSD}
          </span>
          <span className="text-lg sm:text-xl text-gray-400 font-medium">
            PKR {totalPKR}
          </span>
        </p>
      </div>

      {/* Growth + Total Tokens */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-3 sm:gap-0">
        <p className="text-sm font-medium text-gray-300 flex items-center gap-2">
          <span className="bg-gray-800/60 px-3 py-1.5 rounded-xl shadow-inner border border-gray-700">
            Total:
            <span className="ml-2 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent font-semibold text-base">
              {totalB3TR.toFixed(2)} B3TR
            </span>
          </span>
        </p>

        <p className="text-green-400 flex items-center gap-1 text-sm font-semibold">
          <FaArrowUp className="animate-pulse" /> +5.24%
        </p>
      </div>
    </div>
  );
};

export default BalanceCard;
