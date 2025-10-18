"use client"

import { Navbar } from "@/components/site/navbar"
import { Chatbot } from "@/components/chatbot/chatbot"

export default function ChatPage() {
  return (
    <main id="main-content" className="min-h-dvh bg-white text-neutral-900">
      <Navbar />
      <section className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Chat with AI</h1>
        <p className="mt-1 text-neutral-600">
          Ask questions about RTO services, application status, or get help with your vehicle registration needs.
          Powered by Google Gemini AI.
        </p>

        <div className="mt-6">
          <Chatbot openByDefault mock={false} />
        </div>
      </section>
    </main>
  )
}
