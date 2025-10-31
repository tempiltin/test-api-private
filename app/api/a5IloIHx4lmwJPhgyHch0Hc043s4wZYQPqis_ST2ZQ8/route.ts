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

// OPTIONS handler (CORS preflight)
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  // Agar origin bo'lsa va mos kelmasa -> blok
  if (origin && origin !== ALLOWED_ORIGIN) {
    return new NextResponse(JSON.stringify({ error: "CORS preflight blocked" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: securityHeaders(origin || ALLOWED_ORIGIN),
  });
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || "";

    // Ruxsat qoidasi:
    // - agar origin mavjud bo'lsa, faqat ALLOWED_ORIGIN ga ruxsat
    // - agar origin yo'q (ba'zan fetch SSR/edge yoki curl/other clientlarda bo'lishi mumkin),
    //   biz referer yoki host orqali qo'shimcha tekshiruv qilamiz yoki uni ruxsat beramiz.
    if (origin) {
      if (origin !== ALLOWED_ORIGIN) {
        return new NextResponse(JSON.stringify({ error: "Access denied (origin mismatch)" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // origin yo'q — bu holatda biz referer yoki host tekshirishi qilamiz (ixtiyoriy)
      const referer = req.headers.get("referer") || "";
      const host = req.headers.get("host") || "";

      // Agar kerakli qat'iylik bo'lsa, quyidagi shartlardan birini talab qiling:
      // - referer ichida allowed origin bor, yoki host serverni o'zi bo'lsa (server-internal)
      const okReferer = referer.includes(ALLOWED_ORIGIN.replace(/^https?:\/\//, ""));
      const okHost = host.includes("vercel.app") || host.includes("localhost");

      if (!okReferer && !okHost) {
        return new NextResponse(JSON.stringify({ error: "Access denied (no origin/referer)" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Upstream fetch
    const upstream = await fetch(BACKEND_URL, { method: "GET", cache: "no-store" });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "Upstream error");
      return new NextResponse(JSON.stringify({ error: "Upstream error", details: text }), {
        status: upstream.status || 502,
        headers: securityHeaders(origin || ALLOWED_ORIGIN),
      });
    }

    const data = await upstream.json();

    // Data strukturasini tekshirish — biz clientga array yuborishimiz kerak
    // Agar backend boshqa formatda yuborsa, bu yerda qayta nomlaymiz yoki wrapping qilamiz.
    // Masalan: backend raw array bo'lsa -> return array; agar object bo'lsa -> agar data.rates bor -> return that.
    let payload: any = data;
    if (!Array.isArray(data)) {
      // agar data.rates mavjud bo'lsa — shu arrayni beramiz
      if (Array.isArray((data as any).rates)) {
        payload = (data as any).rates;
      } else if (Array.isArray((data as any).data)) {
        payload = (data as any).data;
      } else {
        // backend boshqa format yubordi — biz xatolik xabarini yuboramiz
        return new NextResponse(JSON.stringify({ error: "Upstream returned unexpected format", sample: data }), {
          status: 502,
          headers: securityHeaders(origin || ALLOWED_ORIGIN),
        });
      }
    }

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: securityHeaders(origin || ALLOWED_ORIGIN),
    });
  } catch (err) {
    return new NextResponse(JSON.stringify({ error: "Server error", details: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
