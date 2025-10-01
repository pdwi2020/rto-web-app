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
import { API_BASE_URL } from "@/lib/config"

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
        const response = await fetch(`${API_BASE_URL}/applications/`)
        const data = await response.json()
        // Handle pagination response format
        const apps = data.applications || data
        setApplications(apps.slice(0, 10)) // Show only first 10 for demo
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

        <div className="mt-8 rounded-md border border-neutral-200 p-4">
          <h2 className="text-lg font-medium">My Applications</h2>
          <div className="mt-4 space-y-3">
            {loading ? (
              <p className="py-4 text-center text-neutral-600">Loading applications...</p>
            ) : applications.length === 0 ? (
              <p className="py-4 text-center text-neutral-600">No applications found</p>
            ) : (
              applications.map((app) => (
                <a
                  key={app.id}
                  href={`/applications/${app.id}`}
                  className="flex items-center justify-between rounded-md border border-neutral-200 p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div>
                    <p className="font-medium">Application #{app.id}</p>
                    <p className="text-sm text-neutral-600">{app.application_type}</p>
                    <p className="text-xs text-neutral-500">Submitted: {new Date(app.submission_date).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      app.status === "Approved"
                        ? "bg-green-100 text-green-800"
                        : app.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {app.status}
                    </span>
                    {app.is_fraud && (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        ⚠ Fraud Alert
                      </span>
                    )}
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
