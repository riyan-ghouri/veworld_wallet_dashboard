// /app/api/getBalance/route.js
import { NextResponse } from "next/server";

const CACHE = new Map(); // In-memory cache { address: { data, timestamp } }
const CACHE_TTL = 30 * 1000; // 30s cache

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");

    if (!address) {
      return NextResponse.json(
        { error: "❌ Wallet address is required." },
        { status: 400 }
      );
    }

    const normalizedAddress = address.toLowerCase();

    // ✅ cache check
    const cached = CACHE.get(normalizedAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // ✅ fetch from VeChain explorer
    const response = await fetch(
      `https://explore.vechain.org/api/accounts/${normalizedAddress}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Explorer API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // ✅ extract B3TR token balance
    let b3trBalance = 0;
    try {
      const b3trToken = data.tokens?.find((t) => t.symbol === "B3TR");
      if (b3trToken) {
        b3trBalance = Number(BigInt(b3trToken.balance)) / 10 ** b3trToken.decimals;
      }
    } catch (err) {
      console.error("⚖️ B3TR balance parse error:", err);
    }

    const result = {
      address: normalizedAddress,
      b3trBalance: Number(b3trBalance.toFixed(4)), // round to 4 decimals
    };

    // ✅ save to cache
    CACHE.set(normalizedAddress, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ Server error:", err);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
