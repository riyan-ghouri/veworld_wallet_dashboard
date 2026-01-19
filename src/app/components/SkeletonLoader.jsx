"use client";
import React from "react";

const SkeletonLoader = ({ width = "100%", height = "1rem", className = "" }) => {
  return (
    <div
      className={`relative overflow-hidden rounded-md bg-gray-800/60 ${className}`}
      style={{ width, height }}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-500/30 to-transparent" />
    </div>
  );
};

export default SkeletonLoader;
