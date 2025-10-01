export function StatsRow() {
  const stats = [
    { label: "Registered Vehicles", value: "3.2 Cr+" },
    { label: "Driving Licenses Issued", value: "1.1 Cr+" },
    { label: "RTO/DTO Offices", value: "1,200+" },
    { label: "Daily Transactions", value: "5.4 L+" },
  ]

  return (
    <section aria-label="Key statistics" className="bg-secondary">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-3 px-4 py-6 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md border border-border bg-background p-3 text-center">
            <p className="text-xl font-semibold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
