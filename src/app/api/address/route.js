// /app/api/wallets/route.js (Next.js 13+ with App Router)
import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db"; // your MongoDB connection file
import Address from "../../../../models/Address"; // your WalletSchema model

// ✅ Create a new wallet
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { address, name, label, sublabel } = body;

    // ✅ Ensure all required fields exist
    if (!address || !name || !label || !sublabel) {
      return NextResponse.json(
        { error: "Address, Name, Label, and Sublabel are required" },
        { status: 400 }
      );
    }

    const wallet = await Address.create({
      address,
      name,
      label,
      sublabel,
    });

    return NextResponse.json(
      { success: true, data: wallet },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating wallet:", error);

    // Handle duplicate address error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "This address already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ✅ Get all wallets
export async function GET() {
  try {
    await connectDB();

    const wallets = await Address.find({ deleted: false }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ success: true, data: wallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
