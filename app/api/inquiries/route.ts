import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

const windowMs = 15 * 60 * 1000;
const maxRequestsPerWindow = 5;
const requestCounts = new Map<string, { count: number; expiresAt: number }>();

type InquiryType = "general" | "property" | "visit" | "reservation" | "plan" | "estimate";

function isInquiryType(value: unknown): value is InquiryType {
  return ["general", "property", "visit", "reservation", "plan", "estimate"].includes(String(value));
}

function tooManyRequests(ip: string) {
  const now = Date.now();
  for (const [key, entry] of requestCounts) {
    if (entry.expiresAt <= now) requestCounts.delete(key);
  }
  const entry = requestCounts.get(ip);
  if (!entry || entry.expiresAt <= now) {
    requestCounts.set(ip, { count: 1, expiresAt: now + windowMs });
    return false;
  }
  entry.count += 1;
  return entry.count > maxRequestsPerWindow;
}

async function verifyTurnstile(token: unknown, request: NextRequest) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("Turnstile Siteverify is not configured for this deployment.");
    return null;
  }
  if (typeof token !== "string" || !token) return false;

  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const form = new URLSearchParams({
    secret,
    response: token,
  });
  if (ip) form.set("remoteip", ip);
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      cache: "no-store",
    });
    const result = (await response.json()) as { success?: boolean; hostname?: string; "error-codes"?: string[] };
    if (!response.ok || result.success !== true) {
      console.warn("Turnstile Siteverify rejected an inquiry token.", {
        status: response.status,
        errorCodes: result["error-codes"] ?? [],
      });
      return false;
    }
    const expectedHostname = new URL(request.url).hostname;
    if (result.hostname !== expectedHostname) {
      console.warn("Turnstile Siteverify returned an unexpected hostname.", {
        expectedHostname,
        receivedHostname: result.hostname ?? "",
      });
      return false;
    }
    return true;
  } catch {
    console.error("Turnstile Siteverify request failed.");
    return false;
  }
}

export async function POST(request: NextRequest) {
  const bodySize = Number(request.headers.get("content-length") ?? 0);
  if (bodySize > 12000) {
    return NextResponse.json({ error: "La demande est trop volumineuse." }, { status: 413 });
  }
  const ip =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  if (tooManyRequests(ip)) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) {
    return NextResponse.json({ error: "Le service de contact n’est pas configuré." }, { status: 503 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "La demande envoyée est invalide." }, { status: 400 });
  }

  if (typeof payload.website === "string" && payload.website.trim()) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }
  const turnstileResult = await verifyTurnstile(payload.turnstileToken, request);
  if (turnstileResult === null) {
    return NextResponse.json({ error: "La vérification anti-robot n’est pas configurée sur le site." }, { status: 503 });
  }
  if (!turnstileResult) {
    return NextResponse.json({ error: "La vérification anti-robot a expiré. Réessayez." }, { status: 400 });
  }

  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
  const message = typeof payload.message === "string" ? payload.message.trim() : "";

  if (
    !fullName ||
    fullName.length > 150 ||
    email.length > 255 ||
    phone.length > 30 ||
    subject.length > 200 ||
    !message ||
    message.length > 5000 ||
    (!email && !phone) ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    !isInquiryType(payload.inquiryType)
  ) {
    return NextResponse.json({ error: "Vérifiez les champs de votre demande." }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: {
      fetch: (input, init) =>
        fetch(input, { ...init, signal: AbortSignal.timeout(8000) }),
    },
  });
  const { error } = await supabase.from("inquiries").insert({
    inquiry_type: payload.inquiryType,
    full_name: fullName,
    email: email || null,
    phone: phone || null,
    subject: subject || null,
    message,
  });

  if (error) {
    return NextResponse.json({ error: "La demande n’a pas pu être enregistrée." }, { status: 503 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
