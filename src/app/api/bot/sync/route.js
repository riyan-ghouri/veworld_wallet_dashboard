import { NextResponse } from "next/server";

export async function GET() {
  try {
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

    if (!BASE_URL) {
      return NextResponse.json(
        { success: false, message: "BASE_URL not set in env" },
        { status: 500 }
      );
    }

    // 1️⃣ Get all wallets (single request)
    const usersRes = await fetch(`${BASE_URL}/api/bot`);
    const usersData = await usersRes.json();

    if (!usersData.success) {
      throw new Error("Failed to fetch users");
    }

    const users = usersData.data;

    let updated = 0;

    // ⚡ helper: process single user
    const processUser = async (user) => {
      try {
        const celoRes = await fetch(`${BASE_URL}/api/bot/celo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: user.address }),
        });

        const celoData = await celoRes.json();

        if (!celoData.success) return null;

        const hasReceived = celoData.todayReceived > 0;

        await fetch(`${BASE_URL}/api/bot`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: user._id,
            claim: hasReceived,
          }),
        });

        return true;
      } catch (err) {
        console.error("User failed:", user._id, err);
        return null;
      }
    };

    // 2️⃣ Run in parallel (FAST)
    const results = await Promise.allSettled(
      users.map((user) => processUser(user))
    );

    // 3️⃣ Count success
    results.forEach((r) => {
      if (r.status === "fulfilled" && r.value) {
        updated++;
      }
    });

    return NextResponse.json({
      success: true,
      message: "Sync completed",
      totalUsers: users.length,
      updated,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Sync failed" },
      { status: 500 }
    );
  }
}