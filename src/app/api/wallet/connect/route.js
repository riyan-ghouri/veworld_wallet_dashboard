import { NextResponse } from "next/server";
import Web3 from "web3";
import { thorify } from "thorify";

const RPC_URL = process.env.VECHAIN_RPC_URL; 
const PRIVATE_KEY = process.env.VECHAIN_PRIVATE_KEY;

export async function GET() {
  try {
    if (!PRIVATE_KEY) {
      return NextResponse.json(
        { error: "❌ Private key missing" },
        { status: 500 }
      );
    }

    const web3 = thorify(new Web3(), RPC_URL);
    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);

    return NextResponse.json({
      address: account.address,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
