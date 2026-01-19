"use client";

import React, { useState, useEffect } from "react";

const Page = () => {
  const [to, setTo] = useState("");
  const [symbol, setSymbol] = useState("B3TR");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("Calculating...");
  const [txDetails, setTxDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);

  // Mock function to estimate fee (in VTHO)
  const estimateFee = (tokenSymbol) => {
    if (tokenSymbol === "VET") return "0.00042 VTHO";
    if (tokenSymbol === "B3TR") return "0.00052 VTHO";
    return "0.0005 VTHO";
  };

  useEffect(() => {
    setFee(estimateFee(symbol));
  }, [symbol]);

  const handleTransfer = async () => {
    if (!to || !amount) return alert("Please fill all fields!");
    setLoading(true);
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, amount, symbol }),
      });
      const data = await res.json();
      setTxDetails(data);
      setShowPopup(true);
    } catch (err) {
      console.error(err);
      alert("Transaction failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Send Token</h2>

        <label className="block mb-2">Recipient Address:</label>
        <input
          type="text"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="0x..."
          className="w-full p-2 border rounded mb-4"
        />

        <label className="block mb-2">Token:</label>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        >
          <option value="B3TR">B3TR</option>
          <option value="VET">VET</option>
        </select>

        <label className="block mb-2">Amount:</label>
        <input
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />

        <p className="mb-4 text-sm text-gray-600">
          Estimated Fee: <span className="font-medium">{fee}</span>
        </p>

        <button
          onClick={handleTransfer}
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>

      {/* Popup for transaction details */}
      {showPopup && txDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg relative">
            <h3 className="text-lg font-bold mb-4">Transaction Details</h3>
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(txDetails, null, 2)}
            </pre>
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-2 text-red-500 font-bold"
            >
              X
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Page;
