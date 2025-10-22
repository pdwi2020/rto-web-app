"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/site/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { API_BASE_URL } from "@/lib/config"
import { getBrokers, type Broker } from "@/lib/api"
import { Award, AlertCircle } from "lucide-react"

export default function BrokerLoginPage() {
  const router = useRouter()
  const [licenseNumber, setLicenseNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [demoLicenses, setDemoLicenses] = useState<string[]>(["3972562113", "7495224699", "3105460228"])

  useEffect(() => {
    async function loadDemoLicenses() {
      try {
        const brokers = await getBrokers()
        if (brokers && brokers.length > 0) {
          const uniqueLicenses = Array.from(
            new Set(
              brokers
                .map((broker: Broker) => broker.license_number?.toString().trim())
                .filter((lic): lic is string => Boolean(lic))
            )
          )
          if (uniqueLicenses.length >= 3) {
            setDemoLicenses(uniqueLicenses.slice(0, 3))
          } else if (uniqueLicenses.length > 0) {
            setDemoLicenses(uniqueLicenses)
          }
        }
      } catch (err) {
        console.warn("Unable to fetch broker license numbers for demo:", err)
      }
    }

    loadDemoLicenses()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const normalizedLicense = licenseNumber.trim()
      if (!normalizedLicense) {
        setError("Please enter a license number")
        setLoading(false)
        return
      }

      const response = await fetch(`${API_BASE_URL}/brokers/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_number: normalizedLicense }),
      })

      const data = await response.json()

      if (data.success) {
        // Store broker info in localStorage
        localStorage.setItem("broker", JSON.stringify(data.broker))
        localStorage.setItem("brokerId", data.broker.id.toString())

        // Redirect to dashboard
        router.push("/broker")
      } else {
        setError(data.message || "Invalid license number")
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again.")
      console.error("Login error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-20">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Award className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Broker Login</CardTitle>
            <CardDescription>
              Enter your license number to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="license">License Number</Label>
                <Input
                  id="license"
                  type="text"
                  placeholder="e.g., 3972562113"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                  autoFocus
                />
                <p className="text-xs text-neutral-500">
                  Demo: Use any broker's 10-digit license number
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6 space-y-2 text-center text-sm text-neutral-600">
              <p>For demo purposes, click any license number:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {demoLicenses.map((lic) => (
                  <button
                    key={lic}
                    type="button"
                    onClick={() => setLicenseNumber(lic)}
                    className="rounded-md bg-neutral-100 px-3 py-1 text-xs font-mono hover:bg-neutral-200"
                  >
                    {lic}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
