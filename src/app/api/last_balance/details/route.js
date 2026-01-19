import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import WalletAddress from "../../../../../models/Address";

// Helper: timeout for fetch requests
const fetchWithTimeout = (
  url,
  options = {},
  timeout = 20000 // ⏱️ Increased from 10s → 30s
) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Fetch timeout")), timeout)
    ),
  ]);

export async function GET() {
  try {
    await connectDB();

    // 🧭 Fetch all non-deleted wallets
    const wallets = await WalletAddress.find({ deleted: false });

    if (!wallets.length) {
      return NextResponse.json(
        { message: "No wallets found" },
        { status: 404 }
      );
    }

    // ⚙️ Check each wallet’s 24h token activity
    const checkPromises = wallets.map(async (wallet) => {
      try {
        const res = await fetchWithTimeout(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/last_balance?address=${wallet.address}`,
          {},
          20000 // ⏱️ Custom timeout per wallet: 30s
        );

        if (!res.ok) {
          console.warn(`⚠️ Failed to fetch token24h for ${wallet.address}`);
          return {
            address: wallet.address,
            label: wallet.label || "Unlabeled", // 🏷️ Added label
            sublabel: wallet.sublabel,
            received24h: 0,
          };
        }

        const data = await res.json();
        const received24h = Number(data.received_24h?.total || 0);

        return {
          address: wallet.address,
          sublabel: wallet.sublabel || "Unlabeled",
          label: wallet.label || "Unlabeled", // 🏷️ Added label

          received24h: parseFloat(received24h.toFixed(2)),
        };
      } catch (err) {
        console.warn(`⚠️ Error checking ${wallet.address}: ${err.message}`);
        return {
          address: wallet.address,
          sublabel: wallet.sublabel || "Unlabeled",
          received24h: 0,
        };
      }
    });

    const results = await Promise.allSettled(checkPromises);
    const cleanResults = results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    return NextResponse.json({
      success: true,
      count:wallets.length,
      wallets: cleanResults,
    });
  } catch (error) {
    console.error("❌ Error in /api/check-wallets:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
