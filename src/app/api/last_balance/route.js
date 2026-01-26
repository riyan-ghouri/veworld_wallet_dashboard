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
    
    // ✅ Pad address for topic filtering (must have 0x prefix + 24 zeros + address)
    const paddedAddress = "0x" + address.replace("0x", "").padStart(64, "0");

    // 🕒 Today midnight (server time)
    const now = new Date();
    const midnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();

    // ✅ Fetch RECEIVED transactions (where user is in topic2 = recipient)
    const receivedBody = {
      range: { unit: "block", from: 0, to: 9999999999 },
      options: { offset: 0, limit: 100 },
      criteriaSet: [
        {
          address: CONTRACT,
          topic0: TRANSFER_TOPIC,
          topic2: paddedAddress,  // ✅ User is RECIPIENT
        },
      ],
      order: "desc",
    };

    // ✅ Fetch SENT transactions (where user is in topic1 = sender)
    const sentBody = {
      range: { unit: "block", from: 0, to: 9999999999 },
      options: { offset: 0, limit: 100 },
      criteriaSet: [
        {
          address: CONTRACT,
          topic0: TRANSFER_TOPIC,
          topic1: paddedAddress,  // ✅ User is SENDER
        },
      ],
      order: "desc",
    };

    // ✅ Make both API calls in parallel
    const [receivedRes, sentRes] = await Promise.all([
      fetch("https://mainnet.vechain.org/logs/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(receivedBody),
      }),
      fetch("https://mainnet.vechain.org/logs/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sentBody),
      }),
    ]);

    if (!receivedRes.ok || !sentRes.ok) {
      const msg = await (receivedRes.ok ? sentRes : receivedRes).text();
      return new Response(
        JSON.stringify({ error: "Node error", message: msg }),
        { status: 500 }
      );
    }

    const receivedData = await receivedRes.json();
    const sentData = await sentRes.json();

    // ✅ API returns array directly, NOT { logs: [...] }
    const receivedLogs = Array.isArray(receivedData) ? receivedData : [];
    const sentLogs = Array.isArray(sentData) ? sentData : [];

    // ✅ Filter for today's transactions only
    const filterToday = (logs) =>
      logs.filter((log) => {
        if (!log.meta?.blockTimestamp) return false;
        return log.meta.blockTimestamp * 1000 >= midnight;
      });

    const todaysReceived = filterToday(receivedLogs);
    const todaysSent = filterToday(sentLogs);

    // ✅ Sum amounts (BigInt safe)
    let totalReceived = 0n;
    let totalSent = 0n;

    for (const log of todaysReceived) {
      if (log.data) {
        totalReceived += BigInt(log.data);
      }
    }

    for (const log of todaysSent) {
      if (log.data) {
        totalSent += BigInt(log.data);
      }
    }

    const DECIMALS = 18;

    function formatUnits(value, decimals) {
      const s = value.toString().padStart(decimals + 1, "0");
      const i = s.slice(0, -decimals);
      const f = s.slice(-decimals).replace(/0+$/, "");
      return f ? `${i}.${f}` : i;
    }

    const receivedAmount = formatUnits(totalReceived, DECIMALS);
    const sentAmount = formatUnits(totalSent, DECIMALS);

    return new Response(
      JSON.stringify({
        address,
        symbol: "B3TR",
        transactions_24h: {
          received: {
            total: Number(receivedAmount).toFixed(4),
            tx_count: todaysReceived.length,
          },
          sent: {
            total: Number(sentAmount).toFixed(4),
            tx_count: todaysSent.length,
          },
          net: {
            total: (Number(receivedAmount) - Number(sentAmount)).toFixed(4),
          },
        },
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error("❌ Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: err.message }),
      { status: 500 }
    );
  }
}
