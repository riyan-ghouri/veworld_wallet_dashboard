"use client";
import React from "react";
import { QRCodeCanvas } from "qrcode.react";
import { IoClose, IoCopyOutline } from "react-icons/io5";
import toast from "react-hot-toast";

const QrPopup = ({ address, walletName, token, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    toast.success("Wallet address copied!");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      {/* Modal box */}
      <div className="bg-gray-900 rounded-2xl shadow-lg p-6 w-96 relative border border-gray-700">
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          onClick={onClose}
        >
          <IoClose size={22} />
        </button>

        <h2 className="text-xl font-bold text-white text-center mb-4">
          Wallet QR Code
        </h2>

        {/* Wallet Info */}
        <div className="text-center mb-4">
          <p className="text-lg font-semibold text-green-400">{walletName}</p>
          <p className="text-sm text-gray-400">Token: {token}</p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center p-6 bg-white rounded-xl shadow-inner">
          <QRCodeCanvas
            value={address}
            size={200}
            bgColor="#ffffff"
            fgColor="#0f172a" // dark slate color
            level="H"
            includeMargin={true}
            className="rounded-lg"
          />
        </div>

        {/* Address + Copy */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <p className="text-sm text-gray-300 text-center break-all">{address}</p>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white transition"
            title="Copy Address"
          >
            <IoCopyOutline size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrPopup;
