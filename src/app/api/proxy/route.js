import { NextRequest, NextResponse } from 'next/server';

const BINANCE_BASE = "https://www.binance.com";
const SHARED_SECRET = process.env.PROXY_SECRET!;

export async function POST(request: NextRequest) {
  const auth = request.headers.get("x-proxy-secret");
  if (auth !== SHARED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path, body, key } = await request.json();

  const upstream = await fetch(`${BINANCE_BASE}${path}`, {
    method: "POST",
    headers: {
      "X-Square-OpenAPI-Key": key,
      "Content-Type": "application/json",
      "clienttype": "binanceSkill",
    },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
