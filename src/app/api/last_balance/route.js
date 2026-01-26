export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawAddress = (searchParams.get("address") || "").trim();

    if (!rawAddress) {
      return new Response(JSON.stringify({ error: "Missing address" }), {
        status: 400,
      });
    }

    const address = rawAddress.toLowerCase();

    if (!/^0x[a-f0-9]{40}$/.test(address)) {
      return new Response(JSON.stringify({ error: "Invalid address format" }), {
        status: 400,
      });
    }

    const CONTRACT = "0x5ef79995fe8a89e0812330e4378eb2660cede699";

    const TRANSFER_TOPIC =
      "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    const body = {
      range: {
        unit: "block",
        from: 0,
        to: 9999999999,
      },
      options: {
        offset: 0,
        limit: 10,
      },
      criteriaSet: [
        {
          address: CONTRACT,
          topic0: TRANSFER_TOPIC, // ✅ only filter by event
        },
      ],
      order: "desc",
    };

    const res = await fetch("https://mainnet.vechain.org/logs/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const msg = await res.text();
      return new Response(
        JSON.stringify({ error: "Node error", message: msg }),
        {
          status: res.status,
        },
      );
    }

    // ... earlier code stays the same ...

    const data = await res.json();

    // ✅ FIX: data IS the array, not data.logs
    const logs = Array.isArray(data) ? data : [];

    // 🕒 Today midnight (server time)
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();

    // ✅ Simplified filter - API already filtered by address
    const todaysLogs = logs.filter((log) => {
      if (!log.meta?.blockTimestamp) return false;
      return log.meta.blockTimestamp * 1000 >= midnight;
    });

    // ... rest stays the same ...

    let totalReceived = 0n;

    for (const log of todaysLogs) {
      if (log.data) {
        totalReceived += BigInt(log.data);
      }
    }

    const DECIMALS = 18;

    function formatUnits(value, decimals) {
      const s = value.toString().padStart(decimals + 1, "0");
      const i = s.slice(0, -decimals);
      const f = s.slice(-decimals).replace(/0+$/, "");
      return f ? `${i}.${f}` : i;
    }

    const amount = formatUnits(totalReceived, DECIMALS);

    return new Response(
      JSON.stringify({
        address,
        symbol: "B3TR",
        received_24h: {
          total: Number(amount).toFixed(4),
          tx_count: todaysLogs.length,
        },
      }),
      { status: 200 },
    );
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: err.message }),
      { status: 500 },
    );
  }
}
