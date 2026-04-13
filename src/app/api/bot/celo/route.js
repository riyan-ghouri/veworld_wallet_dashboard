import { NextResponse } from "next/server";

const CELO_API = "https://explorer.celo.org/api";

const GOODDOLLAR_CONTRACT =
  "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A".toLowerCase();

export async function POST(req) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json(
        { success: false, message: "Wallet address required" },
        { status: 400 }
      );
    }

    // 🔥 Only fetch latest transactions (massive speed boost)
    const url = `${CELO_API}?module=account&action=tokentx&address=${address}&sort=desc&offset=100`;

    const res = await fetch(url, {
      next: { revalidate: 10 }, // cache for 10s (optional but powerful)
    });

    const data = await res.json();

    if (!data.result) {
      return NextResponse.json(
        { success: false, message: "No transactions found" },
        { status: 404 }
      );
    }

    // 🕒 Time boundaries (use timestamps for speed)
    const now = Date.now();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStartTime = todayStart.getTime();

    const yesterdayStartTime = todayStartTime - 24 * 60 * 60 * 1000;

    let todayReceived = 0;
    let yesterdayReceived = 0;

    const lowerAddress = address.toLowerCase();

    for (const tx of data.result) {
      const txTime = tx.timeStamp * 1000;

      // 🧠 Early break (since sorted desc)
      if (txTime < yesterdayStartTime) break;

      // fast checks first (cheap ops first)
      if (
        tx.to.toLowerCase() !== lowerAddress ||
        tx.contractAddress.toLowerCase() !== GOODDOLLAR_CONTRACT
      ) {
        continue;
      }

      const value = Number(tx.value) / 10 ** tx.tokenDecimal;

      if (txTime >= todayStartTime && txTime <= now) {
        todayReceived += value;
      } else if (txTime >= yesterdayStartTime) {
        yesterdayReceived += value;
      }
    }

    return NextResponse.json({
      success: true,
      address,
      todayReceived,
      yesterdayReceived,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}