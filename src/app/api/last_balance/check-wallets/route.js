import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectDB } from "../../../../../lib/db";
import WalletAddress from "../../../../../models/Address";

// Helper: timeout for fetch requests
const fetchWithTimeout = (url, options = {}, timeout = 10000) =>
  Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Fetch timeout")), timeout)
    ),
  ]);

export async function GET() {
  try {
    await connectDB();

    // 🧭 Get all wallets from DB
    const wallets = await WalletAddress.find({ deleted: false });

    if (!wallets.length) {
      throw new Error("No wallets found in database");
    }

    // ⚙️ Check balances in parallel
    const checkPromises = wallets.map(async (wallet) => {
      try {
        const res = await fetchWithTimeout(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/last_balance?address=${wallet.address}`
        );

        if (!res.ok) {
          console.warn(`⚠️ Failed to fetch balance for ${wallet.address}`);
          return null;
        }

        const data = await res.json();
        const received24h = Number(data.received_24h?.total || 0);

        return {
          name: wallet.name,
          address: wallet.address,
          label: wallet.label,
          sublabel: wallet.sublabel,
          received24h,
          status: received24h > 0 ? "✅" : "❌",
        };
      } catch (err) {
        console.warn(`⚠️ Error checking ${wallet.address}: ${err.message}`);
        return null;
      }
    });

    const results = await Promise.allSettled(checkPromises);
    const allWallets = results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    if (!allWallets.length) {
      return NextResponse.json({
        success: true,
        message: "No valid wallet data found.",
      });
    }

    // 🧩 Split by label
    const mineWallets = allWallets.filter((w) => w.label === "Mine");
    const samiWallets = allWallets.filter((w) => w.label === "Sami");

    // Helper: calculate total received
    const getTotal = (wallets) =>
      wallets.reduce((sum, w) => sum + (w.received24h || 0), 0);

    // 📧 Email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify()
  .then(() => console.log("✅ Gmail SMTP connection OK"))
  .catch(err => console.error("❌ Gmail SMTP connection failed:", err));


    // ✨ Email UI template
    const buildEmailBody = (wallets, labelName) => {
      const total = getTotal(wallets);
     return `
  <div style="
    background-color: #f3f4f6;
    font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
    padding: 0px;
    color: #111827;
  ">
    <div style="
      max-width: 680px;
      margin: auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    ">
      <div style="
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #fff;
        text-align: center;
        padding: 20px 16px;
      ">
        <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.3px;">
          💸 ${labelName} Wallets — 24h Activity Report
        </h2>
        <p style="margin: 6px 0 0; font-size: 12.5px; color: #dbeafe;">
          Automated Wallet Monitor
        </p>
      </div>

      <div style="padding: 26px;">
        <p style="font-size: 14px; margin-bottom: 18px; color: #374151;">
          Here’s your <strong>24-hour B3TR activity summary</strong> for all wallets under
          <span style="color: #2563eb;">${labelName}</span>:
        </p>

        <table style="
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          font-size: 13px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        ">
          <thead>
            <tr style="
              background-color: #f9fafb;
              border-bottom: 2px solid #e5e7eb;
            ">
              <th align="left" style="padding: 8px 6px; color: #6b7280;">#</th>
              <th align="left" style="padding: 8px 6px; color: #6b7280;">Wallet</th>
              <th align="left" style="padding: 8px 6px; color: #6b7280;">Sub Label</th>
              <th align="center" style="padding: 8px 6px; color: #6b7280;">Received (24h)</th>
              <th align="center" style="padding: 8px 6px; color: #6b7280;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              wallets.length > 0
                ? wallets
                    .map(
                      (w, i) => `
                <tr style="
                  border-bottom: 1px solid #f3f4f6;
                  background-color: ${i % 2 === 0 ? "#ffffff" : "#f9fafb"};
                ">
                  <td style="padding: 8px 6px; color: #374151;">${i + 1}</td>
                  <td style="padding: 8px 6px; color: #111827;">${w.name}</td>
                  <td style="padding: 8px 6px; color: #4b5563;">${w.sublabel}</td>
                  <td align="center" style="
                    padding: 8px 6px;
                    font-weight: 600;
                    color: ${w.received24h > 0 ? "#16a34a" : "#dc2626"};
                  ">
                    ${w.received24h.toFixed(2)}
                  </td>
                  <td align="center" style="padding: 8px 6px;">
                    ${w.status}
                  </td>
                </tr>`
                    )
                    .join("")
                : `<tr>
                    <td colspan="5" align="center" style="padding: 16px; color: #9ca3af;">
                      No wallet data found
                    </td>
                  </tr>`
            }
          </tbody>
        </table>

        <div style="
          margin-top: 20px;
          background-color: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        ">
          <strong style="color: #1e3a8a; font-size: 14px;">
            📊 Total Received (Last 24h): ${total.toFixed(2)} B3TR
          </strong>
        </div>

        <p style="
          margin-top: 22px;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
          line-height: 1.6;
        ">
          🕒 Checked automatically by <strong>Wallet Monitor</strong><br>
          ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
        </p>
      </div>
    </div>
  </div>
`;


    };

    // 📨 Send emails to both
    if (mineWallets.length > 0) {
      await transporter.sendMail({
        from: `"Wallet Monitor" <${process.env.EMAIL_USER}>`,
        to: "riyanghouri7@gmail.com",
        subject: "💸 [Mine] 24h Wallet Activity Report",
        html: buildEmailBody(mineWallets, "Mine"),
      });
    }

    if (samiWallets.length > 0) {
      await transporter.sendMail({
        from: `"Wallet Monitor" <${process.env.EMAIL_USER}>`,
        to: "astaar717@gmail.com",
        subject: "💸 [Sami] 24h Wallet Activity Report",
        html: buildEmailBody(samiWallets, "Sami"),
      });
    }

    return NextResponse.json({
      success: true,
      message: "Reports sent successfully.",
      totals: {
        mine: getTotal(mineWallets),
        sami: getTotal(samiWallets),
      },
    });
  } catch (error) {
    console.error("❌ Error in /api/check-wallets:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
