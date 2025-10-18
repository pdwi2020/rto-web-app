"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { type Application, type Broker, approveApplication, rejectApplication, comprehensiveFraudCheck, getRatingExplanation, estimateFeeAdvanced } from "@/lib/api"
import { Calendar, User, FileText, AlertTriangle, Car, Shield, Droplet, Gauge, Award, CheckCircle, XCircle, CreditCard, MapPin, Building2, FileCheck, Phone, Mail, Star, Brain, TrendingUp, DollarSign, Activity } from "lucide-react"

// Tamil Nadu RTO Office Mapping
const TN_RTO_OFFICES: Record<string, string> = {
  "Chennai": "RTO Chennai Central (TN01)",
  "Coimbatore": "RTO Coimbatore (TN37)",
  "Madurai": "RTO Madurai (TN58)",
  "Tiruchirappalli": "RTO Tiruchirappalli (TN48)",
  "Salem": "RTO Salem (TN29)",
  "Tirunelveli": "RTO Tirunelveli (TN72)",
  "Vellore": "RTO Vellore (TN23)",
  "Erode": "RTO Erode (TN33)",
  "Thanjavur": "RTO Thanjavur (TN50)",
  "Dindigul": "RTO Dindigul (TN59)",
  "Mehsana": "RTO Chennai Central (TN01)", // Fallback
}

