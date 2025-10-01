import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    // Get the last message from the user
    const lastMessage = messages[messages.length - 1]
    const userMessage = lastMessage?.content || ""

    // Call backend chat endpoint
    const response = await fetch(`${API_BASE_URL}/chat/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    })

    if (!response.ok) {
      throw new Error("Backend chat API failed")
    }

    const data = await response.json()

    // Return in AI SDK format
    return NextResponse.json({
      id: Date.now().toString(),
      role: "assistant",
      content: data.response,
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Failed to get response from AI" },
      { status: 500 }
    )
  }
}
