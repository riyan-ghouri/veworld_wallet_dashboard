import { NextResponse } from "next/server";

// ⚡ Global caches
let cachedPrice = null;
let lastPriceFetch = 0;
const walletCache = new Map();
const inFlight = new Map();

// 🕒 Fetch with timeout (supports POST)
const fetchWithTimeout = (url, ms = 2500, options = {}) =>
  Promise.race([
    fetch(url, { cache: "no-store", ...options }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ]);

// 💰 CoinGecko price cache
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
        usd: data?.vebetterdao?.usd || 0,
        pkr: data?.vebetterdao?.pkr || 0,
      };
      lastPriceFetch = now;
    }
  } catch {
    console.warn("⚠️ Price fetch failed, using cache");
  }

  return cachedPrice || { usd: 0, pkr: 0 };
}

// 🔗 VeChain contract call (balanceOf)
const CONTRACT_ADDRESS = "0x5ef79995fe8a89e0812330e4378eb2660cede699";
const VET_NODE = `https://mainnet.vechain.org/accounts/${CONTRACT_ADDRESS}`;

function padAddress(address) {
  return address.toLowerCase().replace("0x", "").padStart(64, "0");
}

async function fetchWalletData(address) {
  const body = {
    value: "0",
    data: `0x70a08231${padAddress(address)}`,
  };

  const res = await fetchWithTimeout(VET_NODE, 3000, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error("VeChain node failed");

  return res.json(); // { data: "0x..." }
}

// 🎯 Main API
export async function POST(req) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const cached = walletCache.get(address);

    // 🧠 Cache hit
    if (cached && now - cached.timestamp < 60_000) {
      if (!inFlight.has(address)) {
        inFlight.set(
          address,
          fetchWalletData(address).finally(() =>
            inFlight.delete(address)
          )
        );
      }
      return NextResponse.json({ ...cached.data, cached: true });
    }

    // ⚡ Fetch price + balance
    const [priceData, walletData] = await Promise.all([
      getCachedPrice(),
      fetchWalletData(address),
    ]);

    // 🔢 Decode hex balance safely
    let rawBalance = 0n;
    if (walletData?.data) {
      rawBalance = BigInt(walletData.data);
    }

   const DECIMALS = 18;

function formatUnits(value, decimals) {
  const str = value.toString().padStart(decimals + 1, "0");
  const integer = str.slice(0, -decimals);
  const fraction = str.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${integer}.${fraction}` : integer;
}

const balanceStr = formatUnits(rawBalance, DECIMALS);
const balance = Number(balanceStr);


    const totalValueUSD = (balance * priceData.usd).toFixed(4);
    const totalValuePKR = (balance * priceData.pkr).toFixed(2);

    const result = {
      success: true,
      address,
      symbol: "B3TR",
      balance: balance.toFixed(2),
      priceUSD: priceData.usd,
      pricePKR: priceData.pkr,
      totalValueUSD,
      totalValuePKR,
      fetchedAt: new Date().toISOString(),
      cached: false,
    };

    walletCache.set(address, { data: result, timestamp: now });
    inFlight.delete(address);

    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ Wallet fetch error:", err.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
