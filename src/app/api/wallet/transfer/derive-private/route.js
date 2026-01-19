// src/app/api/derive-private/route.js
import { NextResponse } from "next/server";
import { HDNodeWallet } from "ethers";

/**
 * POST payload: { mnemonic: "word1 word2 ... word12" }
 * Response: { success: true, privateKey: "<64 hex chars>" }
 *
 * SECURITY: This route must be HTTPS-only and used only in controlled, trusted environments.
 * DO NOT enable in production unless you fully understand the risk.
 */

export async function POST(req) {
  try {
    const headers = {
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    };

    const body = await req.json();
    const { mnemonic } = body ?? {};

    if (!mnemonic || typeof mnemonic !== "string") {
      return NextResponse.json(
        { error: "mnemonic is required" },
        { status: 400, headers }
      );
    }

    const words = mnemonic.trim().split(/\s+/);
    if (words.length !== 12 && words.length !== 24) {
      return NextResponse.json(
        { error: "mnemonic should be 12 or 24 words" },
        { status: 400, headers }
      );
    }

    let wallet;
    try {
      // Use ethers v6 HDNodeWallet
      const derivationPath = "m/44'/818'/0'/0/0"; // VeChain BIP44 path
      wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, derivationPath);
    } catch (e) {
      return NextResponse.json({ error: "Invalid mnemonic" }, { status: 400, headers });
    }

    const privateKeyHex = wallet.privateKey.replace(/^0x/, "");
    if (privateKeyHex.length !== 64) {
      return NextResponse.json(
        { error: "Derived key has unexpected length" },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      { success: true, privateKey: privateKeyHex },
      { status: 200, headers }
    );
  } catch (err) {
    console.error("derive-private error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
