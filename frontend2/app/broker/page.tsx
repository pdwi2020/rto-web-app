"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/site/navbar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getBrokerById,
  startJob,
  verifyOTP,
  calculateFee,
  getApplications,
  submitComplaint,
  getComplaints,
  getSupportInfo,
  updateApplicationStatus,
  detectForgery,
  type Broker,
  type Application,
  type FeeEstimate,
  type Complaint,
  type SupportInfo
} from "@/lib/api"
import { PaymentModal } from "@/components/broker/PaymentModal"
import { Star, Phone, Mail, Award, TrendingUp, Plus, Search, Upload, AlertTriangle, DollarSign, Clock, MessageSquare, PhoneCall, LogOut } from "lucide-react"

export default function BrokerDashboard() {
  const router = useRouter()

  // Authentication state
  const [BROKER_ID, setBROKER_ID] = useState<number | null>(null)
  const [broker, setBroker] = useState<Broker | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [supportInfo, setSupportInfo] = useState<SupportInfo | null>(null)
  const [loading, setLoading] = useState(true)

  // Start Job Modal
  const [showStartJob, setShowStartJob] = useState(false)
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [jobStarting, setJobStarting] = useState(false)

  // OTP Modal
  const [showOTP, setShowOTP] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [verifying, setVerifying] = useState(false)

  // Fee Estimator
  const [showFeeEstimator, setShowFeeEstimator] = useState(false)
  const [feeEstimate, setFeeEstimate] = useState<FeeEstimate | null>(null)
  const [selectedAppType, setSelectedAppType] = useState("New Registration")
  const [selectedVehicleClass, setSelectedVehicleClass] = useState("Two Wheeler")

  // Complaint Modal
  const [showComplaint, setShowComplaint] = useState(false)
  const [complaintType, setComplaintType] = useState("")
  const [complaintDesc, setComplaintDesc] = useState("")
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null)

  // Document Upload
  const [uploadedDoc, setUploadedDoc] = useState<string | null>(null)
  const [forgeryResult, setForgeryResult] = useState<any>(null)
  const [analyzing, setAnalyzing] = useState(false)

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedApplicationForPayment, setSelectedApplicationForPayment] = useState<number | null>(null)

  useEffect(() => {
    // Check authentication
    const brokerData = localStorage.getItem("broker")
    const brokerId = localStorage.getItem("brokerId")

    if (!brokerData || !brokerId) {
      router.push("/broker/login")
      return
    }

    setBROKER_ID(parseInt(brokerId))
    loadDashboardData(parseInt(brokerId))
  }, [])

  const loadDashboardData = async (brokerId: number) => {
    try {
      setLoading(true)
      const [brokerData, appsData, complaintsData, supportData] = await Promise.all([
        getBrokerById(brokerId),
        getApplications(),
        getComplaints(brokerId),
        getSupportInfo()
      ])
      setBroker(brokerData)
      setApplications(appsData.filter((app: Application) => app.broker_id === brokerId))
      setComplaints(complaintsData)
      setSupportInfo(supportData)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("broker")
    localStorage.removeItem("brokerId")
    router.push("/broker/login")
  }

  const handleStartJob = async () => {
    if (!vehicleNumber.trim() || !BROKER_ID) return

    setJobStarting(true)
    try {
      const result = await startJob(BROKER_ID, vehicleNumber)
      if (result.success) {
        setShowStartJob(false)
        setShowOTP(true)
        setVehicleNumber("")
      }
    } catch (error) {
      console.error("Failed to start job:", error)
    } finally {
      setJobStarting(false)
    }
  }

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  const handleVerifyOTP = async () => {
    const otpValue = otp.join("")
    if (otpValue.length !== 6 || !phoneNumber) return

    setVerifying(true)
    try {
      const result = await verifyOTP(phoneNumber, otpValue)
      if (result.success) {
        setShowOTP(false)
        setOtp(["", "", "", "", "", ""])
        setPhoneNumber("")
        loadDashboardData()
      }
    } catch (error) {
      console.error("Failed to verify OTP:", error)
    } finally {
      setVerifying(false)
    }
  }

  const handleCalculateFee = async () => {
    try {
      const estimate = await calculateFee(1, selectedAppType, selectedVehicleClass)
      setFeeEstimate(estimate)
    } catch (error) {
      console.error("Failed to calculate fee:", error)
    }
  }

  const handleSubmitComplaint = async () => {
    if (!selectedAppId || !complaintType || !complaintDesc || !BROKER_ID) return

    try {
      await submitComplaint({
        broker_id: BROKER_ID,
        application_id: selectedAppId,
        complaint_type: complaintType,
        description: complaintDesc
      })
      setShowComplaint(false)
      setComplaintType("")
      setComplaintDesc("")
      setSelectedAppId(null)
      loadDashboardData(BROKER_ID)
    } catch (error) {
      console.error("Failed to submit complaint:", error)
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAnalyzing(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        setUploadedDoc(base64)

        const result = await detectForgery(base64.split(',')[1])
        setForgeryResult(result)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Failed to analyze document:", error)
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-white text-neutral-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-neutral-600">Loading dashboard...</p>
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
              <BreadcrumbPage>Broker Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Broker Profile Section */}
        <div className="mb-8 rounded-lg border border-neutral-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
          <div className="mb-4 flex items-center justify-end">
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-neutral-900">{broker?.name}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-neutral-600">
                <span className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  License: {broker?.license_number}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {broker?.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {broker?.email}
                </span>
              </div>
              <Badge className="mt-2" variant="secondary">{broker?.specialization}</Badge>
            </div>

            {/* Ratings Display */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-none shadow-sm">
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold">{broker?.avg_overall?.toFixed(1) || "N/A"}</span>
                  </div>
                  <p className="text-xs text-neutral-600">Overall</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm">
                <CardContent className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-2xl font-bold">{applications.length}</span>
                  </div>
                  <p className="text-xs text-neutral-600">Active Jobs</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mt-6 grid grid-cols-4 gap-4">
            {[
              { label: "Punctuality", value: broker?.avg_punctuality },
              { label: "Quality", value: broker?.avg_quality },
              { label: "Compliance", value: broker?.avg_compliance },
              { label: "Communication", value: broker?.avg_communication },
            ].map((metric) => (
              <div key={metric.label} className="rounded-md bg-white p-3">
                <p className="text-xs text-neutral-600">{metric.label}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-neutral-200">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${((metric.value || 0) / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold">{metric.value?.toFixed(1) || "N/A"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-3">
          <Dialog open={showStartJob} onOpenChange={setShowStartJob}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Start New Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start New Job</DialogTitle>
                <DialogDescription>Enter the vehicle number to begin a new application</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="vehicle-number">Vehicle Number</Label>
                  <Input
                    id="vehicle-number"
                    placeholder="e.g., TN01AB1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleStartJob} disabled={jobStarting} className="w-full">
                  {jobStarting ? "Starting..." : "Continue"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showFeeEstimator} onOpenChange={setShowFeeEstimator}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <DollarSign className="h-4 w-4" />
                Fee Estimator
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fee Estimator</DialogTitle>
                <DialogDescription>Calculate service fees for different application types</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Application Type</Label>
                  <Select value={selectedAppType} onValueChange={setSelectedAppType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New Registration">New Registration</SelectItem>
                      <SelectItem value="Renewal">Renewal</SelectItem>
                      <SelectItem value="Transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Vehicle Class</Label>
                  <Select value={selectedVehicleClass} onValueChange={setSelectedVehicleClass}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Two Wheeler">Two Wheeler</SelectItem>
                      <SelectItem value="Four Wheeler">Four Wheeler</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Heavy Vehicle">Heavy Vehicle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCalculateFee} className="w-full">Calculate</Button>

                {feeEstimate && (
                  <div className="mt-4 rounded-md border border-neutral-200 p-4">
                    <h4 className="font-semibold">Fee Breakdown</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Base Fee</span>
                        <span>₹{feeEstimate.breakdown.base_fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Service Fee</span>
                        <span>₹{feeEstimate.breakdown.service_fee}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Broker Commission (15%)</span>
                        <span>₹{feeEstimate.breakdown.broker_commission}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST (18%)</span>
                        <span>₹{feeEstimate.breakdown.tax_gst}</span>
                      </div>
                      <div className="flex justify-between border-t border-neutral-200 pt-1 font-bold">
                        <span>Total</span>
                        <span>₹{feeEstimate.breakdown.total}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedApplicationForPayment(1)
                        setShowPaymentModal(true)
                      }}
                      className="mt-4 w-full gap-2"
                    >
                      <DollarSign className="h-4 w-4" />
                      Proceed to Payment
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showComplaint} onOpenChange={setShowComplaint}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                File Complaint
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>File a Complaint</DialogTitle>
                <DialogDescription>Submit a complaint regarding an application</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Application ID</Label>
                  <Select value={selectedAppId?.toString()} onValueChange={(val) => setSelectedAppId(parseInt(val))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select application" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id.toString()}>
                          Application #{app.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Complaint Type</Label>
                  <Select value={complaintType} onValueChange={setComplaintType}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Document Issue">Document Issue</SelectItem>
                      <SelectItem value="Payment Issue">Payment Issue</SelectItem>
                      <SelectItem value="Delay">Delay</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                    placeholder="Describe your complaint..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
                <Button onClick={handleSubmitComplaint} className="w-full">Submit Complaint</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* OTP Verification Modal */}
        <Dialog open={showOTP} onOpenChange={setShowOTP}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify OTP</DialogTitle>
              <DialogDescription>Enter the 6-digit OTP sent to your registered mobile number</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>OTP</Label>
                <div className="mt-2 flex gap-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOTPChange(index, e.target.value)}
                      className="h-12 w-12 text-center text-lg"
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleVerifyOTP} disabled={verifying} className="w-full">
                {verifying ? "Verifying..." : "Verify OTP"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Applications Tab */}
          <TabsContent value="applications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Applications</CardTitle>
                <CardDescription>Track and manage your assigned applications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {applications.length === 0 ? (
                    <p className="py-8 text-center text-neutral-600">No applications assigned yet</p>
                  ) : (
                    applications.map((app) => (
                      <div key={app.id} className="flex items-center justify-between rounded-md border border-neutral-200 p-4">
                        <div>
                          <p className="font-medium">Application #{app.id}</p>
                          <p className="text-sm text-neutral-600">{app.application_type}</p>
                          <p className="text-xs text-neutral-500">Submitted: {new Date(app.submission_date).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={app.status === "Approved" ? "default" : app.status === "Pending" ? "secondary" : "destructive"}>
                            {app.status}
                          </Badge>
                          {app.is_fraud && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Fraud Alert
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Document Upload & Verification</CardTitle>
                <CardDescription>Upload documents and check for forgery</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 p-8">
                    <label htmlFor="doc-upload" className="cursor-pointer text-center">
                      <Upload className="mx-auto h-12 w-12 text-neutral-400" />
                      <p className="mt-2 text-sm font-medium">Click to upload document</p>
                      <p className="text-xs text-neutral-500">PNG, JPG up to 10MB</p>
                      <input
                        id="doc-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleDocumentUpload}
                      />
                    </label>
                  </div>

                  {analyzing && <p className="text-center text-sm text-neutral-600">Analyzing document...</p>}

                  {forgeryResult && (
                    <div className={`rounded-md border p-4 ${forgeryResult.is_forged ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
                      <div className="flex items-center gap-2">
                        {forgeryResult.is_forged ? (
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        ) : (
                          <Award className="h-5 w-5 text-green-600" />
                        )}
                        <h4 className="font-semibold">
                          {forgeryResult.is_forged ? "Potential Forgery Detected" : "Document Verified"}
                        </h4>
                      </div>
                      <p className="mt-2 text-sm">Confidence: {(forgeryResult.confidence * 100).toFixed(1)}%</p>
                      {forgeryResult.issues && forgeryResult.issues.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm font-medium">Issues Found:</p>
                          <ul className="ml-4 mt-1 list-disc text-sm">
                            {forgeryResult.issues.map((issue: string, idx: number) => (
                              <li key={idx}>{issue}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>My Complaints</CardTitle>
                <CardDescription>View and track your complaint history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {complaints.length === 0 ? (
                    <p className="py-8 text-center text-neutral-600">No complaints filed</p>
                  ) : (
                    complaints.map((complaint) => (
                      <div key={complaint.id} className="rounded-md border border-neutral-200 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">Complaint #{complaint.id}</h4>
                              <Badge variant={complaint.status === "Resolved" ? "default" : "secondary"}>
                                {complaint.status}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm font-medium text-neutral-700">{complaint.complaint_type}</p>
                            <p className="mt-1 text-sm text-neutral-600">{complaint.description}</p>
                            <p className="mt-2 text-xs text-neutral-500">
                              Submitted: {new Date(complaint.submitted_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PhoneCall className="h-5 w-5" />
                    Contact Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Toll-Free Number</p>
                    <p className="text-lg font-semibold text-blue-600">{supportInfo?.toll_free}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Emergency Contact</p>
                    <p className="text-lg font-semibold">{supportInfo?.emergency_contact}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Email</p>
                    <p className="text-blue-600">{supportInfo?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Working Hours</p>
                    <p className="text-sm text-neutral-600">{supportInfo?.working_hours}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Help</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="rounded-md bg-blue-50 p-3">
                    <p className="text-sm font-medium text-blue-900">24/7 Helpline</p>
                    <p className="text-xs text-blue-700">{supportInfo?.helpdesk}</p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Search className="h-4 w-4" />
                      Track Application Status
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <Clock className="h-4 w-4" />
                      Processing Times
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Payment Modal */}
      {showPaymentModal && feeEstimate && selectedApplicationForPayment && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={(open) => {
            setShowPaymentModal(open)
            if (!open) {
              setSelectedApplicationForPayment(null)
              if (BROKER_ID) loadDashboardData(BROKER_ID)
            }
          }}
          applicationId={selectedApplicationForPayment}
          feeBreakdown={feeEstimate.breakdown}
        />
      )}
    </main>
  )
}
