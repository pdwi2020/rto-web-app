"use client"

import { Navbar } from "@/components/site/navbar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export default function BrokerDashboard() {
  return (
    <main id="main-content" className="min-h-dvh bg-white text-neutral-900">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Broker</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Broker Dashboard</h1>
        <p className="mt-1 text-neutral-600">Your assignments and workloads.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-neutral-200 p-4">
            <h2 className="text-lg font-medium">Assignments</h2>
            <ul className="mt-3 divide-y divide-neutral-200">
              {Array.from({ length: 5 }).map((_, i) => (
                <li className="py-2 text-sm" key={i}>
                  Application #{1000 + i} — Status: In Review
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-md border border-neutral-200 p-4">
            <h2 className="text-lg font-medium">Daily Assigned</h2>
            <div className="mt-3 space-y-2">
              {[
                { label: "Mon", v: 50 },
                { label: "Tue", v: 80 },
                { label: "Wed", v: 65 },
                { label: "Thu", v: 70 },
                { label: "Fri", v: 40 },
              ].map((d) => (
                <div key={d.label}>
                  <div className="flex items-center justify-between text-sm text-neutral-600">
                    <span>{d.label}</span>
                    <span>{Math.round(d.v / 10)}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded bg-neutral-200">
                    <div className="h-2 rounded bg-blue-600" style={{ width: `${d.v}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
