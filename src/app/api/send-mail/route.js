import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { to, subject, message, apiKey, todayReceive, accountName, index, img1, img2, img3 } = body;

    // 🔐 API Key check
    if (apiKey !== process.env.API_KEY) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!to || !subject || !message || !todayReceive || !accountName || !index || !img1 || !img2 || !img3) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    // 📬 Transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✉️ Simple Email Template (customizable later)
   const htmlTemplate = `
  <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
    
    <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background:#111827; color:#fff; padding:20px;">
        <h2 style="margin:0;">${accountName || "Account Name"}</h2>
        <p style="margin:5px 0 0; font-size:12px; opacity:0.8;">
          ID: ${index || "0"}
        </p>
      </div>

      <!-- Stats -->
      <div style="padding:20px; display:flex; justify-content:space-between; gap:10px;">
        <div style="flex:1; background:#f9fafb; padding:15px; border-radius:8px; text-align:center;">
          <p style="margin:0; font-size:12px; color:#6b7280;">Today Receive</p>
          <h3 style="margin:5px 0; color:#111827;">${todayReceive || "0"} G</h3>
        </div>
      </div>
<!-- Gallery -->
<div style="padding:20px;">
  <h3 style="margin-bottom:10px; color:#111827;">Gallery</h3>
  
  <table width="100%" cellspacing="0" cellpadding="0">
    
    <tr>
      <td style="padding:5px 0;">
        <img src="${img1}" style="width:100%; border-radius:6px; display:block;" />
      </td>
    </tr>

    <tr>
      <td style="padding:5px 0;">
        <img src="${img2}" style="width:100%; border-radius:6px; display:block;" />
      </td>
    </tr>

    <tr>
      <td style="padding:5px 0;">
        <img src="${img3}" style="width:100%; border-radius:6px; display:block;" />
      </td>
    </tr>

  </table>
</div>

      <!-- Message Box -->
      <div style="padding:20px;">
        <h3 style="margin-bottom:10px; color:#111827;">Message</h3>
        <div style="background:#f3f4f6; padding:15px; border-radius:8px; color:#374151; line-height:1.5;">
          ${message}
        </div>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb; padding:15px; text-align:center; font-size:12px; color:#6b7280;">
        Sent via your Next.js Mail System 🚀
      </div>

    </div>
  </div>
`;

    await transporter.sendMail({
      from: `"Celo Bot" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlTemplate,
    });

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}