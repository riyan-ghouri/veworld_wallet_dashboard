import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectDB } from "../../../../../lib/db";
import WalletAddress from "../../../../../models/Address";

const fetchWithTimeout = (url, options = {}, timeout = 15000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Fetch timeout")), timeout)
    ),
  ]);

export async function GET() {
  try {
    await connectDB();

    const wallets = await WalletAddress.find({ deleted: false });
    if (!wallets.length) throw new Error("No wallets found in database");

    // 🔍 Check each wallet via your /api/token-today route
   const checkPromises = wallets.map(async (wallet) => {
  const address = wallet.address?.toLowerCase();

  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/last_balance?address=${address}`;

    const res = await fetchWithTimeout(apiUrl);

    if (!res.ok) {
      console.warn(`⚠️ API failed for ${address} (${res.status})`);
      return { ...wallet.toObject(), received24h: 0, status: "❌" };
    }

    const data = await res.json();

    // ✅ extract from new response format
    const received24h = Number(data?.transactions_24h?.received?.total || 0);

    return {
      name: wallet.name,
      address,
      label: wallet.label,
      sublabel: wallet.sublabel,
      received24h,
      status: received24h > 0 ? "✅" : "❌",
    };
  } catch (err) {
    console.warn(`⚠️ Error for ${address}: ${err.message}`);
    return {
      name: wallet.name,
      address,
      label: wallet.label,
      sublabel: wallet.sublabel,
      received24h: 0,
      status: "❌",
    };
  }
});


    const results = await Promise.allSettled(checkPromises);
    const allWallets = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    const mineWallets = allWallets.filter((w) => w.label === "Mine");

    const getTotal = (list) => list.reduce((sum, w) => sum + (w.received24h || 0), 0);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const buildEmailBody = (wallets, labelName) => {
      const total = getTotal(wallets);
      const receivedCount = wallets.filter((w) => w.received24h > 0).length;

      return `
      <div style="background-color: #f3f4f6; font-family: 'Inter', sans-serif; color: #111827;">
        <div style="max-width: 680px; margin: auto; background-color: #fff; border-radius: 12px; box-shadow: 0 3px 12px rgba(0,0,0,0.08); overflow: hidden;">
          <div style="background: linear-gradient(135deg, #16a34a, #15803d); color: #fff; text-align: center; padding: 20px;">
            <h2 style="margin: 0; font-size: 20px;">💸 ${labelName} Wallets — 24h Incoming Activity</h2>
            <p style="margin: 6px 0 0; font-size: 13px; color: #d1fae5;">From: Greencart</p>
          </div>
          <div style="padding: 26px;">
            <p style="font-size: 14px; margin-bottom: 18px; color: #374151;">
              <strong>${receivedCount}</strong> of ${wallets.length} wallets received B3TR in the past 24h.
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid #e5e7eb; border-radius: 6px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th align="left" style="padding: 8px;">#</th>
                  <th align="left" style="padding: 8px;">Wallet</th>
                  <th align="center" style="padding: 8px;">Received (24h)</th>
                  <th align="center" style="padding: 8px;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${wallets.map((w, i) => `
                  <tr style="border-bottom: 1px solid #f3f4f6; background: ${i % 2 === 0 ? "#fff" : "#f9fafb"};">
                    <td style="padding: 8px;">${i + 1}</td>
                    <td style="padding: 8px;">${w.name}</td>
                    <td align="center" style="padding: 8px; color: ${w.received24h > 0 ? "#16a34a" : "#dc2626"};">
                      ${w.received24h.toFixed(2)}
                    </td>
                    <td align="center" style="padding: 8px;">${w.status}</td>
                  </tr>`).join("")}
              </tbody>
            </table>
            <div style="margin-top: 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px; text-align: center;">
              <strong style="color: #166534;">📊 Total Received (24h): ${total.toFixed(2)} B3TR</strong>
            </div>
            <p style="margin-top: 22px; font-size: 12px; color: #6b7280; text-align: center;">
              🕒 Checked automatically at ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
            </p>
          </div>
        </div>
      </div>`;
    };

    if (mineWallets.length) {
      await transporter.sendMail({
        from: `"Wallet Monitor" <${process.env.EMAIL_USER}>`,
        to: "riyanghouri7@gmail.com",
        subject: "💸 [Mine] 24h Wallet Report",
        html: buildEmailBody(mineWallets, "Mine"),
      });
    }

    

    return NextResponse.json({
      success: true,
      message: "✅ Report emails sent successfully.",
      totals: { mine: getTotal(mineWallets) },
    });

  } catch (error) {
    console.error("❌ /api/check-wallets error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
