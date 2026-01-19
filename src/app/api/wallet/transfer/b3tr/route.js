// src/app/api/wallet/transfer/b3tr/route.js
import { thorify } from "thorify";
import Web3 from "web3";

const VECHAIN_RPC = process.env.VECHAIN_RPC_URL;
const B3TR_TOKEN = "0x5ef79995FE8a89e0812330E4378eB2660ceDe699";
const SPONSOR_URL = "https://sponsor.vechain.energy/by/1190";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const B3TR_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "success", type: "bool" }],
    type: "function",
  },
];

// Helper to convert block ID to 8-byte hex for blockRef
function getBlockRef(blockId) {
  const bytes = blockId.replace(/^0x/, ''); // remove 0x if exists
  return bytes.slice(0, 16); // first 8 bytes = 16 hex chars
}

export async function POST(req) {
  try {
    const { to, amount } = await req.json();
    if (!to || !amount) return new Response(JSON.stringify({ error: "Missing recipient or amount" }), { status: 400 });
    if (!PRIVATE_KEY || PRIVATE_KEY.length !== 64) return new Response(JSON.stringify({ error: "Invalid private key" }), { status: 400 });

    const web3 = thorify(new Web3(), VECHAIN_RPC);
    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);

    const contract = new web3.eth.Contract(B3TR_ABI, B3TR_TOKEN);

    const decimals = 18;
    const tokenAmount = web3.utils.toBN((parseFloat(amount) * 10 ** decimals).toLocaleString('fullwide', { useGrouping: false }));

    const txData = contract.methods.transfer(to, tokenAmount).encodeABI();

    // Get latest block
    const block = await web3.eth.getBlock("latest");
    const blockRef = getBlockRef(block.id);

    const tx = {
      chainTag: 0x4a,
      blockRef,
      expiration: 720,
      clauses: [{ to: B3TR_TOKEN, value: "0x0", data: txData }],
      gasPriceCoef: 128,
      nonce: Date.now() % 1e6,
    };

    // ⚡ Correct VeChain signing
    const signed = await web3.thor.sign(tx, PRIVATE_KEY);

    // Send via sponsor URL
    const sponsorRes = await fetch(SPONSOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw: signed }),
    });

    const sponsorData = await sponsorRes.json();
    if (!sponsorRes.ok || sponsorData.error) return new Response(JSON.stringify({ error: sponsorData.error || "Sponsor failed" }), { status: 500 });

    return new Response(JSON.stringify({ success: true, txHash: sponsorData.txid }), { status: 200 });

  } catch (err) {
    console.error("❌ Transfer error:", err);
    return new Response(JSON.stringify({ error: err.message || "Failed transfer" }), { status: 500 });
  }
}
