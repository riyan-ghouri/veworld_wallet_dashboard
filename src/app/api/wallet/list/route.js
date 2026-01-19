import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import Wallet from "../../../../../models/Wallet";

export async function GET() {
  try {
    await connectDB();

    // get all wallets where deleted = false
    const wallets = await Wallet.find({ deleted: false }).sort({
      createdAt: -1,
    });

    return NextResponse.json({
      success: true,
      count: wallets.length,
      wallets: wallets.map((w) => ({
        id: w._id,
        name: w.name,
        address: w.address,
        privateKey: w.privateKey, // 👈 included now
        deleted: w.deleted,
      })),
    });
  } catch (error) {
    console.error("❌ Error fetching wallets:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}
