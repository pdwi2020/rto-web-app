import Link from "next/link"

type Service = {
  title: string
  desc: string
  href: string
  img: string
  alt: string
}

const services: Service[] = [
  {
    title: "Driving License",
    desc: "Apply, renew, track DL services online.",
    href: "/apply",
    img: "/generic-identification-card.png",
    alt: "Driving License services",
  },
  {
    title: "Vehicle Registration",
    desc: "New registration, transfer of ownership.",
    href: "/apply",
    img: "/vehicle-registration.jpg",
    alt: "Vehicle Registration services",
  },
  {
    title: "e-Challan",
    desc: "View and pay challans securely.",
    href: "/apply",
    img: "/e-challan.jpg",
    alt: "e-Challan services",
  },
  {
    title: "Fancy Number",
    desc: "Bid and reserve fancy numbers.",
    href: "/apply",
    img: "/fancy-number-reservation.jpg",
    alt: "Fancy Number reservation",
  },
  {
    title: "Permit",
    desc: "National and state permits.",
    href: "/apply",
    img: "/transport-permit.jpg",
    alt: "Transport permit services",
  },
  {
    title: "Fitness/PUC",
    desc: "Fitness and PUC certifications.",
    href: "/apply",
    img: "/vehicle-fitness-puc.jpg",
    alt: "Vehicle fitness and PUC",
  },
]

export function ServicesGrid() {
  return (
    <section aria-label="e-Services" className="bg-card">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-4">
          <h2 className="text-xl font-semibold">e-Services</h2>
          <p className="text-sm text-muted-foreground">Popular online transport services at your fingertips</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {services.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="group grid grid-rows-[auto_1fr_auto] gap-2 rounded-lg border border-border bg-background p-4 hover:bg-accent"
              aria-label={s.title}
            >
              <img
                src={s.img || "/placeholder.svg"}
                alt={s.alt}
                className="h-28 w-full rounded-md object-cover"
                width={200}
                height={120}
              />
              <div>
                <h3 className="text-base font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
              <span className="text-sm font-medium text-primary">Explore →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
