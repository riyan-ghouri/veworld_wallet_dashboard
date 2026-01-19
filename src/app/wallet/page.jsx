"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, X, Edit3, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useSearch } from "../../../context/SearchContext"; // ✅ import shared search

export default function WalletPage() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    key: "",
    stakedAccount: "",
  });
  const [editingWallet, setEditingWallet] = useState(null);
  const [balances, setBalances] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const { searchQuery } = useSearch(); // ✅ get search term from header

  // 🟢 Fetch wallets
  const fetchWallets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/extra_veworld");
      if (!res.ok) throw new Error("Failed to fetch wallets");
      const data = await res.json();
      setWallets(data || []);
    } catch (err) {
      toast.error("Error loading wallets.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  // 🟢 Fetch B3TR balances
  const fetchBalances = async () => {
    if (wallets.length === 0) return;
    setRefreshing(true);

    try {
      const newBalances = {};
      for (const wallet of wallets) {
        try {
          const res = await fetch("/api/extra_veworld/get-b3tr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: wallet.address }),
          });
          const data = await res.json();
          newBalances[wallet._id] = data?.balance ?? 0;
        } catch {
          newBalances[wallet._id] = 0;
        }

        // Fetch stake address balance
        if (wallet.stakedAccount) {
          try {
            const res = await fetch("/api/extra_veworld/get-b3tr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ address: wallet.stakedAccount }),
            });
            const data = await res.json();
            newBalances[`${wallet._id}_stake`] = data?.balance ?? 0;
          } catch {
            newBalances[`${wallet._id}_stake`] = 0;
          }
        }
      }
      setBalances(newBalances);
    } catch (err) {
      console.error("Balance fetch error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [wallets]);

  // 🟢 Input handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🟢 Save (Add/Edit)
  const saveWallet = async () => {
    const { name, key, stakedAccount } = formData;
    if (!name || !key) return toast.error("Please fill in all required fields!");

    try {
      const url = editingWallet
        ? `/api/extra_veworld?id=${editingWallet._id}`
        : "/api/extra_veworld";
      const method = editingWallet ? "PUT" : "POST";
      const payload = editingWallet
        ? { name, key, stakedAccount }
        : { name, key };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      toast.success(editingWallet ? "Wallet updated!" : "Wallet added!");
      setFormData({ name: "", key: "", stakedAccount: "" });
      setEditingWallet(null);
      setShowModal(false);
      fetchWallets();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 🟢 Delete
  const deleteWallet = async (id) => {
    if (!confirm("Are you sure you want to delete this wallet?")) return;
    try {
      const res = await fetch(`/api/extra_veworld?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete wallet");
      toast.success("Wallet deleted!");
      fetchWallets();
    } catch (err) {
      toast.error(err.message);
    }
  };

  // 🟢 Edit mode
  const startEdit = (wallet) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      key: wallet.key,
      stakedAccount: wallet.stakedAccount || "",
    });
    setShowModal(true);
  };

  // 🟢 Close modal
  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: "", key: "", stakedAccount: "" });
    setEditingWallet(null);
  };

  const truncate = (addr) =>
    addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : "—";

  // 🟢 Filter wallets by search
  const filteredWallets = wallets.filter((wallet) => {
    const term = searchQuery.toLowerCase();
    return (
      wallet.name.toLowerCase().includes(term) ||
      wallet.address.toLowerCase().includes(term) ||
      (wallet.stakedAccount && wallet.stakedAccount.toLowerCase().includes(term))

    );
  });

  // 🟢 Helper: Determine readiness + days info
  const getReadyStatus = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, 7 - diffDays);
    const ready = diffDays >= 7;
    return { ready, diffDays, daysLeft };
  };



  return (
    <div className="min-h-screen bg-[#0F1218] text-gray-200">

      <main className="px-8 py-10">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#00E6C3]">My Wallets</h1>
            <p className="text-gray-400 text-sm">
              Manage your wallet names, addresses, and B3TR balances.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchBalances}
              disabled={refreshing}
              className="flex items-center gap-2 border border-gray-700 px-4 py-2 rounded-xl text-gray-300 hover:bg-[#1B2028] transition"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#00E6C3] text-black px-4 py-2 rounded-xl font-medium hover:bg-[#00bfa3] transition"
            >
              <Plus className="w-4 h-4" /> Add Wallet
            </button>
          </div>
        </div>

        {/* Wallet Table */}
        <div className="overflow-x-auto bg-[#161B22] rounded-xl border border-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-[#1B2028]">
              <tr className="text-left text-gray-400 uppercase text-xs">
                <th className="py-3 px-5">#</th>
                <th className="py-3 px-5">Name</th>
                <th className="py-3 px-5">Main Address</th>
                <th className="py-3 px-5">Main Balance</th>
                <th className="py-3 px-5">Stake Address</th>
                <th className="py-3 px-5">Stake Balance</th>
                <th className="py-3 px-5">Ready</th>

                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500">
                    Loading wallets...
                  </td>
                </tr>
              ) : filteredWallets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-gray-500 italic">
                    No wallets found.
                  </td>
                </tr>
              ) : (
                filteredWallets.map((wallet, i) => (
                  <tr
                    key={wallet._id}
                    className="border-t border-gray-800 hover:bg-[#1C222C] transition"
                  >
                    <td className="py-3 px-5 text-gray-400">{i + 1}</td>
                    <td className="py-3 px-5 font-semibold text-gray-100">
                      {wallet.name}
                    </td>
                    <td className="py-3 px-5 font-mono text-[#00E6C3] truncate max-w-[220px]">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(wallet.address);
                          // Optional: subtle feedback
                        }}
                        className="hover:text-emerald-300 cursor-pointer transition"
                        title="Click to copy address"
                      >
                        {truncate(wallet.address)}
                      </button>
                    </td>

                    <td className="py-3 px-5 text-emerald-400 font-semibold">
                      {balances[wallet._id] !== undefined
                        ? `${balances[wallet._id].toFixed(4)} B3TR`
                        : "—"}
                    </td>
                    <td className="py-3 px-5 font-mono text-[#5BE5D2] truncate max-w-[220px]">
                      {truncate(wallet.stakedAccount)}
                    </td>
                    <td className="py-3 px-5 text-teal-400 font-semibold">
                      {balances[`${wallet._id}_stake`] !== undefined
                        ? `${balances[`${wallet._id}_stake`].toFixed(4)} B3TR`
                        : "—"}
                    </td>
                    <td className="py-3 px-5 text-center">
                      {(() => {
                        const { ready, diffDays, daysLeft } = getReadyStatus(wallet.createdAt);
                        return (
                          <div
                            className={`flex flex-col items-center justify-center`}
                            title={
                              ready
                                ? `Ready (created ${diffDays} days ago)`
                                : `Not Ready (${daysLeft} days left)`
                            }
                          >
                            <div
                              className={`w-3 h-3 rounded-full ${ready ? "bg-green-500" : "bg-red-500"
                                }`}
                            ></div>
                            <span className="text-[10px] text-gray-400 mt-1">
                              {ready ? `${diffDays}d` : `${daysLeft}d left`}
                            </span>
                          </div>
                        );
                      })()}
                    </td>


                    <td className="py-3 px-5 text-right flex justify-end gap-3">
                      <button
                        onClick={() => startEdit(wallet)}
                        className="p-2 hover:bg-[#1D2A1D] rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4 text-emerald-400" />
                      </button>
                      <button
                        onClick={() => deleteWallet(wallet._id)}
                        className="p-2 hover:bg-[#2B1C1C] rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#161B22] p-6 rounded-2xl w-[90%] max-w-md border border-gray-700 relative">
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-[#00E6C3] mb-4">
              {editingWallet ? "Edit Wallet" : "Add New Wallet"}
            </h2>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                name="name"
                placeholder="Wallet Name"
                value={formData.name}
                onChange={handleChange}
                className="bg-transparent border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#00E6C3]"
              />
              <textarea
                name="key"
                placeholder="Wallet Key (12-word phrase)"
                value={formData.key}
                onChange={handleChange}
                rows={3}
                className="bg-transparent border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#00E6C3] resize-none"
              />
              {editingWallet && (
                <input
                  type="text"
                  name="stakedAccount"
                  placeholder="Staked Wallet Address"
                  value={formData.stakedAccount}
                  onChange={handleChange}
                  className="bg-transparent border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#00E6C3]"
                />
              )}
              <button
                onClick={saveWallet}
                className="mt-2 bg-[#00E6C3] text-black px-5 py-2 rounded-lg font-semibold hover:bg-[#00bfa3] transition"
              >
                {editingWallet ? "Update Wallet" : "Save Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
