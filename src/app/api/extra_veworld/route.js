import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import VeworldExtra from "../../../../models/veworld_extra";
import { HDNodeWallet } from "ethers";

const VECHAIN_BIP44 = "m/44'/818'/0'/0/0";

// 🧩 POST — Create new wallet
export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, key } = body;

    if (!name || !key) {
      return NextResponse.json(
        { error: "Please provide both name and key." },
        { status: 400 }
      );
    }

    const raw = String(key).trim();
    let wallet;

    try {
      if (raw.split(/\s+/).length > 1) {
        wallet = HDNodeWallet.fromPhrase(raw, undefined, VECHAIN_BIP44);
      } else {
        let pk = raw.replace(/^0x/, "");
        if (!/^[0-9a-fA-F]+$/.test(pk)) {
          return NextResponse.json(
            { error: "Private key contains invalid characters." },
            { status: 400 }
          );
        }
        if (pk.length < 64) pk = pk.padStart(64, "0");
        if (pk.length > 64) pk = pk.slice(0, 64);
        wallet = new HDNodeWallet("0x" + pk);
      }
    } catch (err) {
      console.error("Invalid key ->", err);
      return NextResponse.json(
        {
          error: "Invalid key or mnemonic format. Please check and try again.",
        },
        { status: 400 }
      );
    }

    const address = wallet.address;

    const newRecord = await VeworldExtra.create({
      name,
      key: raw,
      address,
    });

    return NextResponse.json(
      {
        success: true,
        wallet: {
          id: newRecord._id,
          name: newRecord.name,
          address: newRecord.address,
          key: newRecord.key,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/extra Error:", error);
    return NextResponse.json(
      { error: "Something went wrong while adding the wallet." },
      { status: 500 }
    );
  }
}

// 🧩 GET — Fetch all wallets
export async function GET() {
  try {
    await connectDB();
    const wallets = await VeworldExtra.find().sort({ createdAt: -1 });
    return NextResponse.json(wallets, { status: 200 });
  } catch (error) {
    console.error("GET /api/extra Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}

// 🧩 DELETE — Remove a wallet by ID
export async function DELETE(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing wallet ID" }, { status: 400 });
    }

    const deleted = await VeworldExtra.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Wallet deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/extra Error:", error);
    return NextResponse.json(
      { error: "Failed to delete wallet" },
      { status: 500 }
    );
  }
}

// 🧩 PUT — Update wallet by ID
export async function PUT(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing wallet ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, key,stakedAccount } = body;

    if (!name && !key && !stakedAccount) {
      return NextResponse.json(
        { error: "No fields to update. Provide at least one." },
        { status: 400 }
      );
    }

    const updates = {};

    if (name) updates.name = name;
    if (stakedAccount) updates.stakedAccount = stakedAccount;

    if (key) {
      const raw = String(key).trim();
      let wallet;
      try {
        if (raw.split(/\s+/).length > 1) {
          wallet = HDNodeWallet.fromPhrase(raw, undefined, VECHAIN_BIP44);
        } else {
          let pk = raw.replace(/^0x/, "");
          if (!/^[0-9a-fA-F]+$/.test(pk)) {
            return NextResponse.json(
              { error: "Private key contains invalid characters." },
              { status: 400 }
            );
          }
          if (pk.length < 64) pk = pk.padStart(64, "0");
          if (pk.length > 64) pk = pk.slice(0, 64);
          wallet = new HDNodeWallet("0x" + pk);
        }
      } catch (err) {
        console.error("Invalid key ->", err);
        return NextResponse.json(
          { error: "Invalid key or mnemonic format." },
          { status: 400 }
        );
      }

      updates.key = raw;
      updates.address = wallet.address;
    }

    const updatedWallet = await VeworldExtra.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updatedWallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Wallet updated successfully",
        wallet: updatedWallet,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/extra Error:", error);
    return NextResponse.json(
      { error: "Failed to update wallet" },
      { status: 500 }
    );
  }
}
