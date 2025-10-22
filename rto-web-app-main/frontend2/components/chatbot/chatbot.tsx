/* eslint-disable react-hooks/rules-of-hooks */
"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { sendChatMessage } from "@/lib/api"

type Message = { id: string; role: "user" | "assistant"; content: string }

function useApiChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      content: text,
    }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const response = await sendChatMessage(text)
      const reply: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: response,
      }
      setMessages((m) => [...m, reply])
    } catch (error) {
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }
      setMessages((m) => [...m, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value)
  }

  return { messages, input, handleInputChange, handleSubmit, isLoading }
}

function useMockChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text) return
    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      content: text,
    }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setIsLoading(true)

    await new Promise((r) => setTimeout(r, 450))
    const reply: Message = {
      id: String(Date.now() + 1),
      role: "assistant",
      content:
        `Here's a helpful summary: I understood "${text}". ` +
        "Since live AI isn't enabled yet, this is a preview of the experience. " +
        "Ask about applications, timelines, or broker options.",
    }
    setMessages((m) => [...m, reply])
    setIsLoading(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value)
  }

  return { messages, input, handleInputChange, handleSubmit, isLoading }
}

export function Chatbot({
  openByDefault = false,
  mock = false,
}: {
  openByDefault?: boolean
  mock?: boolean
}) {
  const [open, setOpen] = useState(openByDefault)
  const scrollRef = useRef<HTMLDivElement>(null)

  const chat = mock ? useMockChat() : useApiChat()

  const messagesLen = chat.messages?.length ?? 0
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messagesLen])

  const modeLabel = useMemo(() => (mock ? "Mock Mode" : "Live"), [mock])

  return (
    <>
      {!openByDefault && (
        <button
          type="button"
          className="fixed bottom-4 right-4 inline-flex items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls="ai-chatbot"
        >
          Ask AI
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="chatbot-title"
          id="ai-chatbot"
          className={openByDefault ? "relative" : "fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"}
        >
          {!openByDefault && (
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} aria-hidden="true" />
          )}
          <div
            className={`relative z-10 ${openByDefault ? "" : "m-3 w-full max-w-lg"} rounded-lg border border-neutral-200 bg-white p-4 shadow-xl`}
          >
            <div className="flex items-center justify-between">
              <h2 id="chatbot-title" className="text-base font-semibold">
                AI Assistant{" "}
                <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600">{modeLabel}</span>
              </h2>
              {!openByDefault && (
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label="Close chatbot"
                >
                  Close
                </button>
              )}
            </div>

            <div
              ref={scrollRef}
              className="mt-3 max-h-72 space-y-2 overflow-y-auto rounded-md border border-neutral-200 p-2"
              aria-live="polite"
            >
              {chat.messages?.map?.((m: any) => (
                <div key={m.id} className="text-sm">
                  <span className="mr-2 font-medium text-neutral-700">{m.role === "user" ? "You" : "AI"}:</span>
                  <span className="text-neutral-800">{m.content}</span>
                </div>
              ))}
              {(!chat.messages || chat.messages.length === 0) && (
                <p className="text-sm text-neutral-600">Ask about your application, timelines, or broker options.</p>
              )}
            </div>

            <form onSubmit={chat.handleSubmit} className="mt-3 flex items-center gap-2">
              <label className="sr-only" htmlFor="chat-input">
                Your message
              </label>
              <input
                id="chat-input"
                value={chat.input}
                onChange={chat.handleInputChange}
                placeholder="Type your message..."
                className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={chat.isLoading || !chat.input?.trim()}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
