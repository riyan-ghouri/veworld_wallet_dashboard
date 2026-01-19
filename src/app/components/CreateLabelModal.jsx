"use client";
import React, { useState, useEffect } from "react";

const CreateLabelModal = ({ isOpen, onClose, onSave }) => {
  const [type, setType] = useState("label"); // label or sublabel
  const [name, setName] = useState("");
  const [labelname, setLabelname] = useState(""); // parent label for sublabel
  const [labels, setLabels] = useState([]); // fetched labels for dropdown
  const [loading, setLoading] = useState(false);

  // ✅ Fetch labels when modal opens
  useEffect(() => {
    if (isOpen && type === "sublabel") {
      fetch("/api/labels")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setLabels(data.labels);
        })
        .catch((err) => console.error("Error fetching labels:", err));
    }
  }, [isOpen, type]);

  const handleSubmit = async () => {
    if (!name.trim()) return alert("Name is required!");

    setLoading(true);

    let payload = {};
    let endpoint = "";

    if (type === "label") {
      payload = { labelname: name };
      endpoint = "/api/labels";
    } else {
      if (!labelname) {
        alert("Please select a parent label");
        setLoading(false);
        return;
      }
      payload = { labelname, sublabel: name };
      endpoint = "/api/labels/sublabels";
    }

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        onSave(data.label || data.sublabel);
        setName("");
        setLabelname("");
        onClose();
      } else {
        alert(data.error || "Failed to save");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-gray-900 text-white rounded-xl shadow-xl p-6 w-96 border border-gray-700">
        <h2 className="text-xl font-bold mb-4 text-green-400">
          Create New {type === "label" ? "Label" : "SubLabel"}
        </h2>

        {/* Type Selector */}
        <div className="mb-4">
          <label className="block mb-1 text-sm text-gray-300">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg px-3 py-2 bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-green-500 outline-none"
          >
            <option value="label">Label</option>
            <option value="sublabel">SubLabel</option>
          </select>
        </div>

        {/* Parent Label Dropdown (only for sublabels) */}
        {type === "sublabel" && (
          <div className="mb-4">
            <label className="block mb-1 text-sm text-gray-300">
              Parent Label
            </label>
            <select
              value={labelname}
              onChange={(e) => setLabelname(e.target.value)}
              className="w-full rounded-lg px-3 py-2 bg-gray-800 border border-gray-700 text-white focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">Select Label</option>
              {labels.map((lbl) => (
                <option key={lbl._id} value={lbl.labelname}>
                  {lbl.labelname}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Name Field */}
        <div className="mb-4">
          <label className="block mb-1 text-sm text-gray-300">
            {type === "label" ? "Label Name" : "SubLabel Name"}
          </label>
          <input
            type="text"
            placeholder={`Enter ${type} name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg px-3 py-2 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white shadow-md hover:shadow-green-500/30 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateLabelModal;
