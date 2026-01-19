"use client";
import React, { useEffect, useState } from "react";
import { FaSyncAlt, FaPaperPlane } from "react-icons/fa";
import { IoQrCodeOutline } from "react-icons/io5";
import B3TRChart from "../components/B3TRChart";
import VeChainExplorer from "../components/Transfer";
import CreateLabelModal from "../components/CreateLabelModal";
import AddWalletModal from "../components/AddWalletModal";
import FilterModal from "../components/FilterModal";
import BalanceCard from "../components/BalanceCard";
import QrPopup from "../components/QrPopup";
import NotesPopup from "../components/MessagesModal"; // 📝 import Notes popup
import { FaRegStickyNote } from "react-icons/fa"; // icon for note
import BalanceHistory from "../components/BalanceHistory";


const SkeletonLoader = ({ width = "100%", height = "1rem", className = "" }) => {
  return (
    <div
      className={`bg-gray-700 animate-pulse rounded ${className}`}
      style={{ width, height }}
    ></div>
  );
};

const Dashboard = () => {
  const [wallets, setWallets] = useState([]);
  const [filteredWallets, setFilteredWallets] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [refreshing, setRefreshing] = useState({});
  const [explorerAddress, setExplorerAddress] = useState("");
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labels, setLabels] = useState([]);
  const [subLabels, setSubLabels] = useState([]);

  // 🔹 QR Popup state
  const [qrData, setQrData] = useState({ isOpen: false, address: "", walletName: "", token: "" });
  const [notesData, setNotesData] = useState({ isOpen: false, address: "" });


  // Calculate total B3TR tokens
  const totalB3TR = filteredWallets.reduce(
    (acc, w) => acc + Number(w.balance || 0),
    0
  );

  // Fetch all wallets
  useEffect(() => {
    const fetchWalletsSequentially = async () => {
      try {
        setLoading(true);

        // 1️⃣ Fetch wallets first
        const res = await fetch("/api/address");
        const result = await res.json();

        if (!result.success || !result.data?.length) {
          setWallets([]);
          setFilteredWallets([]);
          setLoading(false);
          return;
        }

        // Initialize UI with empty balances
        setWallets(result.data);
        setFilteredWallets(result.data);

        // 2️⃣ Loop through wallets one by one (sequential)
        const updatedWallets = [];

        for (const wallet of result.data) {
          // Update one wallet’s balance
          const balRes = await fetch("/api/address/balance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: wallet.address }),
          });

          const balData = await balRes.json();

          const updatedWallet = {
            ...wallet,
            balance: balData?.balance || "0.00",
            symbol: balData?.symbol || "N/A",
            priceUSD: balData?.priceUSD || 0,
            pricePKR: balData?.pricePKR || 0,
            totalValueUSD: balData?.totalValueUSD || "0.00",
            totalValuePKR: balData?.totalValuePKR || "0.00",
          };

          updatedWallets.push(updatedWallet);

          // ⚡ Update the UI progressively
          setWallets([...updatedWallets]);
          setFilteredWallets([...updatedWallets]);

          // Optional: small delay to avoid rate limit (100–200ms)
          await new Promise((r) => setTimeout(r, 150));
        }
      } catch (err) {
        console.error("Error fetching wallets sequentially:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletsSequentially();
  }, []);


  // apply filter (frontend only)
  const handleApplyFilter = ({ label, sublabel }) => {
    let filtered = wallets;
    if (label) filtered = filtered.filter((w) => w.label === label);
    if (sublabel) filtered = filtered.filter((w) => w.sublabel === sublabel);
    setFilteredWallets(filtered);
  };

  // Refresh balance of a single wallet
  const handleRefresh = async (walletId, address) => {
    try {
      setRefreshing((prev) => ({ ...prev, [walletId]: true }));
      const balRes = await fetch("/api/address/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const balData = await balRes.json();

      setWallets((prev) =>
        prev.map((w) =>
          w._id === walletId
            ? {
              ...w,
              balance: balData?.balance || "0.00",
              symbol: balData?.symbol || w.symbol,
              priceUSD: balData?.priceUSD || 0,
              pricePKR: balData?.pricePKR || 0,
              totalValueUSD: balData?.totalValueUSD || "0.00",
              totalValuePKR: balData?.totalValuePKR || "0.00",
            }
            : w
        )
      );
    } catch (err) {
      console.error("Error refreshing balance:", err);
    } finally {
      setRefreshing((prev) => ({ ...prev, [walletId]: false }));
    }
  };

  // Fetch labels and sublabels
  useEffect(() => {
    const fetchLabelsAndSublabels = async () => {
      try {
        const resLabels = await fetch("/api/labels");
        const labelsData = await resLabels.json();
        if (labelsData.success) setLabels(labelsData.labels);

        const resSubLabels = await fetch("/api/labels/sublabels");
        const subLabelsData = await resSubLabels.json();
        if (subLabelsData.success) setSubLabels(subLabelsData.sublabels);
      } catch (err) {
        console.error("Error fetching labels/sublabels:", err);
      }
    };
    fetchLabelsAndSublabels();
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <B3TRChart />

      <BalanceCard
        filteredWallets={filteredWallets}
        totalB3TR={totalB3TR}
        setShowModal={setShowModal}
        setShowLabelModal={setShowLabelModal}
        setShowFilterModal={setShowFilterModal}
      />

      <h3 className="text-lg font-bold text-gray-200 mb-4">My Wallets</h3>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-gray-800/70 rounded-2xl p-5 shadow-md flex flex-col gap-3 animate-pulse"
              >
                <SkeletonLoader width="60%" height="1.2rem" />
                <SkeletonLoader width="40%" height="1rem" />
                <SkeletonLoader width="80%" height="2rem" />
                <SkeletonLoader width="50%" height="1.5rem" />
              </div>
            ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          {filteredWallets.map((wallet, i) => (
            <div
              key={wallet._id}
              className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 shadow-xl transition-all duration-300 
    hover:scale-[1.02] hover:shadow-2xl group border border-white/10 
    ${[
                  "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700",
                  "bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-800",
                  "bg-gradient-to-br from-teal-500 via-emerald-600 to-green-700",
                  "bg-gradient-to-br from-amber-500 via-yellow-600 to-orange-700",
                ][i % 4]}`}
            >
              {/* Floating Action Buttons */}
              <div className="absolute top-3 right-3 flex flex-col sm:flex-row gap-2 z-10">
                {[
                  { icon: FaPaperPlane, action: () => setExplorerAddress(wallet.address) },
                  {
                    icon: FaRegStickyNote,
                    action: () =>
                      setNotesData({ isOpen: true, address: wallet.address }),
                  },
                  {
                    icon: IoQrCodeOutline,
                    action: () =>
                      setQrData({
                        isOpen: true,
                        address: wallet.address,
                        walletName: wallet.name,
                        token: `${wallet.balance} ${wallet.symbol}`,
                      }),
                  },
                  {
                    icon: FaSyncAlt,
                    action: () => handleRefresh(wallet._id, wallet.address),
                    spin: refreshing[wallet._id],
                  },
                ].map(({ icon: Icon, action, spin }, idx) => (
                  <button
                    key={idx}
                    onClick={action}
                    disabled={spin}
                    className="bg-black/30 hover:bg-black/50 active:scale-90 backdrop-blur-md 
          border border-white/10 p-2.5 rounded-full text-white transition-all 
          hover:shadow-md hover:shadow-black/40"
                  >
                    <Icon
                      size={14}
                      className={`${spin ? "animate-spin" : ""}`}
                    />
                  </button>
                ))}
              </div>

              {/* Wallet Header */}
              <div className="mb-4 mt-10 sm:mt-2">
                <p className="text-lg sm:text-xl font-semibold text-white tracking-tight flex items-center justify-between gap-2">
                  <span className="truncate max-w-[110px] sm:max-w-[160px]">
                    {wallet.name}
                  </span>
                </p>
                <p className="text-xs text-white/70 truncate">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </p>
              </div>

              {/* Balance Section */}
              <div className="mt-3 sm:mt-4">
                <p className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-md tracking-tight flex flex-wrap items-baseline gap-1">
                  {wallet.balance}
                  <span className="text-white/80 text-xs sm:text-sm ml-1">
                    {wallet.symbol}
                  </span>
                </p>
                <p className="text-xs sm:text-sm text-white/80 mt-1">
                  <span className="text-emerald-200 font-semibold">
                    ${Number(wallet.totalValueUSD || 0).toLocaleString()}
                  </span>{" "}
                  <span className="text-gray-100/80">
                    / ₨{Number(wallet.totalValuePKR || 0).toLocaleString()}
                  </span>
                </p>
              </div>

              {/* Divider */}
              <div className="my-4 sm:my-5 h-[1px] bg-white/20" />

              {/* Balance History Section */}
              <div className="flex items-center justify-between">
                <BalanceHistory address={wallet.address} />
              </div>

              {/* Subtle light overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-20 pointer-events-none" />
            </div>

          ))}
        </div>


      )}

      {/* Modals */}
      <AddWalletModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={(newWallet) => setWallets((prev) => [...prev, newWallet])}
        labels={labels}
        subLabels={subLabels}
      />

      {explorerAddress && <VeChainExplorer address={explorerAddress} />}

      <CreateLabelModal
        isOpen={showLabelModal}
        onClose={() => setShowLabelModal(false)}
        onSave={(data) => console.log("Saved label:", data)}
      />

      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        labels={labels}
        subLabels={subLabels}
        onApply={handleApplyFilter}
      />

      {/* QR Popup */}
      <QrPopup
        isOpen={qrData.isOpen}
        onClose={() => setQrData({ isOpen: false, address: "", walletName: "", token: "" })}
        address={qrData.address}
        walletName={qrData.walletName}
        token={qrData.token}
      />
      {/* Notes Popup */}
      <NotesPopup
        isOpen={notesData.isOpen}
        onClose={() => setNotesData({ isOpen: false, address: "" })}
        address={notesData.address}
      />

    </main>
  );
};

export default Dashboard;
