"use client";
import React, { useState, useEffect } from "react";

const FilterModal = ({ isOpen, onClose, labels, subLabels, onApply }) => {
  const [selectedLabel, setSelectedLabel] = useState("");
  const [selectedSublabel, setSelectedSublabel] = useState("");
  const [filteredSublabels, setFilteredSublabels] = useState([]);

  // ✅ Update sublabels when label changes
  useEffect(() => {
    if (selectedLabel) {
      setFilteredSublabels(
        subLabels.filter((s) => s.labelname === selectedLabel)
      );
      setSelectedSublabel(""); // reset sublabel when label changes
    } else {
      setFilteredSublabels(subLabels);
    }
  }, [selectedLabel, subLabels]);

  const handleApply = () => {
    onApply({ label: selectedLabel, sublabel: selectedSublabel });
    onClose();
  };

  // ✅ Do this *after* hooks
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-96">
        <h2 className="text-xl font-bold text-white mb-4">Filter Wallets</h2>

        {/* Label Dropdown */}
        <label className="block text-sm text-gray-300 mb-2">Label</label>
        <select
          className="w-full p-2 rounded bg-gray-700 text-white mb-4"
          value={selectedLabel}
          onChange={(e) => setSelectedLabel(e.target.value)}
        >
          <option value="">-- Select Label --</option>
          {labels?.map((l) => (
            <option key={l._id} value={l.labelname}>
              {l.labelname}
            </option>
          ))}
        </select>

        {/* Sublabel Dropdown */}
        <label className="block text-sm text-gray-300 mb-2">Sublabel</label>
        <select
          className="w-full p-2 rounded bg-gray-700 text-white mb-6"
          value={selectedSublabel}
          onChange={(e) => setSelectedSublabel(e.target.value)}
          disabled={!selectedLabel}
        >
          <option value="">-- Select Sublabel --</option>
          {filteredSublabels.map((s) => (
            <option key={s._id} value={s.sublabel}>
              {s.sublabel}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-500"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
