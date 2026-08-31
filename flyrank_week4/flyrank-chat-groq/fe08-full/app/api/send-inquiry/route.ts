/**
 * app/api/send-inquiry/route.ts
 * ─────────────────────────────────────────────────────────────
 * FE-10 addition: the real side effect behind the sendInquiry tool.
 *
 * Architecture note: this route is deliberately separate from the
 * sendInquiry AI SDK tool itself (see app/api/chat/route.ts), which
 * still has NO `execute` function — that's what forces the model to
 * pause and wait for a human confirm/decline click before anything
 * can happen. This route is what the CLIENT calls, and only calls,
 * at the moment a human actually clicks "Confirm" — never before,
 * never automatically. The guardrail lives in the tool design; this
 * route is just the real action that guardrail unlocks.
 * ─────────────────────────────────────────────────────────────
 */
import { Resend } from "resend";

const TO_EMAIL = process.env.MURK_EMAIL ?? "murkchanna26@gmail.com";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const summary = body?.summary;

    if (!summary || typeof summary !== "string") {
      return new Response(JSON.stringify({ error: "Missing or invalid summary" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("[send-inquiry] RESEND_API_KEY is not set in environment");
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      // Resend's shared sandbox sender — works with zero domain setup.
      // Swap to a verified domain address later if you want a nicer
      // "From" name once you've verified a domain with Resend.
      from: "FlyRank AI Chat <onboarding@resend.dev>",
      to: TO_EMAIL,
      subject: "New inquiry from your portfolio chat",
      text: [
        "A visitor confirmed sending you this inquiry through the portfolio chat widget:",
        "",
        summary,
        "",
        "This was only sent after the visitor explicitly clicked \"Yes, send it\" —",
        "the AI never sends anything without that confirmation.",
      ].join("\n"),
    });

    if (error) {
      console.error("[send-inquiry] Resend returned an error:", error);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[send-inquiry] Unexpected error:", e);
    return new Response(JSON.stringify({ error: "Unexpected server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}