"use client";
import React, { useEffect, useState } from "react";
import { FaFilter } from "react-icons/fa";
import BalanceCard from "../../components/BalanceCard";
import BalanceHistory from "../../components/BalanceHistory";
import FilterModal from "../../components/FilterModal";
import LabelPieChart from "../../components/LabelPieChart";


const SkeletonLoader = ({ width = "100%", height = "1rem", className = "" }) => (
  <div
    className={`bg-gray-700 animate-pulse rounded ${className}`}
    style={{ width, height }}
  ></div>
);

const Dashboard = () => {
  const [wallets, setWallets] = useState([]);
  const [filteredWallets, setFilteredWallets] = useState([]);
  const [labels, setLabels] = useState([]);
  const [subLabels, setSubLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");


  // Calculate total B3TR
  const totalB3TR = filteredWallets.reduce((acc, w) => acc + Number(w.balance || 0), 0);

  useEffect(() => {
    const fetchAllData = async (forceRefresh = false) => {
      try {
        setLoading(true);

        // If cached data exists and not forcing refresh
        if (!forceRefresh) {
          const cachedWallets = sessionStorage.getItem("wallets");
          const cachedLabels = sessionStorage.getItem("labels");
          const cachedSubLabels = sessionStorage.getItem("subLabels");

          if (cachedWallets && cachedLabels && cachedSubLabels) {
            setWallets(JSON.parse(cachedWallets));
            setFilteredWallets(JSON.parse(cachedWallets));
            setLabels(JSON.parse(cachedLabels));
            setSubLabels(JSON.parse(cachedSubLabels));
            setLoading(false);
            return; // ✅ Skip API calls
          }
        }

        // Fetch all fresh data
        const [walletRes, labelRes, subLabelRes] = await Promise.all([
          fetch("/api/address"),
          fetch("/api/labels"),
          fetch("/api/labels/sublabels"),
        ]);

        const walletData = await walletRes.json();
        const labelData = await labelRes.json();
        const subLabelData = await subLabelRes.json();

        if (labelData.success) setLabels(labelData.labels);
        if (subLabelData.success) setSubLabels(subLabelData.sublabels);

        const walletsList = walletData.data || [];
        const updatedWallets = [];

        for (const wallet of walletsList) {
          const balRes = await fetch("/api/address/balance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: wallet.address }),
          });

          const balData = await balRes.json();

          updatedWallets.push({
            ...wallet,
            balance: balData?.balance || "0.00",
            symbol: balData?.symbol || "N/A",
            priceUSD: balData?.priceUSD || 0,
            pricePKR: balData?.pricePKR || 0,
            totalValueUSD: balData?.totalValueUSD || "0.00",
            totalValuePKR: balData?.totalValuePKR || "0.00",
          });

          setWallets([...updatedWallets]);
          setFilteredWallets([...updatedWallets]);

          await new Promise((r) => setTimeout(r, 150));
        }

        // ✅ Cache after success
        sessionStorage.setItem("wallets", JSON.stringify(updatedWallets));
        sessionStorage.setItem("labels", JSON.stringify(labelData.labels || []));
        sessionStorage.setItem("subLabels", JSON.stringify(subLabelData.sublabels || []));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);


  // Apply Filters
  const applyFilters = (filters) => {
    const filtered = wallets.filter((wallet) => {
      if (filters.symbol && wallet.symbol !== filters.symbol) return false;
      if (filters.minBalance && wallet.balance < filters.minBalance) return false;
      if (filters.label && wallet.label !== filters.label) return false;
      if (filters.subLabel && wallet.subLabel !== filters.subLabel) return false;
      return true;
    });

    setFilteredWallets(filtered);
    setIsFilterOpen(false);
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <BalanceCard filteredWallets={filteredWallets} totalB3TR={totalB3TR} />
      <LabelPieChart wallets={filteredWallets} />


      {/* Header + Filter Button */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-200">My Wallets</h3>
        <div className="flex gap-2 items-center justify-center">
          {/* 🔍 Search Input */}
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg text-sm transition-all"
          >
            <FaFilter />
            Filter
          </button>
          <button
            onClick={() => {
              sessionStorage.clear();
              window.location.reload();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-lg text-sm text-white"
          >
            Refresh Data
          </button>
        </div>
      </div>




     {loading ? (
  <div className="space-y-3 mb-6">
    {Array(6)
      .fill(0)
      .map((_, i) => (
        <div
          key={i}
          className="bg-gray-800/70 h-10 w-full rounded-lg animate-pulse"
        ></div>
      ))}
  </div>
) : filteredWallets.length === 0 ? (
  <p className="text-center text-gray-400 py-10">No wallets found.</p>
) : (
  <div className="overflow-x-auto bg-gray-800/60 rounded-xl shadow-lg border border-white/10">
    <table className="min-w-full text-sm text-left text-white">
      <thead className="bg-gray-700/80 text-xs uppercase text-gray-300">
        <tr>
          <th scope="col" className="px-4 py-3">#</th>
          <th scope="col" className="px-4 py-3">Name</th>
          <th scope="col" className="px-4 py-3">Address</th>
          <th scope="col" className="px-4 py-3">Label</th>
          <th scope="col" className="px-4 py-3">SubLabel</th>
          <th scope="col" className="px-4 py-3">Balance</th>
          <th scope="col" className="px-4 py-3">Symbol</th>
          <th scope="col" className="px-4 py-3">USD</th>
          <th scope="col" className="px-4 py-3">PKR</th>
          <th scope="col" className="px-4 py-3">History</th>
        </tr>
      </thead>
      <tbody>
        {filteredWallets
          .filter((wallet) =>
            wallet.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((wallet, i) => (
            <tr
              key={wallet._id}
              className={`border-t border-gray-700/50 transition-colors duration-200 hover:bg-gradient-to-r ${[
                "from-blue-500/20 via-blue-600/10 to-indigo-700/10",
                "from-purple-600/20 via-indigo-600/10 to-violet-800/10",
                "from-teal-500/20 via-emerald-600/10 to-green-700/10",
                "from-amber-500/20 via-yellow-600/10 to-orange-700/10",
              ][i % 4]
                }`}
            >
              <td className="px-4 py-3 text-gray-300">{i + 1}</td>
              <td className="px-4 py-3 font-semibold truncate max-w-[150px]">{wallet.name}</td>
              <td className="px-4 py-3 text-gray-400 truncate max-w-[160px]">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </td>
              <td className="px-4 py-3 text-emerald-300">{wallet.label || "-"}</td>
              <td className="px-4 py-3 text-gray-300">{wallet.sublabel || "-"}</td>
              <td className="px-4 py-3 font-bold text-white">{wallet.balance}</td>
              <td className="px-4 py-3 text-gray-200">{wallet.symbol}</td>
              <td className="px-4 py-3 text-emerald-200">
                ${Number(wallet.totalValueUSD || 0).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-gray-100">
                ₨{Number(wallet.totalValuePKR || 0).toLocaleString()}
              </td>
              <td className="px-4 py-3">
                <BalanceHistory address={wallet.address} />
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
)}




      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={applyFilters}
        labels={labels}
        subLabels={subLabels}
      />
    </main>
  );
};

export default Dashboard;
