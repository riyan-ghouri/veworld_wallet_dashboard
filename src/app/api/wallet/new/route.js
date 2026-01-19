// app/api/wallet/new/route.js
import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { connectDB } from "../../../../../lib/db";
import Wallet from "../../../../../models/Wallet";

export async function POST(req) {
  try {
    await connectDB();

    const { name } = await req.json(); // 👈 get name from frontend

    // Generate wallet
    const wallet = ethers.Wallet.createRandom();

    const mnemonic = wallet.mnemonic?.phrase; // 12-word recovery phrase
    const address = wallet.address;
    const privateKey = wallet.privateKey;

    // Save to DB
    const newWallet = await Wallet.create({
      address,
      privateKey,
      mnemonic,
      name: name || "",   // 👈 use frontend name, fallback empty
    });

    return NextResponse.json({
      success: true,
      wallet: {
        id: newWallet._id,
        address: newWallet.address,
        privateKey: newWallet.privateKey,
        mnemonic: newWallet.mnemonic,
        name: newWallet.name,
        deleted: newWallet.deleted,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || "Failed to create wallet" },
      { status: 500 }
    );
  }
}
