"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"

export function AnnouncementsTicker() {
  const listRef = useRef<HTMLUListElement>(null)

  // Basic auto-scroll for marquee-like feel (accessible, pauses on hover via CSS)
  useEffect(() => {
    const el = listRef.current
    if (!el) return
    let frame: number
    let y = 0
    const tick = () => {
      y += 0.3
      el.style.transform = `translateY(-${y}px)`
      // reset when scrolled past half height
      if (y > el.scrollHeight / 2) y = 0
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  const items = [
    { href: "#", text: "Advisory: Avoid sharing OTP with anyone claiming support." },
    { href: "#", text: "New: Online appointment system for Driving License tests." },
    { href: "#", text: "Update: e-Challan portal enhancements and faster payments." },
    { href: "#", text: "Info: National Permit renewal now available online." },
  ]

  // Duplicate list for seamless loop
  const loopItems = [...items, ...items]

  return (
    <section aria-label="Announcements and advisories" className="bg-secondary">
      <div className="mx-auto max-w-6xl px-4 py-2">
        <div className="flex items-center gap-3">
          <span className="rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
            Announcements
          </span>
          <div className="relative h-8 flex-1 overflow-hidden">
            <ul
              ref={listRef}
              aria-live="polite"
              className="group will-change-transform transition-none hover:[animation-play-state:paused] [transform:translateY(0)]"
            >
              {loopItems.map((a, i) => (
                <li key={i} className="h-8 leading-8">
                  <Link href={a.href} className="text-sm text-foreground underline-offset-2 hover:underline">
                    {a.text}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
