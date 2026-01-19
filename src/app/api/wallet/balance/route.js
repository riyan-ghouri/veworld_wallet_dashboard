import { NextResponse } from "next/server";

const CACHE = new Map(); // In-memory cache { address: { data, timestamp } }
const CACHE_TTL = 30 * 1000; // 30 seconds

export async function POST(req) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: "❌ Wallet address is required." },
        { status: 400 }
      );
    }

    // ✅ Normalize address (uppercase for API)
    const normalizedAddress = address.toLowerCase();

    // ✅ Check cache first
    const cached = CACHE.get(normalizedAddress);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // ✅ Fetch wallet data from VeChain Explorer API
    let response;
    try {
      response = await fetch(
        `https://explore.vechain.org/api/accounts/${normalizedAddress}`
      );
    } catch (networkErr) {
      console.error("🌐 Network error:", networkErr);
      return NextResponse.json(
        { error: "Failed to connect to VeChain Explorer API." },
        { status: 502 }
      );
    }

    if (!response.ok) {
      console.error(`🚨 Explorer API error: ${response.status}`);
      return NextResponse.json(
        {
          error: `VeChain Explorer API returned status ${response.status}.`,
        },
        { status: response.status }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseErr) {
      console.error("📦 JSON parse error:", parseErr);
      return NextResponse.json(
        { error: "Invalid JSON response from VeChain Explorer API." },
        { status: 500 }
      );
    }

    // ✅ Convert VET balance safely
    let vetBalance = 0;
    try {
      vetBalance = data?.account?.balance
        ? Number(BigInt(data.account.balance)) / 1e18
        : 0;
    } catch (convErr) {
      console.error("⚖️ Balance conversion error:", convErr);
      return NextResponse.json(
        { error: "Failed to convert VET balance." },
        { status: 500 }
      );
    }

    // ✅ Find B3TR token balance
    let b3trBalance = 0;
    try {
      const b3trToken = data.tokens?.find((t) => t.symbol === "B3TR");
      b3trBalance = b3trToken
        ? Number(BigInt(b3trToken.balance)) / 10 ** b3trToken.decimals
        : 0;
    } catch (convErr) {
      console.error("⚖️ B3TR balance conversion error:", convErr);
      return NextResponse.json(
        { error: "Failed to convert B3TR balance." },
        { status: 500 }
      );
    }

    const result = {
      address: normalizedAddress,
      vetBalance: Number(vetBalance.toFixed(4)),
      b3trBalance: Number(b3trBalance.toFixed(4)),
    };

    // ✅ Store in cache
    CACHE.set(normalizedAddress, { data: result, timestamp: Date.now() });

    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ Unexpected API Error:", err);
    return NextResponse.json(
      { error: "Unexpected server error. Please try again later." },
      { status: 500 }
    );
  }
}
