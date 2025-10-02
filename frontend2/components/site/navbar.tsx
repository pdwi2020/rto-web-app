"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu } from "lucide-react"

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <nav aria-label="Primary" className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="Portal logo" width={24} height={24} className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-tight">Portal</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
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
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-2">
                {links.map((l) => {
                  const active = pathname === l.href
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={
                        active
                          ? "rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
                          : "rounded-md px-4 py-3 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                      }
                    >
                      {l.label}
                    </Link>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
