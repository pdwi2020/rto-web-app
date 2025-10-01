"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/site/navbar"
import { API_BASE_URL } from "@/lib/config"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { type Application, type Broker } from "@/lib/api"
import { Calendar, User, FileText, AlertTriangle, Car, Shield, Droplet, Gauge, Award } from "lucide-react"

export default function ApplicationDetailPage() {
  const params = useParams()
  const applicationId = params.id as string

  const [application, setApplication] = useState<Application | null>(null)
  const [broker, setBroker] = useState<Broker | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadApplicationData()
  }, [applicationId])

  const loadApplicationData = async () => {
    try {
      setLoading(true)
      // Fetch application and broker data
      const appResponse = await fetch(`${API_BASE_URL}/applications/${applicationId}`)
      const appData = await appResponse.json()
      setApplication(appData)

      if (appData.broker_id) {
        const brokerResponse = await fetch(`${API_BASE_URL}/brokers/${appData.broker_id}`)
        const brokerData = await brokerResponse.json()
        setBroker(brokerData)
      }
    } catch (error) {
      console.error("Failed to load application:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-white text-neutral-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-neutral-600">Loading application details...</p>
        </div>
      </main>
    )
  }

  if (!application) {
    return (
      <main className="min-h-dvh bg-white text-neutral-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-neutral-600">Application not found</p>
        </div>
      </main>
    )
  }

  return (
    <main id="main-content" className="min-h-dvh bg-white text-neutral-900">
      <Navbar />
      <section className="mx-auto max-w-7xl px-4 py-10">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/applications">Applications</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>#{application.id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">Application #{application.id}</h1>
            <p className="mt-1 text-neutral-600">{application.application_type}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={application.status === "Approved" ? "default" : application.status === "Pending" ? "secondary" : "destructive"}>
              {application.status}
            </Badge>
            {application.is_fraud && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-4 w-4" />
                Fraud Detected
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Application Details</TabsTrigger>
            <TabsTrigger value="vehicle">Vehicle Information</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="broker">Broker Info</TabsTrigger>
          </TabsList>

          {/* Application Details Tab */}
          <TabsContent value="details" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Owner Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Name</p>
                    <p className="text-lg">{application.owner_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Son/Daughter of</p>
                    <p>{application.owner_so || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Address</p>
                    <p className="text-sm text-neutral-600">{application.owner_address || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Ownership Type</p>
                    <Badge variant="outline">{application.ownership || "N/A"}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Submission Date</p>
                    <p>{new Date(application.submission_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Registration Date</p>
                    <p>{application.date_of_registration ? new Date(application.date_of_registration).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Registration Valid Until</p>
                    <p>{application.registration_valid_upto ? new Date(application.registration_valid_upto).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Tax Valid Until</p>
                    <p>{application.tax_valid_upto ? new Date(application.tax_valid_upto).toLocaleDateString() : "N/A"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Vehicle Information Tab */}
          <TabsContent value="vehicle" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Vehicle Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Registration Number</p>
                      <p className="text-lg font-semibold">{application.registration_number || "Pending"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Vehicle Class</p>
                      <p>{application.vehicle_class || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Chassis Number</p>
                      <p className="font-mono text-sm">{application.chassis_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Engine Number</p>
                      <p className="font-mono text-sm">{application.engine_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Maker</p>
                      <p>{application.maker_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Model</p>
                      <p>{application.model_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Color</p>
                      <p>{application.vehicle_color || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Seating Capacity</p>
                      <p>{application.seat_capacity || "N/A"} persons</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Cubic Capacity</p>
                    <p>{application.cubic_capacity || "N/A"} cc</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Fuel Type</p>
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-blue-600" />
                      <p>{application.fuel_type || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Emission Norm</p>
                    <p>{application.emission_norm || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Fitness Status</p>
                    <Badge variant={application.fitness_status === "Fit" ? "default" : "secondary"}>
                      {application.fitness_status || "N/A"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Insurance & Compliance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Insurance Details</p>
                      <p className="text-sm">{application.insurance_details || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Insurance Valid Until</p>
                      <p>{application.insurance_valid_upto ? new Date(application.insurance_valid_upto).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">PUCC Number</p>
                      <p className="font-mono text-sm">{application.pucc_no || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">PUCC Valid Until</p>
                      <p>{application.pucc_valid_upto ? new Date(application.pucc_valid_upto).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Registering Authority</p>
                      <p className="text-sm">{application.registering_authority || "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Submitted Documents
                </CardTitle>
                <CardDescription>Documents submitted with this application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-neutral-200 p-4">
                  <p className="text-sm text-neutral-600">{application.documents || "No documents listed"}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Broker Info Tab */}
          <TabsContent value="broker" className="mt-6">
            {broker ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Assigned Broker
                  </CardTitle>
                  <CardDescription>Broker handling this application</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold">{broker.name}</h3>
                      <p className="text-sm text-neutral-600">License: {broker.license_number}</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-neutral-700">Phone</p>
                        <p>{broker.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-700">Email</p>
                        <p>{broker.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-700">Specialization</p>
                        <Badge variant="secondary">{broker.specialization}</Badge>
                      </div>
                    </div>

                    {/* Broker Ratings */}
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-neutral-700">Performance Ratings</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {[
                          { label: "Overall", value: broker.avg_overall },
                          { label: "Punctuality", value: broker.avg_punctuality },
                          { label: "Quality", value: broker.avg_quality },
                          { label: "Compliance", value: broker.avg_compliance },
                          { label: "Communication", value: broker.avg_communication },
                        ].map((rating) => (
                          <div key={rating.label} className="flex items-center justify-between rounded-md bg-neutral-50 p-2">
                            <span className="text-sm">{rating.label}</span>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 rounded-full bg-neutral-200">
                                <div
                                  className="h-2 rounded-full bg-blue-600"
                                  style={{ width: `${((rating.value || 0) / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold">{rating.value?.toFixed(1) || "N/A"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-neutral-600">No broker assigned to this application</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}
