import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { address } = await req.json();

    // Basic address validation
    if (!address || typeof address !== "string" || !address.startsWith("0x")) {
      return NextResponse.json(
        { error: "Valid wallet address is required." },
        { status: 400 }
      );
    }

    const apiUrl = `https://explore.vechain.org/api/accounts/${address}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from VeChain Explorer API." },
        { status: response.status }
      );
    }

    const data = await response.json();

    // If no tokens or empty list
    if (!data.tokens || data.tokens.length === 0) {
      return NextResponse.json({
        address,
        symbol: null,
        balance: 0,
        message: "No tokens found for this wallet.",
      });
    }

    // Get first token (usually B3TR or VOT3)
    const token = data.tokens[0];
    const symbol = token.symbol || "UNKNOWN";
    const decimals = token.decimals || 18;

    // Convert hex balance to number
    let balance = 0;
    if (token.balance) {
      balance = parseInt(token.balance, 16) / 10 ** decimals;
    }

    return NextResponse.json({
      address,
      symbol,
      balance,
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
