import Link from "next/link"
import { Navbar } from "@/components/site/navbar"
import { HeroCarousel } from "@/components/site/hero-carousel"
import { AnnouncementsTicker } from "@/components/site/announcements-ticker"
import { QuickLinks } from "@/components/site/quick-links"
import { ServicesGrid } from "@/components/site/services-grid"
import { StatsRow } from "@/components/site/stats-row"
import { PartnersStrip } from "@/components/site/partners-strip"

export default function Page() {
  return (
    <main id="main-content" className="min-h-dvh bg-background text-foreground antialiased">
      <Navbar />
      <HeroCarousel />
      <AnnouncementsTicker />
      <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
        <div className="flex flex-col items-start gap-6 sm:gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-5xl">
              Streamlined Applications for Citizens, Brokers, and Admins
            </h1>
            <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-600 sm:text-lg">
              A modern, accessible portal with dashboards, real-time insights, and an AI assistant to help you get
              things done faster.
            </p>
            <QuickLinks />
            <div className="mt-6 flex items-center gap-3">
              <Link
                href="/apply"
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Start a new application"
              >
                Start a new application
              </Link>
              <Link
                href="/citizen"
                className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="View citizen dashboard"
              >
                Citizen dashboard
              </Link>
            </div>
          </div>
          <div className="w-full max-w-md rounded-lg border border-neutral-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-700">At a glance</span>
              <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Live</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-neutral-200 p-3">
                <p className="text-xs text-neutral-500">Open Applications</p>
                <p className="mt-1 text-2xl font-semibold">128</p>
              </div>
              <div className="rounded-md border border-neutral-200 p-3">
                <p className="text-xs text-neutral-500">Avg. SLA (days)</p>
                <p className="mt-1 text-2xl font-semibold">4.2</p>
              </div>
              <div className="rounded-md border border-neutral-200 p-3">
                <p className="text-xs text-neutral-500">Assigned Brokers</p>
                <p className="mt-1 text-2xl font-semibold">36</p>
              </div>
              <div className="rounded-md border border-neutral-200 p-3">
                <p className="text-xs text-neutral-500">Approval Rate</p>
                <p className="mt-1 text-2xl font-semibold">87%</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ServicesGrid />
      <StatsRow />
      <PartnersStrip />
    </main>
  )
}
