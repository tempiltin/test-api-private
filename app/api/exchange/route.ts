import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ORIGIN = process.env.APP_ORIGIN || "https://api-private-for-test.vercel.app";
const BACKEND_PATH = "/uz/arkhiv-kursov-valyut/json/";
const BACKEND_URL = (process.env.BACKEND_URL || "https://cbu.uz") + BACKEND_PATH;

function securityHeaders(origin = ALLOWED_ORIGIN) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer-when-downgrade",
  };
}

// OPTIONS (preflight) handler
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  if (origin !== ALLOWED_ORIGIN) {
    return new NextResponse(JSON.stringify({ error: "CORS preflight blocked" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: securityHeaders(origin),
  });
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || "";

    // Strict: agar origin aniq va biz ko'rsatgan domain bilan mos kelmasa -> blok
    if (origin !== ALLOWED_ORIGIN) {
      return new NextResponse(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Server -> upstream fetch
    const upstream = await fetch(BACKEND_URL, { method: "GET", cache: "no-store" });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "Upstream error");
      return new NextResponse(JSON.stringify({ error: "Upstream error", details: text }), {
        status: upstream.status || 502,
        headers: securityHeaders(origin),
      });
    }

    const data = await upstream.json();

    return NextResponse.json(data, { headers: securityHeaders(origin) });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
