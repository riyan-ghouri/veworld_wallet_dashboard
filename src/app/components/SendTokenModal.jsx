"use client";
import { useState } from "react";

export default function SendTokenModal({ isOpen, onClose, wallet }) {
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const res = await fetch("/api/wallet/transfer/b3tr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toAddress,
          amount,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTxHash(data.txHash);
        console.log("✅ Transaction hash:", data.txHash);
      } else {
        setError(data.error || "Transaction failed");
        console.error("❌ Error:", data.error);
      }
    } catch (err) {
      setError("Unexpected error occurred");
      console.error("⚠️ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Send Token from {wallet?.name}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* To Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Address
            </label>
            <input
              type="text"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (B3TR)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
              min="0"
              step="any"
            />
          </div>

          {/* Status */}
          {loading && <p className="text-blue-500 text-sm">Sending transaction...</p>}
          {txHash && (
            <p className="text-green-600 text-sm break-words">
              ✅ Sent! Tx Hash: {txHash}
            </p>
          )}
          {error && <p className="text-red-500 text-sm">❌ {error}</p>}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!toAddress || !amount || loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
