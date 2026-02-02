import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    let body: { text?: unknown; history?: unknown };
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(JSON.stringify({ error: "Invalid JSON in request body." }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { text, history } = body;
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'text'." }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No OPENAI_API_KEY set." }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const messages = [
      { role: "system", content:
        "You are 'ADPT Coach'—a concise, friendly, and knowledgeable fitness & nutrition coach. " +
        "Give practical advice. Adapt for injuries, prefer simple progressions, macros in grams, " +
        "and clear actionable steps. Keep responses focused and under 150 words unless more detail is needed."
      },
      ...(Array.isArray(history) ? history : []).map((m: any) => ({
        role: m?.role === "assistant" ? "assistant" : "user",
        content: String(m?.content ?? ""),
      })),
      { role: "user", content: text },
    ];

    const model = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, messages, temperature: 0.4, max_tokens: 500 }),
    });

    if (!r.ok) {
      const errorText = await r.text();
      console.error(`OpenAI API error (${r.status}):`, errorText);

      let errorMessage = "AI service temporarily unavailable.";
      let errorCode: string | undefined;
      try {
        const errorData = JSON.parse(errorText);
        errorCode = errorData?.error?.code;
        if (errorCode === "insufficient_quota") {
          errorMessage = "Service is at capacity. Please try again later.";
        } else if (errorCode === "invalid_api_key") {
          errorMessage = "Service configuration error. Please contact support.";
        }
      } catch {
        // ignore parse error
      }

      return new Response(JSON.stringify({
        reply: errorMessage,
        error: true,
        debug: errorCode ? { code: errorCode } : undefined,
      }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("Unexpected OpenAI response structure:", JSON.stringify(data));
      return new Response(JSON.stringify({
        reply: "I had trouble processing that. Could you try rephrasing?",
        error: true,
      }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Unexpected error in chat function:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
