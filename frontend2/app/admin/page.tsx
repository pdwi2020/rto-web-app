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
import { getAnalytics, type Analytics, type Application } from "@/lib/api"
import { API_BASE_URL } from "@/lib/config"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

const data = [
  { week: "W1", approvals: 80, avgSLA: 4.7 },
  { week: "W2", approvals: 85, avgSLA: 4.4 },
  { week: "W3", approvals: 83, avgSLA: 4.3 },
  { week: "W4", approvals: 88, avgSLA: 4.1 },
]

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [fraudApplications, setFraudApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsData, appsResponse] = await Promise.all([
          getAnalytics(),
          fetch(`${API_BASE_URL}/applications/?is_fraud=true`)
        ])
        setAnalytics(analyticsData)

        const appsData = await appsResponse.json()
        const apps = appsData.applications || appsData
        setFraudApplications(apps.slice(0, 20)) // Show first 20 fraud cases
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
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

        <div className="mt-8 rounded-md border border-red-200 bg-red-50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-medium text-red-900">Fraud Detection Review</h2>
            <Badge variant="destructive" className="ml-auto">{fraudApplications.length} Cases</Badge>
          </div>
          <div className="space-y-3">
            {fraudApplications.length === 0 ? (
              <p className="py-4 text-center text-neutral-600">No fraud cases detected</p>
            ) : (
              fraudApplications.map((app) => (
                <a
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex items-center justify-between rounded-md border border-red-200 bg-white p-4 hover:bg-red-50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="font-medium">Application #{app.id}</p>
                    </div>
                    <p className="text-sm text-neutral-600">{app.application_type}</p>
                    <p className="text-xs text-neutral-500">Submitted: {new Date(app.submission_date).toLocaleDateString()}</p>
                    {app.owner_name && (
                      <p className="text-xs text-neutral-500">Owner: {app.owner_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Fraud Detected</Badge>
                    <Badge variant={app.status === "Approved" ? "default" : app.status === "Pending" ? "secondary" : "outline"}>
                      {app.status}
                    </Badge>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
