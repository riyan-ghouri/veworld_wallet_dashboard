"use client";
import React, { useState, useEffect } from "react";
import { FaSyncAlt, FaExternalLinkAlt, FaSearch } from "react-icons/fa";

const VeChainExplorer = ({ address: initialAddress }) => {
  const [address, setAddress] = useState(initialAddress || "");
  const [currentUrl, setCurrentUrl] = useState(
    initialAddress
      ? `https://explore.vechain.org/accounts/${initialAddress}/transfer`
      : ""
  );
  const [loading, setLoading] = useState(false);

  // 🔥 Update state when parent sends new address
  useEffect(() => {
    if (initialAddress) {
      setAddress(initialAddress);
      setCurrentUrl(
        `https://explore.vechain.org/accounts/${initialAddress}/transfer`
      );
    }
  }, [initialAddress]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (address.trim()) {
      setCurrentUrl(
        `https://explore.vechain.org/accounts/${address.trim()}/transfer`
      );
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setCurrentUrl((prev) => prev); // trigger iframe reload
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <div className="w-full h-[85vh] bg-gray-900 rounded-xl shadow-lg flex flex-col">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-3 bg-gray-800 rounded-t-xl">
        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="flex items-center bg-gray-700 rounded-lg px-2 flex-1 max-w-lg"
        >
          <FaSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter VeChain address..."
            className="bg-transparent flex-1 outline-none text-sm text-white py-2"
          />
        </form>

        {/* Action buttons */}
        <div className="flex gap-2 ml-3">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition"
          >
            <FaSyncAlt
              className={`text-white ${loading ? "animate-spin" : ""}`}
            />
          </button>
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-green-600 hover:bg-green-500 transition"
          >
            <FaExternalLinkAlt className="text-white" />
          </a>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1">
        <iframe
          key={currentUrl} // forces reload when URL changes
          src={currentUrl}
          className="w-full h-full border-0 rounded-b-xl"
          title="VeChain Explorer"
        />
      </div>
    </div>
  );
};

export default VeChainExplorer;
