"use client"

import type React from "react"
import { useMemo, useState, useEffect } from "react"
import { Navbar } from "@/components/site/navbar"

type FormValues = {
  fullName: string
  email: string
  brokerId: string
  details: string
}

const steps = ["Personal Info", "Broker", "Details", "Review"] as const
type Step = (typeof steps)[number]

export default function NewApplicationPage() {
  const [values, setValues] = useState<FormValues>({ fullName: "", email: "", brokerId: "", details: "" })
  const [errors, setErrors] = useState<Partial<FormValues>>({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [step, setStep] = useState<Step>("Personal Info")
  const [brokers, setBrokers] = useState<Array<{id: number, name: string}>>([])
  const [loadingBrokers, setLoadingBrokers] = useState(true)

  useEffect(() => {
    async function loadBrokers() {
      try {
        const { getBrokers } = await import('@/lib/api')
        const data = await getBrokers()
        setBrokers(data.map(b => ({ id: b.id, name: b.name })))
      } catch (error) {
        console.error('Failed to load brokers:', error)
      } finally {
        setLoadingBrokers(false)
      }
    }
    loadBrokers()
  }, [])

  function validate(v: FormValues) {
    const e: Partial<FormValues> = {}
    if (!v.fullName || v.fullName.trim().length < 2) e.fullName = "Please enter your full name"
    if (!v.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "Please enter a valid email"
    if (!v.brokerId) e.brokerId = "Please select a broker"
    if (!v.details || v.details.trim().length < 10) e.details = "Please provide more details"
    return e
  }

  const canContinue = useMemo(() => {
    const e = validate(values)
    if (step === "Personal Info") return !e.fullName && !e.email
    if (step === "Broker") return !e.brokerId
    if (step === "Details") return !e.details
    return true
  }, [values, step])

  function next() {
    const idx = steps.indexOf(step)
    if (idx < steps.length - 1) setStep(steps[idx + 1])
  }
  function prev() {
    const idx = steps.indexOf(step)
    if (idx > 0) setStep(steps[idx - 1])
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    const eMap = validate(values)
    setErrors(eMap)
    if (Object.keys(eMap).length > 0) {
      setStep(
        eMap.fullName || eMap.email ? "Personal Info" : eMap.brokerId ? "Broker" : eMap.details ? "Details" : "Review",
      )
      return
    }

    setSubmitting(true)
    try {
      const { createApplication, createCitizen } = await import('@/lib/api')

      // Create citizen first
      const citizen = await createCitizen({
        name: values.fullName,
        email: values.email,
        phone: "0000000000", // Placeholder
        aadhaar: String(Math.floor(Math.random() * 1000000000000)),
        address: "Placeholder address"
      })

      // Create application
      const application = await createApplication({
        citizen_id: citizen.id,
        broker_id: parseInt(values.brokerId),
        application_type: "New Registration",
        documents: values.details
      })

      if (application.is_fraud) {
        setMessage("⚠️ Application flagged for review. Our team will contact you soon.")
      } else {
        setMessage("✅ Application submitted successfully!")
      }

      setValues({ fullName: "", email: "", brokerId: "", details: "" })
      setStep("Personal Info")
    } catch (error) {
      console.error("Submission error:", error)
      setMessage("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main id="main-content" className="min-h-dvh bg-white text-neutral-900">
      <Navbar />
      <section className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold">New Application</h1>
        <p className="mt-1 text-neutral-600">Provide details below to start your application.</p>

        <ol className="mt-4 grid grid-cols-4 gap-2">
          {steps.map((s, i) => {
            const active = steps.indexOf(step) >= i
            return (
              <li key={s} className="flex flex-col items-start">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                    active ? "bg-blue-600 text-white" : "bg-neutral-200 text-neutral-700"
                  }`}
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <span className="mt-1 text-xs">{s}</span>
              </li>
            )
          })}
        </ol>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4" aria-live="polite">
          {step === "Personal Info" && (
            <>
              {/* Full Name */}
              <label className="grid gap-1">
                <span className="text-sm font-medium">Full name</span>
                <input
                  className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jane Doe"
                  value={values.fullName}
                  onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))}
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "fullName-error" : undefined}
                />
                {errors.fullName && (
                  <span id="fullName-error" className="text-sm text-red-600">
                    {errors.fullName}
                  </span>
                )}
              </label>

              {/* Email */}
              <label className="grid gap-1">
                <span className="text-sm font-medium">Email</span>
                <input
                  className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="jane@example.com"
                  value={values.email}
                  onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {errors.email && (
                  <span id="email-error" className="text-sm text-red-600">
                    {errors.email}
                  </span>
                )}
              </label>
            </>
          )}

          {step === "Broker" && (
            <label className="grid gap-1">
              <span className="text-sm font-medium">Broker</span>
              <select
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={values.brokerId}
                onChange={(e) => setValues((v) => ({ ...v, brokerId: e.target.value }))}
                aria-invalid={!!errors.brokerId}
                aria-describedby={errors.brokerId ? "broker-error" : undefined}
                disabled={loadingBrokers}
              >
                <option value="" disabled>
                  {loadingBrokers ? "Loading brokers..." : "Select a broker"}
                </option>
                {brokers.map((broker) => (
                  <option key={broker.id} value={broker.id}>
                    {broker.name}
                  </option>
                ))}
              </select>
              {errors.brokerId && (
                <span id="broker-error" className="text-sm text-red-600">
                  {errors.brokerId}
                </span>
              )}
            </label>
          )}

          {step === "Details" && (
            <label className="grid gap-1">
              <span className="text-sm font-medium">Details</span>
              <textarea
                rows={5}
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tell us about your case..."
                value={values.details}
                onChange={(e) => setValues((v) => ({ ...v, details: e.target.value }))}
                aria-invalid={!!errors.details}
                aria-describedby={errors.details ? "details-error" : undefined}
              />
              {errors.details && (
                <span id="details-error" className="text-sm text-red-600">
                  {errors.details}
                </span>
              )}
            </label>
          )}

          {step === "Review" && (
            <div className="rounded-md border border-neutral-200 p-4">
              <h2 className="text-lg font-medium">Review & Confirm</h2>
              <dl className="mt-3 grid gap-2">
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-neutral-600">Full name</dt>
                  <dd className="font-medium">{values.fullName || "—"}</dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-neutral-600">Email</dt>
                  <dd className="font-medium">{values.email || "—"}</dd>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <dt className="text-neutral-600">Broker</dt>
                  <dd className="font-medium">
                    {values.brokerId
                      ? brokers.find(b => b.id === parseInt(values.brokerId))?.name || "—"
                      : "—"}
                  </dd>
                </div>
                <div className="text-sm">
                  <dt className="text-neutral-600">Details</dt>
                  <dd className="mt-1 whitespace-pre-wrap font-medium">{values.details || "—"}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={steps.indexOf(step) === 0}
                className="inline-flex items-center justify-center rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60"
              >
                Back
              </button>
              {step !== "Review" ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={!canContinue}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              )}
            </div>
            {message && <p className="text-sm text-neutral-700">{message}</p>}
          </div>
        </form>
      </section>
    </main>
  )
}
