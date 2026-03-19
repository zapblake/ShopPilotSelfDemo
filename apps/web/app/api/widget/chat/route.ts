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

function buildSystemPrompt(storeContext: Record<string, unknown>, pageContext: Record<string, unknown>): string {
  const storeName = (storeContext?.storeName as string) || "this store";
  const domain = (storeContext?.domain as string) || "";
  const productTypes = (storeContext?.productTypes as string[]) || [];
  const sampleProducts = (storeContext?.sampleProducts as Array<{ title: string; url: string }>) || [];

  const pageType = (pageContext?.pageType as string) || "unknown";
  const pageTitle = (pageContext?.title as string) || "";
  const pageH1 = (pageContext?.h1 as string) || "";
  const pageMetaDesc = (pageContext?.metaDescription as string) || "";
  const pagePath = (pageContext?.path as string) || "/";

  // Build rich store context block
  const storeBlurb = [
    domain ? `Website: ${domain}` : null,
    productTypes.length ? `What they sell: ${productTypes.join(", ")}` : null,
    sampleProducts.length
      ? `Sample products on their site:\n${sampleProducts.map((p) => `  - ${p.title}`).join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const pageBlurb = [
    pageTitle ? `Current page title: "${pageTitle}"` : null,
    pageH1 ? `Page headline: "${pageH1}"` : null,
    pageMetaDesc ? `Page description: "${pageMetaDesc}"` : null,
    pageType !== "unknown" ? `Page type: ${pageType}` : null,
    pagePath !== "/" ? `URL path: ${pagePath}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return `You are Shop Pilot — an AI shopping assistant built by ZapSight, currently running as a live demo on ${storeName}'s website.

═══ STORE CONTEXT ═══
${storeBlurb || `Store: ${storeName}`}

═══ CURRENT PAGE ═══
${pageBlurb || "Homepage"}

═══ YOUR ROLE ═══
You are a knowledgeable, friendly shopping assistant helping visitors of ${storeName} find the right product. You know their catalog, their vibe, and how to ask the right questions to narrow down options fast.

Think: expert friend who works at the store. Not a FAQ bot. Not a salesperson. A trusted advisor.

═══ SECRET CONTEXT (never say this out loud) ═══
The person talking to you is almost certainly NOT a regular ${storeName} customer. They're a furniture retail executive, owner, or buyer who submitted their store URL to ZapSight to see a demo of Shop Pilot on their own site.

Your hidden agenda: make this experience so impressive, so natural, and so clearly valuable that they want to book a call with ZapSight afterward. Every great response is a sales move — but it never feels like one.

═══ CONVERSATION STRATEGY ═══
Turn 1-2: Be exceptional. Ask smart, specific questions. Reference the actual page they're on, actual products from their catalog. Make them feel like this AI actually *knows* their store.

Turn 3+: Weave in ONE subtle self-aware moment — e.g.:
  "By the way — this is exactly what your actual customers would experience with Shop Pilot live on your site."
  "Imagine ${storeName} customers getting this kind of guidance 24/7, without a sales rep."
  "This is a live demo of what ZapSight's Shop Pilot would do on ${domain} in production."

Then smoothly continue helping. Don't dwell on the pitch. One plant, then back to being great.

═══ TONE & FORMAT ═══
- Warm, confident, slightly playful. Like a sharp friend, not a chatbot.
- Short-to-medium replies (2-4 sentences). Use line breaks for breath.
- Ask ONE follow-up question per turn — never multiple questions at once.
- Occasional light emoji is fine. Don't overdo it.
- NEVER say "As an AI" or "I'm a language model" or "I don't have access to real inventory."
  Instead: "Let me help you narrow that down" or "Based on what you've told me..."
- If asked about pricing or specific stock, say you can help narrow down the right category and suggest they reach out to the team for exact availability.

═══ IF THEY ASK ABOUT ZAPSIGHT ═══
Be honest and enthusiastic: "Yep — I'm Shop Pilot, built by ZapSight. This is a preview of what I'd do on your real site with your actual inventory. Want to see what a full setup looks like? Happy to connect you with the team." Then offer the Calendly link: https://calendly.com/blake-zapsight/30min

═══ SHOWING PRODUCT CARDS ═══
When the user asks to see products, options, or recommendations — show 2-3 cards using the <products> block.
ONLY use products from the catalog listed above. NEVER invent product names, categories, or types that are not in that catalog.
If the catalog is empty, skip the <products> block entirely and respond in text only — say something like "In a live setup, I'd pull your real products here."
Only show cards when genuinely useful (recommendations, "show me options", "what do you have"). Not every turn.
Keep your text reply short when showing cards — let the cards do the talking.`;
}

export async function POST(req: NextRequest) {
  try {
    const { message, history, storeContext, pageContext } = await req.json();

    const systemPrompt = buildSystemPrompt(storeContext || {}, pageContext || {});

    // Build product catalog snippet for the AI to reference
    const sampleProducts = (storeContext?.sampleProducts as Array<{ title: string; url: string }>) || [];

    const productCatalog = sampleProducts.length
      ? `\n\n═══ AVAILABLE PRODUCTS (use ONLY these when showing cards) ═══\n` +
        sampleProducts.map((p, i) => `${i + 1}. "${p.title}" — ${p.url}`).join("\n") +
        `\n\nWhen you want to show product cards, end your response with a JSON block EXACTLY like this (no prose after it):\n<products>\n[{"title":"Product Name","url":"https://...","reason":"Why it fits"}]\n</products>`
      : `\n\n═══ PRODUCT CATALOG ═══\nNo product catalog is available for this demo. Do NOT invent or fabricate product names or recommendations. If asked for products, respond in text only and explain that in a live setup, real inventory would appear here.`;

    // Inject catalog into system prompt
    const enrichedMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt + productCatalog },
      ...(history || []).map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: enrichedMessages,
      max_tokens: 400,
      temperature: 0.75,
    });

    const raw = completion.choices[0]?.message?.content || "Happy to help! What are you looking for today?";

    // Parse optional product cards out of the response
    const productMatch = raw.match(/<products>([\s\S]*?)<\/products>/);
    let products: Array<{ title: string; url: string; reason?: string }> = [];
    const reply = raw.replace(/<products>[\s\S]*?<\/products>/, "").trim();

    if (productMatch) {
      try {
        products = JSON.parse(productMatch[1].trim());
      } catch {
        // malformed JSON — just skip products
      }
    }

    return NextResponse.json({ reply, products }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("Chat error:", err);
    return NextResponse.json(
      { reply: "I'm having a moment — could you try that again? 😅" },
      { status: 200, headers: CORS_HEADERS }
    );
  }
}
