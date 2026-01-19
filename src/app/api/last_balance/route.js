export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawAddress = (searchParams.get("address") || "").trim();

    if (!rawAddress) {
      return new Response(JSON.stringify({ error: "Missing address" }), { status: 400 });
    }

    const address = rawAddress.toLowerCase();

    if (!/^0x[a-f0-9]{40}$/.test(address)) {
      return new Response(JSON.stringify({ error: "Invalid address format" }), { status: 400 });
    }

    // 🟢 SOURCE WALLET
    const TARGET = "0x6bee7ddab6c99d5b2af0554eaea484ce18f52631".toLowerCase();

    // Fetch latest 50 transfers
    const url = `https://explore.vechain.org/api/accounts/${address}/transfers?limit=50&offset=0`;
    const response = await fetch(url);
    const text = await response.text();

    if (!response.ok) {
      let parsedMsg = text;
      try {
        const parsed = JSON.parse(text);
        parsedMsg = parsed.message || parsed.error || text;
      } catch {}
      return new Response(JSON.stringify({ error: "Explorer error", message: parsedMsg }), {
        status: response.status,
      });
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid explorer response", message: text }), {
        status: 502,
      });
    }

    const transfers = Array.isArray(data.transfers) ? data.transfers : [];

    // 🕒 Get today's midnight (local server time)
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    // ✅ Only transfers that happened TODAY
    const todaysTx = transfers.filter(
      (tx) => tx.meta?.blockTimestamp && tx.meta.blockTimestamp * 1000 >= midnight
    );

    // ✅ Only count transfers received from TARGET
    const receivedFromTarget = todaysTx.filter(
      (tx) =>
        tx.sender?.toLowerCase() === TARGET &&
        tx.recipient?.toLowerCase() === address
    );

    // Sent transactions today (optional)
    const sentToday = todaysTx.filter((tx) => tx.sender?.toLowerCase() === address);

    const sumAmount = (list) =>
      list.reduce((sum, tx) => {
        try {
          const amt = typeof tx.amount === "string" && tx.amount.startsWith("0x")
            ? parseInt(tx.amount, 16)
            : Number(tx.amount || 0);
          const decimals = tx.decimals ?? 18;
          return sum + amt / Math.pow(10, decimals);
        } catch {
          return sum;
        }
      }, 0);

    const totalReceived = sumAmount(receivedFromTarget);
    const totalSent = sumAmount(sentToday);

    const symbol =
      receivedFromTarget[0]?.symbol ||
      sentToday[0]?.symbol ||
      "B3TR";

   return new Response(
  JSON.stringify({
    address,
    symbol,
    received_24h: {
      target: TARGET,
      total: totalReceived.toFixed(2),
      tx_count: receivedFromTarget.length,
    },
    sent_24h: {
      total: totalSent.toFixed(2),
      tx_count: sentToday.length,
    },
  }),
  { status: 200 }
);


  } catch (err) {
    console.error("❌ Error in /token-today:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: err.message }),
      { status: 500 }
    );
  }
}
