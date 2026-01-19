"use client";
import { useState } from "react";
import { Search, Sun, Moon, Menu } from "lucide-react";
import Link from "next/link";
import { useSearch } from "../../../context/SearchContext"; // ✅ connect context

export default function Header() {
  const [darkMode, setDarkMode] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const { searchQuery, setSearchQuery } = useSearch(); // ✅ use context

  const toggleTheme = () => setDarkMode(!darkMode);
  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header
      className={`flex items-center justify-between w-full px-6 py-3 border-b relative ${
        darkMode ? "border-gray-800 bg-[#0F1218]" : "border-gray-200 bg-white"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="text-[#00E6C3] font-bold text-xl">VE</div>
        <span
          className={`text-lg font-semibold ${
            darkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Wallet
        </span>
      </div>

      {/* Search Input (connected to context) */}
      <div
        className={`hidden md:flex items-center rounded-xl px-3 py-2 w-80 ${
          darkMode ? "bg-[#161B22]" : "bg-gray-100"
        }`}
      >
        <Search
          className={`w-4 h-4 mr-2 ${
            darkMode ? "text-gray-400" : "text-gray-600"
          }`}
        />
        <input
          type="text"
          placeholder="Search wallets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`bg-transparent w-full outline-none text-sm ${
            darkMode
              ? "text-gray-300 placeholder-gray-500"
              : "text-gray-800 placeholder-gray-500"
          }`}
        />
      </div>

      {/* Menu + Theme */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-[#161B22] transition"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-700" />
          )}
        </button>

        <div className="relative">
          <button
            onClick={toggleMenu}
            className="p-2 rounded-full hover:bg-[#161B22] transition"
          >
            <Menu className="w-5 h-5 text-gray-300" />
          </button>

          {menuOpen && (
            <div
              className={`absolute right-0 mt-2 w-44 rounded-xl shadow-lg z-20 ${
                darkMode
                  ? "bg-[#161B22] border border-gray-700"
                  : "bg-white border border-gray-200"
              }`}
            >
              <Link
                href="/dashboard"
                className={`block px-4 py-2 text-sm ${
                  darkMode
                    ? "text-gray-300 hover:bg-[#1C222C]"
                    : "text-gray-800 hover:bg-gray-100"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/wallet"
                className={`block px-4 py-2 text-sm ${
                  darkMode
                    ? "text-gray-300 hover:bg-[#1C222C]"
                    : "text-gray-800 hover:bg-gray-100"
                }`}
              >
                Wallet
              </Link>
              <Link
                href="/dashboard/details"
                className={`block px-4 py-2 text-sm ${
                  darkMode
                    ? "text-gray-300 hover:bg-[#1C222C]"
                    : "text-gray-800 hover:bg-gray-100"
                }`}
              >
                Details
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