export default function ApplicationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.id as string

  const [application, setApplication] = useState<Application | null>(null)
  const [broker, setBroker] = useState<Broker | null>(null)
  const [loading, setLoading] = useState(true)
  const [brokerId, setBrokerId] = useState<number | null>(null)

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")
  const [processing, setProcessing] = useState(false)

  // AI Analysis state
  const [fraudAnalysis, setFraudAnalysis] = useState<any>(null)
  const [ratingAnalysis, setRatingAnalysis] = useState<any>(null)
  const [feeAnalysis, setFeeAnalysis] = useState<any>(null)
  const [loadingAI, setLoadingAI] = useState(false)

  useEffect(() => {
    // Get broker ID from localStorage if logged in
    const storedBrokerId = localStorage.getItem("brokerId")
    if (storedBrokerId) {
      setBrokerId(parseInt(storedBrokerId))
    }

    loadApplicationData()
  }, [applicationId])

  const loadApplicationData = async () => {
    try {
      setLoading(true)
      // Fetch application and broker data
      const appResponse = await fetch(`${API_BASE_URL}/applications/${applicationId}`)
      const appData = await appResponse.json()
      setApplication(appData)

      if (appData.broker?.id) {
        const brokerResponse = await fetch(`${API_BASE_URL}/brokers/${appData.broker.id}`)
        const brokerData = await brokerResponse.json()
        setBroker(brokerData)
      }
    } catch (error) {
      console.error("Failed to load application:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadAIAnalysis = async () => {
    if (!application || !broker) return

    setLoadingAI(true)
    try {
      // Run all AI analyses in parallel
      const [fraud, rating, fee] = await Promise.all([
        comprehensiveFraudCheck({
          application_id: application.id,
          broker_id: broker.id,
          actual_fee: 0, // Could be fetched from payment data if available
          expected_fee: 0,
          actual_duration: 0,
          expected_duration: 5.0
        }).catch(() => null),
        getRatingExplanation(broker.id).catch(() => null),
        estimateFeeAdvanced({
          service_type: application.application_type,
          vehicle_class: application.vehicle_details?.vehicle_class || 'Four Wheeler (Car/SUV)',
          use_ml: true
        }).catch(() => null)
      ])

      setFraudAnalysis(fraud)
      setRatingAnalysis(rating)
      setFeeAnalysis(fee)
    } catch (error) {
      console.error('Failed to load AI analysis:', error)
    } finally {
      setLoadingAI(false)
    }
  }

  const handleApprove = async () => {
    if (!brokerId) return

    setProcessing(true)
    try {
      await approveApplication(parseInt(applicationId), brokerId)
      // Reload to show updated status
      await loadApplicationData()
      alert("Application approved successfully!")
    } catch (error) {
      console.error("Failed to approve:", error)
      alert("Failed to approve application")
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectSubmit = async () => {
    if (!brokerId || !rejectReason.trim()) return

    setProcessing(true)
    try {
      await rejectApplication(parseInt(applicationId), brokerId, rejectReason)
      setShowRejectModal(false)
      setRejectReason("")
      // Reload to show updated status
      await loadApplicationData()
      alert("Application rejected")
    } catch (error) {
      console.error("Failed to reject:", error)
      alert("Failed to reject application")
    } finally {
      setProcessing(false)
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
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Application #{application.id}</h1>
            <p className="mt-1 text-neutral-600">{application.application_type}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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

        {/* Approval Actions - Only show for brokers on Pending applications */}
        {brokerId && application.status === "Pending" && (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 sm:flex-row">
            <Button
              onClick={handleApprove}
              disabled={processing}
              className="w-full gap-2 sm:w-auto"
            >
              <CheckCircle className="h-4 w-4" />
              {processing ? "Processing..." : "Approve Application"}
            </Button>
            <Button
              onClick={() => setShowRejectModal(true)}
              disabled={processing}
              variant="destructive"
              className="w-full gap-2 sm:w-auto"
            >
              <XCircle className="h-4 w-4" />
              Reject Application
            </Button>
          </div>
        )}

        {/* Reject Modal */}
        <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Application</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this application.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                className="mt-2"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRejectSubmit}
                disabled={processing || !rejectReason.trim()}
                variant="destructive"
              >
                {processing ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="details" className="whitespace-nowrap">Application Details</TabsTrigger>
            <TabsTrigger value="vehicle" className="whitespace-nowrap">Vehicle Information</TabsTrigger>
            <TabsTrigger value="documents" className="whitespace-nowrap">Documents</TabsTrigger>
            <TabsTrigger value="broker" className="whitespace-nowrap">Broker Info</TabsTrigger>
            <TabsTrigger
              value="ai-analysis"
              className="whitespace-nowrap gap-2"
              onClick={loadAIAnalysis}
            >
              <Brain className="h-4 w-4" />
              AI Analysis
            </TabsTrigger>
          </TabsList>

          {/* Application Details Tab */}
          <TabsContent value="details" className="mt-6">
            <div className="grid gap-6 md:grid-cols-3">
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
                    <p className="text-lg">{application.vehicle_details?.owner_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Son/Daughter of</p>
                    <p>{application.vehicle_details?.owner_so || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Address</p>
                    <div className="mt-1 flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-neutral-600">{application.vehicle_details?.owner_address || "N/A"}</p>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">Tamil Nadu, India</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Phone</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-neutral-400" />
                        <p className="break-words">{application.citizen?.phone || "N/A"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Email</p>
                      <div className="flex items-center gap-1 text-sm overflow-hidden">
                        <Mail className="h-3 w-3 flex-shrink-0 text-neutral-400" />
                        <p className="truncate">{application.citizen?.email || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Ownership Type</p>
                    <Badge variant="outline">{application.vehicle_details?.ownership || "N/A"}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline & Validity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Submission Date</p>
                    <p>{new Date(application.submission_date).toLocaleDateString('en-IN')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Registration Date</p>
                    <p>{application.vehicle_details?.date_of_registration ? new Date(application.vehicle_details.date_of_registration).toLocaleDateString('en-IN') : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Registration Valid Until</p>
                    <p>{application.vehicle_details?.registration_valid_upto ? new Date(application.vehicle_details.registration_valid_upto).toLocaleDateString('en-IN') : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Tax Valid Until</p>
                    <p>{application.vehicle_details?.tax_valid_upto ? new Date(application.vehicle_details.tax_valid_upto).toLocaleDateString('en-IN') : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Insurance Valid Until</p>
                    <p>{application.vehicle_details?.insurance_valid_upto ? new Date(application.vehicle_details.insurance_valid_upto).toLocaleDateString('en-IN') : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">PUCC Valid Until</p>
                    <p>{application.vehicle_details?.pucc_valid_upto ? new Date(application.vehicle_details.pucc_valid_upto).toLocaleDateString('en-IN') : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Fitness Status</p>
                    <Badge variant={application.vehicle_details?.fitness_status === "Fit" ? "default" : "secondary"}>
                      {application.vehicle_details?.fitness_status || "N/A"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Assigned Broker Card */}
              {broker && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Assigned Broker
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Name</p>
                      <p className="text-lg font-semibold">{broker.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">License Number</p>
                      <p className="font-mono text-sm">{broker.license_number}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm font-medium text-neutral-700">Phone</p>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 flex-shrink-0 text-neutral-400" />
                          <p className="break-words">{broker.phone}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-700">Email</p>
                        <div className="flex items-center gap-1 text-sm overflow-hidden">
                          <Mail className="h-3 w-3 flex-shrink-0 text-neutral-400" />
                          <p className="truncate">{broker.email}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Specialization</p>
                      <Badge variant="secondary">{broker.specialization}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Overall Rating</p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(broker.avg_overall || 0) ? "fill-yellow-400 text-yellow-400" : "text-neutral-300"}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-semibold">{broker.avg_overall?.toFixed(1) || "N/A"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
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
                      <div className="mt-1">
                        <p className="text-lg font-bold font-mono tracking-wider">
                          {application.vehicle_details?.registration_number || "TN-XX-XX-XXXX"}
                        </p>
                        {application.vehicle_details?.registration_number && application.vehicle_details.registration_number.startsWith("TN") && (
                          <p className="text-xs text-neutral-500 mt-0.5">Tamil Nadu Registration</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Vehicle Class</p>
                      <p>{application.vehicle_details?.vehicle_class || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Vehicle Description</p>
                      <p>{application.vehicle_details?.vehicle_description || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Seating Capacity</p>
                      <p>{application.vehicle_details?.seat_capacity || "N/A"} persons</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Chassis Number</p>
                      <p className="font-mono text-sm">{application.vehicle_details?.chassis_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Engine Number</p>
                      <p className="font-mono text-sm">{application.vehicle_details?.engine_number || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Maker</p>
                      <p>{application.vehicle_details?.maker_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Model</p>
                      <p>{application.vehicle_details?.model_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Color</p>
                      <p>{application.vehicle_details?.vehicle_color || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Registration Date</p>
                      <p>{application.vehicle_details?.date_of_registration ? new Date(application.vehicle_details.date_of_registration).toLocaleDateString('en-IN') : "N/A"}</p>
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
                    <p>{application.vehicle_details?.cubic_capacity || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Fuel Type</p>
                    <div className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-blue-600" />
                      <p>{application.vehicle_details?.fuel_type || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Emission Norm</p>
                    <p>{application.vehicle_details?.emission_norm || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Fitness Status</p>
                    <Badge variant={application.vehicle_details?.fitness_status === "Fit" ? "default" : "secondary"}>
                      {application.vehicle_details?.fitness_status || "N/A"}
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
                      <p className="text-sm">{application.vehicle_details?.insurance_details || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">Insurance Valid Until</p>
                      <p>{application.vehicle_details?.insurance_valid_upto ? new Date(application.vehicle_details.insurance_valid_upto).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">PUCC Number</p>
                      <p className="font-mono text-sm">{application.vehicle_details?.pucc_no || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-700">PUCC Valid Until</p>
                      <p>{application.vehicle_details?.pucc_valid_upto ? new Date(application.vehicle_details.pucc_valid_upto).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-neutral-700">Registering Authority</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-semibold">
                          {application.vehicle_details?.registering_authority ?
                            (TN_RTO_OFFICES[application.vehicle_details.registering_authority] || `RTO ${application.vehicle_details.registering_authority}`)
                            : "N/A"}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500">Tamil Nadu Transport Department</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Processing Broker Card */}
              {broker && (
                <Card className="md:col-span-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Processing Agent
                    </CardTitle>
                    <CardDescription>Broker handling this vehicle registration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                      <div>
                        <p className="text-sm font-medium text-neutral-700">Agent Name</p>
                        <p className="font-semibold">{broker.name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-700">License Number</p>
                        <p className="font-mono text-sm">{broker.license_number}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-700">Contact</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 flex-shrink-0 text-neutral-400" />
                            <p className="break-words">{broker.phone}</p>
                          </div>
                          <div className="flex items-center gap-1 text-sm overflow-hidden">
                            <Mail className="h-3 w-3 flex-shrink-0 text-neutral-400" />
                            <p className="truncate">{broker.email}</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-700">Specialization</p>
                        <Badge variant="secondary" className="mt-1">{broker.specialization}</Badge>
                        <div className="mt-2 flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">{broker.avg_overall?.toFixed(1) || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Aadhaar Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Aadhaar Card
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="aspect-video rounded-md border-2 border-dashed border-neutral-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 flex items-center justify-center">
                      <div className="text-center">
                        <CreditCard className="mx-auto h-12 w-12 text-blue-400 mb-2" />
                        <p className="text-xs text-neutral-600">Aadhaar Card Preview</p>
                        <p className="text-xs font-mono mt-1">XXXX XXXX 1234</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">Verified</span>
                      <Badge variant="default" className="h-5 text-xs">✓ Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PAN Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    PAN Card
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="aspect-video rounded-md border-2 border-dashed border-neutral-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 flex items-center justify-center">
                      <div className="text-center">
                        <CreditCard className="mx-auto h-12 w-12 text-purple-400 mb-2" />
                        <p className="text-xs text-neutral-600">PAN Card Preview</p>
                        <p className="text-xs font-mono mt-1">ABCDE1234F</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">Verified</span>
                      <Badge variant="default" className="h-5 text-xs">✓ Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* RC Book */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5 text-green-600" />
                    RC Book
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="aspect-video rounded-md border-2 border-dashed border-neutral-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4 flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-green-400 mb-2" />
                        <p className="text-xs text-neutral-600">Registration Certificate</p>
                        <p className="text-xs font-mono mt-1">{application.vehicle_details?.registration_number || "TN01AB1234"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">Status</span>
                      <Badge variant="secondary" className="h-5 text-xs">Original</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Insurance Policy */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-5 w-5 text-orange-600" />
                    Insurance Policy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="aspect-video rounded-md border-2 border-dashed border-neutral-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4 flex items-center justify-center">
                      <div className="text-center">
                        <Shield className="mx-auto h-12 w-12 text-orange-400 mb-2" />
                        <p className="text-xs text-neutral-600">Insurance Certificate</p>
                        <p className="text-xs mt-1">{application.vehicle_details?.insurance_details || "Policy Details"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">Valid Until</span>
                      <span className="font-medium">{application.vehicle_details?.insurance_valid_upto ? new Date(application.vehicle_details.insurance_valid_upto).toLocaleDateString('en-IN') : "N/A"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PUCC Certificate */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileCheck className="h-5 w-5 text-teal-600" />
                    PUCC Certificate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="aspect-video rounded-md border-2 border-dashed border-neutral-200 bg-gradient-to-br from-teal-50 to-cyan-50 p-4 flex items-center justify-center">
                      <div className="text-center">
                        <FileCheck className="mx-auto h-12 w-12 text-teal-400 mb-2" />
                        <p className="text-xs text-neutral-600">Pollution Certificate</p>
                        <p className="text-xs font-mono mt-1">{application.vehicle_details?.pucc_no || "PUCC123456"}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">Valid Until</span>
                      <span className="font-medium">{application.vehicle_details?.pucc_valid_upto ? new Date(application.vehicle_details.pucc_valid_upto).toLocaleDateString('en-IN') : "N/A"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Proof */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5 text-red-600" />
                    Address Proof
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="aspect-video rounded-md border-2 border-dashed border-neutral-200 bg-gradient-to-br from-red-50 to-rose-50 p-4 flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="mx-auto h-12 w-12 text-red-400 mb-2" />
                        <p className="text-xs text-neutral-600">Residence Proof</p>
                        <p className="text-xs mt-1">Electricity Bill / Rental Agreement</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-600">Verified</span>
                      <Badge variant="default" className="h-5 text-xs">✓ Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Document Notes */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-base">Document Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-neutral-600">
                  All documents have been verified and are in compliance with Tamil Nadu RTO regulations.
                  Original documents must be presented at the RTO office for final verification.
                </p>
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

          {/* AI Analysis Tab */}
          <TabsContent value="ai-analysis" className="mt-6">
            {loadingAI ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="mx-auto h-12 w-12 animate-pulse text-blue-600 mb-4" />
                  <p className="text-neutral-600">Loading AI Analysis...</p>
                  <p className="text-sm text-neutral-500 mt-2">Running TG-CMAE, TAS-DyRa, and XFDRC algorithms</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* TG-CMAE Fraud Detection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      TG-CMAE Fraud Detection Analysis
                    </CardTitle>
                    <CardDescription>Multi-pattern temporal fraud detection using cross-modal autoencoder</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {fraudAnalysis ? (
                      <div className="space-y-4">
                        {/* Overall Fraud Score */}
                        <div className="rounded-lg border-2 p-4" style={{
                          borderColor: fraudAnalysis.fraud_analysis?.is_fraudulent ? '#ef4444' : '#22c55e',
                          backgroundColor: fraudAnalysis.fraud_analysis?.is_fraudulent ? '#fef2f2' : '#f0fdf4'
                        }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-neutral-700">Fraud Status</p>
                              <p className="text-2xl font-bold" style={{
                                color: fraudAnalysis.fraud_analysis?.is_fraudulent ? '#ef4444' : '#22c55e'
                              }}>
                                {fraudAnalysis.fraud_analysis?.is_fraudulent ? 'FRAUDULENT' : 'LEGITIMATE'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-neutral-700">Anomaly Score</p>
                              <p className="text-2xl font-bold">
                                {(fraudAnalysis.fraud_analysis?.anomaly_score * 100 || 0).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="h-3 w-full rounded-full bg-neutral-200">
                              <div
                                className="h-3 rounded-full transition-all"
                                style={{
                                  width: `${(fraudAnalysis.fraud_analysis?.anomaly_score || 0) * 100}%`,
                                  backgroundColor: fraudAnalysis.fraud_analysis?.is_fraudulent ? '#ef4444' : '#22c55e'
                                }}
                              />
                            </div>
                            <p className="mt-2 text-xs text-neutral-600">
                              Fraud Level: <span className="font-semibold">{fraudAnalysis.fraud_analysis?.fraud_level || 'low'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Fraud Indicators */}
                        {fraudAnalysis.fraud_analysis?.fraud_indicators && fraudAnalysis.fraud_analysis.fraud_indicators.length > 0 && (
                          <div>
                            <p className="mb-3 text-sm font-medium text-neutral-700">Detected Fraud Patterns</p>
                            <div className="grid gap-3 md:grid-cols-2">
                              {fraudAnalysis.fraud_analysis.fraud_indicators.map((indicator: any, index: number) => (
                                <div key={index} className="rounded-md border border-red-200 bg-red-50 p-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="h-4 w-4 text-red-600" />
                                      <span className="font-medium capitalize">{indicator.type?.replace(/_/g, ' ')}</span>
                                    </div>
                                    <Badge variant="destructive" className="text-xs">
                                      {(indicator.confidence * 100).toFixed(0)}%
                                    </Badge>
                                  </div>
                                  {indicator.details && (
                                    <p className="mt-1 text-xs text-neutral-600">{indicator.details}</p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recommendation */}
                        {fraudAnalysis.recommendation && (
                          <div className={`rounded-md border p-3 ${
                            fraudAnalysis.recommendation.action === 'escalate'
                              ? 'border-red-200 bg-red-50'
                              : fraudAnalysis.recommendation.action === 'review'
                              ? 'border-yellow-200 bg-yellow-50'
                              : 'border-green-200 bg-green-50'
                          }`}>
                            <p className="text-sm font-medium">Recommended Action: <span className="uppercase">{fraudAnalysis.recommendation.action}</span></p>
                            <p className="mt-1 text-sm text-neutral-700">{fraudAnalysis.recommendation.message}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">Click tab to load fraud analysis</p>
                    )}
                  </CardContent>
                </Card>

                {/* TAS-DyRa Rating Explanation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      TAS-DyRa Dynamic Rating Analysis
                    </CardTitle>
                    <CardDescription>Temporal anomaly-scored dynamic rating with explainability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ratingAnalysis ? (
                      <div className="space-y-4">
                        {/* Current Rating */}
                        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-neutral-700">Current Rating</p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-5 w-5 ${
                                        i < Math.floor(ratingAnalysis.current_rating || broker?.avg_overall || 0)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-neutral-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-2xl font-bold">{(ratingAnalysis.current_rating || broker?.avg_overall || 0).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-neutral-700">Category</p>
                              <Badge variant="default" className="mt-1">
                                {ratingAnalysis.category || 'Silver'}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Rating Factors */}
                        {ratingAnalysis.explanation && (
                          <div>
                            <p className="mb-3 text-sm font-medium text-neutral-700">Rating Components</p>
                            <div className="space-y-2">
                              {ratingAnalysis.explanation.factors?.map((factor: any, index: number) => (
                                <div key={index} className="flex items-center justify-between rounded-md bg-neutral-50 p-3">
                                  <span className="text-sm font-medium">{factor.name}</span>
                                  <div className="flex items-center gap-3">
                                    <div className="h-2 w-32 rounded-full bg-neutral-200">
                                      <div
                                        className="h-2 rounded-full bg-blue-600"
                                        style={{ width: `${((factor.score || 0) / 5) * 100}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-semibold w-12 text-right">{factor.score?.toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Summary */}
                        {ratingAnalysis.explanation?.summary && (
                          <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                            <p className="text-sm text-neutral-700">{ratingAnalysis.explanation.summary}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">Click tab to load rating analysis</p>
                    )}
                  </CardContent>
                </Card>

                {/* XFDRC Fee Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      XFDRC Fee Estimation Analysis
                    </CardTitle>
                    <CardDescription>Explainable fee prediction with XGBoost and SHAP</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {feeAnalysis ? (
                      <div className="space-y-4">
                        {/* Total Fee */}
                        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-neutral-700">Estimated Total Fee</p>
                              <p className="text-3xl font-bold text-green-700">
                                ₹{feeAnalysis.predicted_total?.toLocaleString('en-IN') || feeAnalysis.breakdown?.total?.toLocaleString('en-IN')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-neutral-700">Confidence</p>
                              <p className="text-2xl font-bold text-green-700">
                                {((feeAnalysis.confidence || 0.9) * 100).toFixed(0)}%
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-neutral-600">
                            Method: <span className="font-semibold">{feeAnalysis.method || 'rule_based'}</span>
                          </p>
                        </div>

                        {/* Fee Breakdown */}
                        {feeAnalysis.breakdown && (
                          <div>
                            <p className="mb-3 text-sm font-medium text-neutral-700">Fee Breakdown</p>
                            <div className="space-y-2">
                              {[
                                { label: 'Base Fee', amount: feeAnalysis.breakdown.base_fee },
                                { label: 'Broker Commission', amount: feeAnalysis.breakdown.broker_commission },
                                { label: 'Service Fee', amount: feeAnalysis.breakdown.service_fee },
                                { label: 'GST (18%)', amount: feeAnalysis.breakdown.tax_gst }
                              ].map((item, index) => (
                                <div key={index} className="flex items-center justify-between rounded-md bg-neutral-50 p-3">
                                  <span className="text-sm font-medium">{item.label}</span>
                                  <span className="text-sm font-semibold">₹{item.amount?.toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between rounded-md border-2 border-green-600 bg-green-100 p-3">
                                <span className="text-sm font-bold">Total Amount</span>
                                <span className="text-lg font-bold text-green-700">
                                  ₹{feeAnalysis.breakdown.total?.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ML Explanation */}
                        {feeAnalysis.explanation && (
                          <div className="rounded-md border border-green-200 bg-green-50 p-3">
                            <p className="text-xs font-semibold text-neutral-700 mb-2">Feature Importance (SHAP)</p>
                            <p className="text-xs text-neutral-600">
                              ML model factors: Service type, vehicle class, broker tier, regional load
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">Click tab to load fee analysis</p>
                    )}
                  </CardContent>
                </Card>

                {/* AI Algorithms Info */}
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Brain className="h-5 w-5" />
                      Novel AI Algorithms
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">TG-CMAE</p>
                          <p className="text-xs text-neutral-600">Temporal Graph Cross-Modal Autoencoder for multi-pattern fraud detection</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">TAS-DyRa</p>
                          <p className="text-xs text-neutral-600">Temporal Anomaly-Scored Dynamic Rating with RL-inspired updates</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">XFDRC</p>
                          <p className="text-xs text-neutral-600">Explainable Fee-Dynamic Rating-Communication with XGBoost + SHAP</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </section>
    </main>
  )
}
