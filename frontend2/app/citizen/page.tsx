"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/site/navbar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getApplications, type Application } from "@/lib/api"

const steps = [
  { label: "Submitted", done: true },
  { label: "In Review", done: true },
  { label: "Requested Docs", done: true },
  { label: "Final Review", done: false },
  { label: "Decision", done: false },
]

export default function CitizenDashboard() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchApplications() {
      try {
        const data = await getApplications()
        setApplications(data.slice(0, 10)) // Show only first 10 for demo
      } catch (error) {
        console.error("Failed to fetch applications:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

  const activeApps = applications.filter(a => a.status === "Pending").length
  const approvedApps = applications.filter(a => a.status === "Approved").length

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
              <BreadcrumbPage>Citizen</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="text-2xl font-semibold">Citizen Dashboard</h1>
        <p className="mt-1 text-neutral-600">Track your application progress and required actions.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Active Applications</p>
            <p className="mt-1 text-3xl font-semibold">{loading ? "..." : activeApps}</p>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Approved</p>
            <p className="mt-1 text-3xl font-semibold">{loading ? "..." : approvedApps}</p>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Total</p>
            <p className="mt-1 text-3xl font-semibold">{loading ? "..." : applications.length}</p>
          </div>
        </div>

        <div className="mt-8 rounded-md border border-neutral-200 p-4">
          <h2 className="text-lg font-medium">Progress Over Time</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-5">
            {steps.map((s, i) => (
              <li key={i} className="flex flex-col items-start">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                    s.done ? "bg-blue-600 text-white" : "bg-neutral-200 text-neutral-700"
                  }`}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="mt-2 text-sm">{s.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  )
}
