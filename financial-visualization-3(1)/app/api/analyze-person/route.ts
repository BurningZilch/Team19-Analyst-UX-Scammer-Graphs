import { generateText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(req: Request) {
  try {
    const { person, connections } = await req.json()

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return Response.json({ error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured" }, { status: 500 })
    }

    const prompt = `You are a fraud intelligence analyst. Analyze the following person in a scam network and provide insights.

Person Details:
- ID: ${person.id}
- Label: ${person.label}
- Type: ${person.group}
- Risk Score: ${person.risk}/100
- Location: ${person.location}
${person.scam_type ? `- Scam Type: ${person.scam_type}` : ""}
${person.financial_instrument ? `- Financial Instrument: ${person.financial_instrument}` : ""}

Connections:
${connections.map((c: any) => `- ${c.type === "attack" ? "Attacked" : "Connected to"} ${c.target} (${c.type}${c.amount ? `, $${c.amount.toLocaleString()}` : ""}${c.method ? `, via ${c.method}` : ""})`).join("\n")}

Provide a brief analysis (3-4 sentences) covering:
1. Risk assessment based on their profile
2. Network position and influence
3. Recommended actions or observations`

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt,
      maxTokens: 500,
    })

    return Response.json({ analysis: text })
  } catch (error) {
    console.error("Analysis error:", error)
    return Response.json({ error: "Failed to analyze. Please check your API key is configured." }, { status: 500 })
  }
}
