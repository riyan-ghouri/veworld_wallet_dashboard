import { NextResponse } from "next/server";

export async function GET() {
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

    if (!BASE_URL) {
      return NextResponse.json(
        { success: false, message: "BASE_URL not set" },
        { status: 500 }
      );
    }

    // 1️⃣ Get all wallets
    const res = await fetch(`${BASE_URL}/api/bot`);
    const data = await res.json();

    if (!data.success) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch wallets" },
        { status: 500 }
      );
    }

    const users = data.data;

    const now = Date.now();
    const TEN_MIN = 10 * 60 * 1000;

    // 2️⃣ find FIRST eligible wallet only
    const wallet = users.find((u) => {
      if (u.claim !== false) return false;

      if (!u.lastClaimAt) return true;

      const lastTime = new Date(u.lastClaimAt).getTime();

      return now - lastTime >= TEN_MIN;
    });

    // 3️⃣ if nothing found
    if (!wallet) {
      return NextResponse.json({
        success: true,
        message: "No eligible wallet found",
      });
    }

    // 4️⃣ call external render API (ONLY ONE CALL)
    // 4️⃣ call external render API (ONLY ONE CALL)
const externalRes = await fetch(
  `https://goodwallet-claim-bot.onrender.com/run/${wallet.index}`
);

// ⚡ FIX: handle JSON OR HTML response safely
let externalData;

const contentType = externalRes.headers.get("content-type");

if (contentType && contentType.includes("application/json")) {
  externalData = await externalRes.json();
} else {
  externalData = await externalRes.text(); // HTML response
}

    // 5️⃣ update DB lastClaimAt ONLY after call
    await fetch(`${BASE_URL}/api/bot`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    id: wallet._id,
    claim: true, // ✅ FORCE TRUE when processed
  }),
});

    return NextResponse.json({
      success: true,
      message: "Wallet processed",
      wallet: wallet.index,
      externalResponse: externalData,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Runner failed" },
      { status: 500 }
    );
  }
}