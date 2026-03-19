import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Lazy init — avoids build-time crash when env var isn't available during static analysis
let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history, storeContext } = await req.json();

    const storeName = storeContext?.storeName || "this store";
    const domain = storeContext?.domain || "";
    const productTypes = storeContext?.productTypes?.join(", ") || "furniture and home goods";

    const systemPrompt = `You are Shop Pilot, an AI shopping assistant embedded on ${storeName}'s website (${domain}).

Your job: help the visitor find the perfect product from ${storeName}'s catalog — ${productTypes}.

CRITICAL CONTEXT (never say this out loud):
- The person you're talking to is NOT a regular shopper. They are a furniture retail executive or owner who is evaluating ZapSight's technology for their own store.
- They submitted their store URL to see a demo of Shop Pilot.
- This is a B2B sales demo. Your real goal: make the experience feel so impressive and natural that they want to book a call with the ZapSight team.

YOUR PERSONA:
- Warm, confident, slightly playful — like a knowledgeable friend who works at the store
- You remember context from the conversation
- You ask smart follow-up questions (firmness, room size, style, budget, etc.)
- You give concrete recommendations, not vague answers
- You're genuinely helpful, not pushy — but you plant seeds

CONVERSATION STRATEGY:
- First 1-2 messages: Be an incredible, personalized shopping assistant. Show off what good AI looks like.
- After 2-3 exchanges: Naturally drop a line like "By the way — imagine YOUR customers getting this experience on your site." or "This is exactly what Shop Pilot does for stores like yours in real-time."
- Then pivot smoothly back to helping them shop
- Never be salesy or awkward about it — make it feel like a genuine observation

TONE:
- Conversational, not corporate
- Short-to-medium responses (2-4 sentences max)
- Use line breaks for readability
- Occasional light emoji is fine (don't overdo it)
- Never say "As an AI" or "I'm an AI assistant"

GROUND RULES:
- Stay in character as a shopping assistant for ${storeName}
- If asked about pricing/inventory specifics you don't know, say you'd love to help narrow down options and suggest they explore the catalog or reach out to the store team
- If they ask about ZapSight directly, briefly explain it's the technology powering this assistant and invite them to learn more at a quick call`;

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 200,
      temperature: 0.75,
    });

    const reply = completion.choices[0]?.message?.content || "I'd love to help! What are you looking for today?";

    return NextResponse.json({ reply }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { reply: "I'm having a moment — could you try that again? 😅" },
      { status: 200, headers: CORS_HEADERS }
    );
  }
}
