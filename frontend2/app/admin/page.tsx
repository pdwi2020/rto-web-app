"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/site/navbar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { getAnalytics, type Analytics } from "@/lib/api"

const data = [
  { week: "W1", approvals: 80, avgSLA: 4.7 },
  { week: "W2", approvals: 85, avgSLA: 4.4 },
  { week: "W3", approvals: 83, avgSLA: 4.3 },
  { week: "W4", approvals: 88, avgSLA: 4.1 },
]

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await getAnalytics()
        setAnalytics(data)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  const approvalRate = analytics
    ? Math.round((analytics.approved_applications / analytics.total_applications) * 100)
    : 0
  const pendingApps = analytics ? analytics.total_applications - analytics.approved_applications : 0

  if (loading) {
    return (
      <main id="main-content" className="min-h-dvh bg-white text-neutral-900">
        <Navbar />
        <Breadcrumb />
        <section className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-center text-neutral-600">Loading analytics...</p>
        </section>
      </main>
    )
  }

  return (
    <main id="main-content" className="min-h-dvh bg-white text-neutral-900">
      <Navbar />
      <Breadcrumb />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-neutral-600">Monitor KPIs and overall performance.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Total Applications</p>
            <p className="mt-1 text-3xl font-semibold">{analytics?.total_applications || 0}</p>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Approval Rate</p>
            <p className="mt-1 text-3xl font-semibold">{approvalRate}%</p>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Total Citizens</p>
            <p className="mt-1 text-3xl font-semibold">{analytics?.total_citizens || 0}</p>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Total Brokers</p>
            <p className="mt-1 text-3xl font-semibold">{analytics?.total_brokers || 0}</p>
          </div>
        </div>

        <div className="mt-8 rounded-md border border-neutral-200 p-4">
          <h2 className="text-lg font-medium">Approvals & SLA</h2>
          <ChartContainer
            className="mt-3"
            config={{
              approvals: { label: "Approvals", color: "oklch(0.63 0.18 255)" },
              avgSLA: { label: "Avg. SLA (d)", color: "oklch(0.75 0.12 210)" },
            }}
          >
            <ResponsiveContainer>
              <AreaChart
                data={data}
                role="img"
                aria-label="Weekly approvals and average SLA"
                margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
              >
                <CartesianGrid stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="approvals"
                  stroke="var(--color-approvals)"
                  fill="var(--color-approvals)"
                  fillOpacity={0.18}
                />
                <Area
                  type="monotone"
                  dataKey="avgSLA"
                  stroke="var(--color-avgSLA)"
                  fill="var(--color-avgSLA)"
                  fillOpacity={0.14}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </section>
    </main>
  )
}
