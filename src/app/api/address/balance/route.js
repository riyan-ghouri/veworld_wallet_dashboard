import { NextResponse } from "next/server";

// ⚡ Global caches
let cachedPrice = null;
let lastPriceFetch = 0;
const walletCache = new Map();
const inFlight = new Map();

// 🕒 Fast timeout-based fetch
const fetchWithTimeout = (url, ms = 2500) =>
  Promise.race([
    fetch(url, { cache: "no-store" }),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms)),
  ]);

// 💰 Fetch cached CoinGecko prices
async function getCachedPrice() {
  const now = Date.now();
  if (cachedPrice && now - lastPriceFetch < 60_000) return cachedPrice;

  try {
    const res = await fetchWithTimeout(
      "https://api.coingecko.com/api/v3/simple/price?ids=vebetterdao&vs_currencies=usd,pkr",
      2500
    );
    if (res.ok) {
      const data = await res.json();
      cachedPrice = {
        usd: data?.vebetterdao?.usd || cachedPrice?.usd || 0,
        pkr: data?.vebetterdao?.pkr || cachedPrice?.pkr || 0,
      };
      lastPriceFetch = now;
      console.log("💰 Price cache refreshed");
    }
  } catch {
    console.warn("⚠️ Price fetch fallback used");
  }

  return cachedPrice || { usd: 0, pkr: 0 };
}

// 🔁 Multi-source wallet fetch
async function fetchWalletData(address) {
  const urls = [
    `https://explore.vechain.org/api/accounts/${address}`,
    `https://explore.vechain.org/api/accounts/${address}`,
    `https://explore.vechain.org/api/accounts/${address}`,
    `https://explore.vechain.org/api/accounts/${address}`,
    `https://explore.vechain.org/api/accounts/${address}`,
    `https://explore.vechain.org/api/accounts/${address}`,
    `https://explore.vechain.org/api/accounts/${address}`,
  ];

  // 🚀 Race them all — first valid response wins
  const results = await Promise.any(
    urls.map(async (url) => {
      const res = await fetchWithTimeout(url, 3000);
      if (!res.ok) throw new Error("Bad response");
      return res.json();
    })
  );

  return results;
}

// 🎯 Main route handler
export async function POST(req) {
  try {
    const { address } = await req.json();
    if (!address)
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 });

    // 🧠 Serve from cache if fresh
    const cached = walletCache.get(address);
    const now = Date.now();
    if (cached && now - cached.timestamp < 60_000) {
      if (!inFlight.has(address)) {
        inFlight.set(address, fetchWalletData(address).finally(() => inFlight.delete(address)));
      }
      return NextResponse.json({ ...cached.data, cached: true });
    }

    // ⚡ Parallel: get wallet + price together
    const [priceData, walletData] = await Promise.all([
      getCachedPrice(),
      fetchWalletData(address),
    ]);

    let symbol = "UNKNOWN",
      balance = 0,
      totalValueUSD = 0,
      totalValuePKR = 0;

    if (Array.isArray(walletData?.tokens) && walletData.tokens.length > 0) {
      const token =
        walletData.tokens.find((t) => t.symbol?.toUpperCase() === "B3TR") ||
        walletData.tokens[0];
      symbol = token.symbol || "UNKNOWN";
      const raw = Number(token.balance) / 10 ** (token.decimals || 18);
      balance = raw.toFixed(2);
      totalValueUSD = (raw * priceData.usd).toFixed(4);
      totalValuePKR = (raw * priceData.pkr).toFixed(2);
    }

    const result = {
      success: true,
      address,
      symbol,
      balance,
      priceUSD: priceData.usd,
      pricePKR: priceData.pkr,
      totalValueUSD,
      totalValuePKR,
      fetchedAt: new Date().toISOString(),
      cached: false,
    };

    // 🧊 Cache for next request
    walletCache.set(address, { data: result, timestamp: now });
    inFlight.delete(address);

    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ Wallet fetch error:", err.message);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
