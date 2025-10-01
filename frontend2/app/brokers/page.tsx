"use client"

import { useMemo, useState, useEffect } from "react"
import { Navbar } from "@/components/site/navbar"
import { getBrokers, type Broker as ApiBroker } from "@/lib/api"

type Broker = { id: number; name: string; specialization: string; rating: number; available: boolean }

type SortKey = "name" | "specialization" | "rating"

export default function BrokersPage() {
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [page, setPage] = useState(1)
  const [brokers, setBrokers] = useState<Broker[]>([])
  const [loading, setLoading] = useState(true)
  const pageSize = 6

  useEffect(() => {
    async function fetchBrokers() {
      try {
        const data = await getBrokers()
        const formatted = data.map((b: ApiBroker) => ({
          id: b.id,
          name: b.name,
          specialization: b.specialization,
          rating: Math.round(b.avg_overall * 10) / 10,
          available: b.avg_overall > 0,
        }))
        setBrokers(formatted)
      } catch (error) {
        console.error("Failed to fetch brokers:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBrokers()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return brokers.filter((b) => b.name.toLowerCase().includes(q) || b.specialization.toLowerCase().includes(q))
  }, [query, brokers])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      if (sortKey === "rating") return b.rating - a.rating
      return String(a[sortKey]).localeCompare(String(b[sortKey]))
    })
    return arr
  }, [filtered, sortKey])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize
    return sorted.slice(start, start + pageSize)
  }, [sorted, page])

  function go(n: number) {
    setPage(Math.min(totalPages, Math.max(1, n)))
  }

  if (loading) {
    return (
      <main id="main-content" className="min-h-dvh bg-white text-neutral-900">
        <Navbar />
        <section className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-center text-neutral-600">Loading brokers...</p>
        </section>
      </main>
    )
  }

  return (
    <main id="main-content" className="min-h-dvh bg-white text-neutral-900">
      <Navbar />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold">Find a Broker</h1>
            <p className="mt-1 text-neutral-600">Search, sort, and select the right partner.</p>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label className="w-full sm:w-72">
              <span className="sr-only">Search brokers</span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by name or specialization"
                className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Search brokers"
              />
            </label>

            <label className="shrink-0">
              <span className="sr-only">Sort by</span>
              <select
                value={sortKey}
                onChange={(e) => {
                  setSortKey(e.target.value as SortKey)
                  setPage(1)
                }}
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Sort brokers"
              >
                <option value="name">Name</option>
                <option value="specialization">Specialization</option>
                <option value="rating">Rating</option>
              </select>
            </label>
          </div>
        </div>

        {pageData.length === 0 ? (
          <div className="mt-8 rounded-md border border-dashed border-neutral-300 p-6 text-center">
            <p className="text-sm text-neutral-600">No brokers match your search. Try different keywords.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageData.map((b) => (
              <article
                key={b.id}
                className="rounded-md border border-neutral-200 p-4"
                aria-labelledby={`broker-${b.id}`}
              >
                <h2 id={`broker-${b.id}`} className="text-lg font-medium">
                  {b.name}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">Specialization: {b.specialization}</p>
                <p className="mt-1 text-sm text-neutral-600">Rating: ⭐ {b.rating.toFixed(1)}/5.0</p>
                <p className="mt-1 text-sm">
                  Status:{" "}
                  <span className={b.available ? "text-green-700" : "text-neutral-600"}>
                    {b.available ? "Accepting new applications" : "Temporarily unavailable"}
                  </span>
                </p>
              </article>
            ))}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => go(page - 1)}
            disabled={page === 1}
            className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-60"
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => go(page + 1)}
            disabled={page === totalPages}
            className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-60"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      </section>
    </main>
  )
}
