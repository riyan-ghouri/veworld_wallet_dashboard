// /pages/api/wallet/transfer/estimateFee.js
import Web3 from "web3";
import { thorify } from "thorify";

const VECHAIN_NODE = process.env.VECHAIN_RPC_URL; // Node URL in .env
const PRIVATE_KEY = process.env.VECHAIN_PRIVATE_KEY;
const TOKEN_ADDRESS = "0x5ef79995FE8a89e0812330E4378eB2660ceDe699"; // B3TR token contract

const TOKEN_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
];

let web3;

// initialize Web3 once
function getWeb3() {
  if (!web3) {
    web3 = thorify(new Web3(), VECHAIN_NODE);
  }
  return web3;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { to, amount } = req.body;

    if (!to || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const web3 = getWeb3();
    const contract = new web3.eth.Contract(TOKEN_ABI, TOKEN_ADDRESS);

    // ✅ Convert human-readable amount -> smallest unit (18 decimals)
    const decimals = 18;
    const tokenAmount = web3.utils
      .toBN((parseFloat(amount) * 10 ** decimals).toString());

    // build tx data
    const txData = contract.methods.transfer(to, tokenAmount).encodeABI();

    const account = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY);

    const tx = {
      from: account.address,
      to: TOKEN_ADDRESS,
      data: txData,
    };

    // estimate gas and fee
    const gas = await web3.eth.estimateGas(tx);
    const gasPrice = await web3.eth.getGasPrice();
    const fee = web3.utils.toBN(gas).mul(web3.utils.toBN(gasPrice));

    return res.status(200).json({
      success: true,
      gas,
      gasPrice,
      fee: fee.toString(), // in Wei (VET smallest unit)
      feeInVET: web3.utils.fromWei(fee.toString(), "ether"), // human-readable
    });
  } catch (error) {
    console.error("❌ Estimate fee error:", error);
    return res.status(500).json({ error: "Failed to estimate fee" });
  }
}
