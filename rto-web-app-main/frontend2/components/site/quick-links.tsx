import Link from "next/link"
import { CreditCard, Car, FileText, CalendarClock, BadgeCheck, Search, Gavel, ShieldCheck } from "lucide-react"

const links = [
  { href: "/apply", label: "Apply for DL", icon: BadgeCheck },
  { href: "/apply", label: "Vehicle Registration", icon: Car },
  { href: "/apply", label: "Tax Payment", icon: CreditCard },
  { href: "/apply", label: "Book Appointment", icon: CalendarClock },
  { href: "/apply", label: "Check RC/DL Status", icon: Search },
  { href: "/apply", label: "e-Challan", icon: Gavel },
  { href: "/apply", label: "PUC Certificate", icon: ShieldCheck },
  { href: "/apply", label: "Download Forms", icon: FileText },
]

export function QuickLinks() {
  return (
    <section aria-label="Quick Links" className="bg-card">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h2 className="text-lg font-semibold">Quick Links</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="group rounded-md border border-border bg-background p-3 text-center hover:bg-accent"
              aria-label={label}
            >
              <Icon className="mx-auto mb-2 h-5 w-5 text-foreground group-hover:opacity-90" />
              <span className="text-xs text-foreground">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
