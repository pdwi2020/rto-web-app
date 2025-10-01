"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/site/theme-toggle"

const links = [
  { href: "/", label: "Home" },
  { href: "/citizen", label: "Citizen" },
  { href: "/broker", label: "Broker" },
  { href: "/admin", label: "Admin" },
  { href: "/brokers", label: "Brokers" },
  { href: "/apply", label: "Apply" },
  { href: "/chat", label: "Chat" },
]

export function Navbar() {
  const pathname = usePathname()
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <nav aria-label="Primary" className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Portal logo" width={24} height={24} className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-tight">Portal</span>
          </Link>
        </div>

        <ul className="hidden items-center gap-1 sm:flex">
          {links.map((l) => {
            const active = pathname === l.href
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                      : "rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                  }
                >
                  {l.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
