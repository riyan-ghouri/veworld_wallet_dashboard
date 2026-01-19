"use client";
import React, { useState, useEffect } from "react";
import SkeletonLoader from "./components/SkeletonLoader";
import { AiOutlineCopy, AiOutlineSend } from "react-icons/ai";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const Dashboard = () => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState({
    address: "",
    vetBalance: 0,
    b3trBalance: 0,
  });

  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      try {
        // Step 1: Connect wallet → get address
        const res = await fetch("/api/wallet/connect");
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Failed to fetch wallet");

        // Step 2: Fetch balances
        const balRes = await fetch("/api/wallet/balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: data.address }),
        });
        const balData = await balRes.json();

        if (!balRes.ok) throw new Error(balData.error || "Failed to fetch balances");

        setWallet({
          address: data.address,
          vetBalance: balData.vetBalance,
          b3trBalance: balData.b3trBalance,
        });

        // Fake transactions
        setTransactions([
          { id: 1, type: "Sent", token: "VET", amount: 10, to: "0xabc..." },
          { id: 2, type: "Received", token: "B3TR", amount: 50, from: "0xdef..." },
        ]);

        toast.success("Wallet connected successfully");
      } catch (err) {
        console.error(err.message);
        toast.error(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const copyAddress = () => {
    navigator.clipboard.writeText(wallet.address.toLowerCase());
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Wallet Card */}
      <div className="bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl shadow-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center text-white transition-transform hover:scale-[1.01]">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-xl md:text-2xl tracking-wide">Wallet Address</h2>
            <button
              onClick={copyAddress}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
            >
              <AiOutlineCopy size={20} />
            </button>
          </div>
          {loading ? (
            <SkeletonLoader width="100%" height="1.5rem" className="mt-2 bg-white/30" />
          ) : (
            <p className="mt-1 text-sm md:text-base break-all">{wallet.address}</p>
          )}

          <div className="flex gap-4 mt-4">
            <div className="bg-white/20 rounded-full px-4 py-1 flex flex-col items-center">
              <p className="text-xs">VET</p>
              {loading ? (
                <SkeletonLoader width="40px" height="1rem" className="bg-white/30" />
              ) : (
                <p className="font-semibold">{wallet.vetBalance}</p>
              )}
            </div>
            <div className="bg-white/20 rounded-full px-4 py-1 flex flex-col items-center">
              <p className="text-xs">B3TR</p>
              {loading ? (
                <SkeletonLoader width="40px" height="1rem" className="bg-white/30" />
              ) : (
                <p className="font-semibold">{wallet.b3trBalance}</p>
              )}
            </div>
          </div>
        </div>

        {/* Send Button */}
        <button
          onClick={() => {
            toast("Redirecting to send page ✈️");
            router.push("/send");
          }}
          className="mt-4 md:mt-0 ml-0 md:ml-6 p-3 bg-white text-blue-600 rounded-xl hover:bg-white/90 transition shadow-lg flex items-center justify-center"
        >
          <AiOutlineSend size={24} />
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="font-bold text-xl mb-4">Transactions</h2>
        {loading ? (
          <>
            <SkeletonLoader width="100%" height="1.5rem" className="mb-3" />
            <SkeletonLoader width="100%" height="1.5rem" className="mb-3" />
            <SkeletonLoader width="100%" height="1.5rem" className="mb-3" />
          </>
        ) : transactions.length > 0 ? (
          <ul className="space-y-2">
            {transactions.map((tx) => (
              <li
                key={tx.id}
                className="flex justify-between p-3 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <span className="font-medium">
                  {tx.type} {tx.amount} {tx.token}
                </span>
                <span className="text-gray-500">{tx.to || tx.from}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No transactions yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
