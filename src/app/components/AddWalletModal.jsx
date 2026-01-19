"use client";
import React, { useState } from "react";

const AddWalletModal = ({
    isOpen,
    onClose,
    onSave,
    labels,
    subLabels,
}) => {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [selectedLabel, setSelectedLabel] = useState("");
    const [selectedSubLabel, setSelectedSubLabel] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !address.trim() || !selectedLabel || !selectedSubLabel) {
            alert("Name, Address, Label, and SubLabel are required!");
            return;
        }

        setLoading(true);
        try {
            // find actual objects from arrays
            const labelObj = labels.find((l) => l._id === selectedLabel);
            const subLabelObj = subLabels.find((s) => s._id === selectedSubLabel);

            const res = await fetch("/api/address", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address,
                    name,
                    label: labelObj?.labelname || "",   // send label string
                    sublabel: subLabelObj?.sublabel || "", // send sublabel string
                }),
            });

            const data = await res.json();
            if (data.success) {
                onSave(data.data);
                setName("");
                setAddress("");
                setSelectedLabel("");
                setSelectedSubLabel("");
                onClose();
            } else {
                alert(data.error || "Failed to add wallet");
            }
        } catch (err) {
            console.error("Error adding wallet:", err);
            alert("Server error");
        } finally {
            setLoading(false);
        }
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-gray-900 p-6 rounded-2xl w-[95%] sm:w-[400px] shadow-2xl border border-gray-700">
                <h2 className="text-xl font-bold mb-5 text-white flex items-center gap-2">
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Add Wallet
                </h2>

                <div className="space-y-4">
                    {/* Wallet Name */}
                    <input
                        type="text"
                        placeholder="Wallet Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-400 outline-none border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                    />

                    {/* Wallet Address */}
                    <input
                        type="text"
                        placeholder="Wallet Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-400 outline-none border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                    />

                    {/* Select Label */}
                    <div>
                        <p className="text-sm text-gray-400 mb-2">Select Label</p>
                        <select
                            value={selectedLabel}
                            onChange={(e) => setSelectedLabel(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                        >
                            <option value="">-- Choose Label --</option>
                            {labels?.map((lbl) => (
                                <option key={lbl._id} value={lbl._id}>
                                    {lbl.labelname}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Select SubLabel */}
                    {/* Select SubLabel */}
                    <div>
                        <p className="text-sm text-gray-400 mb-2">Select SubLabel</p>
                        <select
                            value={selectedSubLabel}
                            onChange={(e) => setSelectedSubLabel(e.target.value)}
                            disabled={!selectedLabel} // disable if no label selected
                            className="w-full px-3 py-2 rounded-lg bg-gray-800 text-gray-100 border border-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 transition disabled:opacity-50"
                        >
                            <option value="">-- Choose SubLabel --</option>
                            {subLabels
                                ?.filter((sub) => sub.labelname === labels.find((l) => l._id === selectedLabel)?.labelname)
                                .map((sub) => (
                                    <option key={sub._id} value={sub._id}>
                                        {sub.sublabel}
                                    </option>
                                ))}
                        </select>
                    </div>

                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 shadow-md hover:shadow-green-500/30 transition disabled:opacity-50"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "Saving..." : "+ Add Wallet"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddWalletModal;
