# Frontend Implementation Plan - RTO Platform

## Overview
This document outlines the complete implementation plan for the remaining frontend features. All backend APIs are ready and functional.

---

## 🎯 Priority 1: Broker Dashboard Complete Redesign

### File: `frontend2/app/broker/page.tsx`

**Current State:** Shows mock data with hardcoded assignments.

**Target State:** Full-featured broker workflow dashboard with:
- Broker profile with ratings
- Job management (start new job, OTP verification)
- Vehicle details display
- Document upload with forgery detection
- Fee estimator
- Status tracking
- Complaints box
- Toll-free info

### Implementation Steps:

#### 1. Broker Profile Section (Top Card)
```tsx
// Display broker info and ratings
const brokerProfile = {
  id: 1, // Hardcoded for demo, replace with login
  name: "Murugan Kumar",
  license: "TN01234567",
  specialization: "Vehicle Registration",
  ratings: {
    overall: 4.5,
    punctuality: 4.6,
    quality: 4.7,
    compliance: 4.4,
    communication: 4.5,
    total_ratings: 150
  },
  statistics: {
    total_applications: 500,
    approved_applications: 450,
    success_rate: 90
  }
}
```

**API Endpoint:** `GET /brokers/{id}/details`

**UI Components:**
- Profile card with photo (use placeholder avatar)
- Star ratings display (use shadcn/ui Rating component or lucide-react stars)
- Statistics cards (Total Jobs, Success Rate, Pending)

---

#### 2. Start New Job Modal

**Trigger:** "Start New Job" button in dashboard

**Flow:**
1. Modal opens with vehicle number input
2. User enters vehicle registration number
3. System searches for vehicle (API call)
4. If found: Show OTP verification screen
5. If not found: Show "Create new application" link

**API Endpoints:**
- `POST /brokers/{id}/start-job` with `{"vehicle_number": "TN01AB1234"}`

**Response Example:**
```json
{
  "success": true,
  "application": {
    "id": 123,
    "vehicle_number": "TN01AB1234",
    "owner_name": "Ravi Kumar",
    "status": "Pending"
  }
}
```

**Component Structure:**
```tsx
// components/broker/StartJobModal.tsx
- Input for vehicle number
- Search button
- Loading state
- Error handling
```

---

#### 3. OTP Verification Screen

**After vehicle is found, show OTP screen**

**Flow:**
1. Display message: "OTP sent to registered mobile: +91-XXXXX-XXXXX"
2. 6-digit OTP input boxes
3. Resend OTP button (mock - just shows success)
4. Verify button

**API Endpoint:** `POST /brokers/verify-otp`

**Request:**
```json
{
  "phone": "+91-9876543210",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "session_token": "mock_token_1234"
}
```

**Component:**
```tsx
// components/broker/OTPVerification.tsx
- 6 individual input boxes for OTP
- Auto-focus next box on input
- Countdown timer (60 seconds)
- Resend OTP link
```

---

#### 4. Vehicle Details Display

**After OTP verification, show full vehicle details**

**API Endpoint:** `GET /applications/{id}`

**Display Sections:**
1. **Owner Information**
   - Owner Name
   - S/O, D/O, W/O
   - Address
   - Ownership Type

2. **Vehicle Information**
   - Chassis Number
   - Engine Number
   - Maker & Model
   - Vehicle Class
   - Fuel Type
   - Emission Norm
   - Seat Capacity
   - Vehicle Color

3. **Registration Details**
   - Registration Number
   - Date of Registration
   - Registration Valid Upto
   - Tax Valid Upto
   - Registering Authority

4. **Compliance**
   - Fitness Status
   - Insurance Details
   - Insurance Valid Upto
   - PUCC Number
   - PUCC Valid Upto

**Component:**
```tsx
// components/broker/VehicleDetails.tsx
<Card>
  <CardHeader>Vehicle Information</CardHeader>
  <CardContent>
    <Tabs>
      <TabsList>
        <TabsTrigger value="owner">Owner</TabsTrigger>
        <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
        <TabsTrigger value="registration">Registration</TabsTrigger>
        <TabsTrigger value="compliance">Compliance</TabsTrigger>
      </TabsList>
      {/* Tab content with data */}
    </Tabs>
  </CardContent>
</Card>
```

---

#### 5. Document Upload Component

**Location:** Below vehicle details

**Features:**
- Drag & drop file upload
- Multiple file support (up to 5 files)
- Supported formats: PDF, JPG, PNG
- Max size: 5MB per file
- Preview uploaded files
- Delete uploaded files
- Auto-trigger forgery detection on upload

**API Endpoints:**
- `POST /ocr/` - Extract text from document
- `POST /forgery/` - Detect document forgery

**Component:**
```tsx
// components/broker/DocumentUpload.tsx
<Card>
  <CardHeader>
    <CardTitle>Upload Documents</CardTitle>
    <CardDescription>
      Upload Aadhaar, RC, Insurance, Photos (Max 5 files, 5MB each)
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="border-2 border-dashed rounded-lg p-8 text-center">
      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
      <p>Drag & drop files here or click to browse</p>
      <Input type="file" multiple accept=".pdf,.jpg,.png" />
    </div>

    {/* Uploaded files list */}
    <div className="mt-4 space-y-2">
      {uploadedFiles.map((file) => (
        <div className="flex items-center justify-between p-2 border rounded">
          <div className="flex items-center">
            <File className="h-5 w-5 mr-2" />
            <span>{file.name}</span>
            {file.forgeryCheck && (
              <Badge variant={file.forgeryCheck.status === "legitimate" ? "success" : "destructive"}>
                {file.forgeryCheck.status}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => deleteFile(file.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

**Forgery Detection Integration:**
```tsx
async function uploadAndCheck(file: File) {
  // Convert to base64
  const base64 = await fileToBase64(file);

  // Run forgery detection
  const forgeryResult = await fetch('/forgery/', {
    method: 'POST',
    body: JSON.stringify({ image: base64 }),
  });

  const data = await forgeryResult.json();

  // Show result
  if (data.status === "suspicious") {
    toast.error("Document may be forged! Manual review required.");
  } else {
    toast.success("Document verified successfully.");
  }
}
```

---

#### 6. Fee Estimator Tool

**Location:** Right sidebar or separate card

**Features:**
- Select application type (dropdown)
- Select vehicle class (dropdown)
- Real-time fee calculation
- Show breakdown: Base + Service + Commission + Tax
- Total amount display
- "Generate Estimate" button (downloads PDF or shows printable view)

**API Endpoint:** `POST /applications/{id}/calculate-fee`

**Request:**
```json
{
  "application_type": "New Registration",
  "vehicle_class": "Four Wheeler"
}
```

**Response:**
```json
{
  "breakdown": {
    "base_fee": 1500.0,
    "service_fee": 2250.0,
    "broker_commission": 337.5,
    "tax_gst": 405.0,
    "total": 2992.5
  },
  "application_type": "New Registration",
  "vehicle_class": "Four Wheeler"
}
```

**Component:**
```tsx
// components/broker/FeeEstimator.tsx
<Card>
  <CardHeader>
    <CardTitle>Fee Estimator</CardTitle>
  </CardHeader>
  <CardContent>
    <form className="space-y-4">
      <div>
        <Label>Application Type</Label>
        <Select value={applicationType} onValueChange={setApplicationType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="New Registration">New Registration</SelectItem>
            <SelectItem value="Renewal">Renewal</SelectItem>
            <SelectItem value="Transfer">Transfer of Ownership</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Vehicle Class</Label>
        <Select value={vehicleClass} onValueChange={setVehicleClass}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Two Wheeler">Two Wheeler</SelectItem>
            <SelectItem value="Four Wheeler">Four Wheeler (Car/SUV)</SelectItem>
            <SelectItem value="Commercial">Commercial Vehicle</SelectItem>
            <SelectItem value="Heavy Vehicle">Heavy Vehicle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={calculateFee}>Calculate Fee</Button>
    </form>

    {feeBreakdown && (
      <div className="mt-6 space-y-2">
        <div className="flex justify-between">
          <span>Base Fee:</span>
          <span>₹{feeBreakdown.base_fee}</span>
        </div>
        <div className="flex justify-between">
          <span>Service Fee:</span>
          <span>₹{feeBreakdown.service_fee}</span>
        </div>
        <div className="flex justify-between">
          <span>Broker Commission:</span>
          <span>₹{feeBreakdown.broker_commission}</span>
        </div>
        <div className="flex justify-between">
          <span>GST (18%):</span>
          <span>₹{feeBreakdown.tax_gst}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-lg">
          <span>Total Amount:</span>
          <span>₹{feeBreakdown.total}</span>
        </div>
      </div>
    )}
  </CardContent>
</Card>
```

---

#### 7. Status Tracking Panel

**Location:** Main dashboard area

**Features:**
- Timeline view of application progress
- Filter by status (All, Pending, In Progress, Completed)
- Search by vehicle number or application ID
- Each item shows: Application ID, Vehicle Number, Status, Date

**API Endpoint:** `GET /brokers/{id}/assignments`

**Component:**
```tsx
// components/broker/StatusTracking.tsx
<Card>
  <CardHeader>
    <CardTitle>Active Jobs</CardTitle>
    <div className="flex gap-2">
      <Input placeholder="Search by vehicle number..." />
      <Select value={statusFilter}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      {assignments.map((job) => (
        <Card key={job.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">App #{job.id}</p>
                <p className="text-sm text-muted-foreground">{job.citizen_name}</p>
                <p className="text-sm">{job.application_type}</p>
              </div>
              <div className="text-right">
                <Badge variant={
                  job.status === "Pending" ? "secondary" :
                  job.status === "Approved" ? "success" : "default"
                }>
                  {job.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(job.submission_date).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => viewDetails(job.id)}>
                View Details
              </Button>
              <Button size="sm" onClick={() => updateStatus(job.id, "In Progress")}>
                Update Status
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </CardContent>
</Card>
```

**Status Update:**
```tsx
async function updateStatus(appId: number, newStatus: string) {
  await fetch(`/applications/${appId}/status?status=${newStatus}`, {
    method: 'PUT'
  });
  toast.success("Status updated successfully");
  // Refresh list
}
```

---

#### 8. Complaints Box

**Location:** Sidebar or separate tab

**Features:**
- Submit new complaint form
- View past complaints
- Filter by status (Pending, Resolved, Closed)
- Complaint types: Technical, Payment, Delay, Other

**API Endpoints:**
- `POST /complaints` - Submit complaint
- `GET /complaints?broker_id={id}` - List broker's complaints

**Component:**
```tsx
// components/broker/ComplaintsBox.tsx
<Card>
  <CardHeader>
    <CardTitle>Complaints & Support</CardTitle>
    <CardDescription>Submit issues or view past complaints</CardDescription>
  </CardHeader>
  <CardContent>
    <Tabs defaultValue="submit">
      <TabsList>
        <TabsTrigger value="submit">Submit Complaint</TabsTrigger>
        <TabsTrigger value="history">View History</TabsTrigger>
      </TabsList>

      <TabsContent value="submit">
        <form className="space-y-4" onSubmit={submitComplaint}>
          <div>
            <Label>Application ID</Label>
            <Input type="number" placeholder="12345" required />
          </div>

          <div>
            <Label>Complaint Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Issue</SelectItem>
                <SelectItem value="payment">Payment Issue</SelectItem>
                <SelectItem value="delay">Delay in Processing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea placeholder="Describe your issue..." rows={4} required />
          </div>

          <Button type="submit">Submit Complaint</Button>
        </form>
      </TabsContent>

      <TabsContent value="history">
        <div className="space-y-2">
          {complaints.map((complaint) => (
            <Card key={complaint.id}>
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Ticket #{complaint.id}</p>
                    <p className="text-sm text-muted-foreground">{complaint.complaint_type}</p>
                    <p className="text-sm mt-1">{complaint.description}</p>
                  </div>
                  <Badge variant={
                    complaint.status === "Pending" ? "secondary" :
                    complaint.status === "Resolved" ? "success" : "default"
                  }>
                    {complaint.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Submitted: {new Date(complaint.submitted_date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  </CardContent>
</Card>
```

---

#### 9. Toll-Free & Support Info

**Location:** Footer or sidebar card

**API Endpoint:** `GET /support/info`

**Response:**
```json
{
  "toll_free": "1800-XXX-XXXX",
  "emergency_contact": "+91-XXX-XXX-XXXX",
  "email": "support@rto.gov.in",
  "working_hours": "Monday - Saturday, 9:00 AM - 6:00 PM",
  "helpdesk": "For urgent assistance, call our 24/7 helpline"
}
```

**Component:**
```tsx
// components/broker/SupportInfo.tsx
<Card>
  <CardHeader>
    <CardTitle>Support & Help</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <div className="flex items-center gap-2">
      <Phone className="h-4 w-4" />
      <div>
        <p className="text-sm font-semibold">Toll-Free</p>
        <p className="text-lg font-bold">{supportInfo.toll_free}</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <AlertCircle className="h-4 w-4" />
      <div>
        <p className="text-sm font-semibold">Emergency</p>
        <p>{supportInfo.emergency_contact}</p>
      </div>
    </div>

    <div className="flex items-center gap-2">
      <Mail className="h-4 w-4" />
      <div>
        <p className="text-sm font-semibold">Email</p>
        <p>{supportInfo.email}</p>
      </div>
    </div>

    <Separator />

    <div>
      <p className="text-sm font-semibold">Working Hours</p>
      <p className="text-sm text-muted-foreground">{supportInfo.working_hours}</p>
    </div>

    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{supportInfo.helpdesk}</AlertDescription>
    </Alert>
  </CardContent>
</Card>
```

---

### Complete Broker Dashboard Layout

```tsx
// frontend2/app/broker/page.tsx

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BrokerProfile } from "@/components/broker/BrokerProfile"
import { StartJobModal } from "@/components/broker/StartJobModal"
import { OTPVerification } from "@/components/broker/OTPVerification"
import { VehicleDetails } from "@/components/broker/VehicleDetails"
import { DocumentUpload } from "@/components/broker/DocumentUpload"
import { FeeEstimator } from "@/components/broker/FeeEstimator"
import { StatusTracking } from "@/components/broker/StatusTracking"
import { ComplaintsBox } from "@/components/broker/ComplaintsBox"
import { SupportInfo } from "@/components/broker/SupportInfo"

export default function BrokerDashboard() {
  const [brokerId, setBrokerId] = useState(1) // Hardcoded for demo
  const [currentStep, setCurrentStep] = useState("dashboard") // dashboard, otp, vehicle_details
  const [selectedApplication, setSelectedApplication] = useState(null)

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Broker Profile */}
          <BrokerProfile brokerId={brokerId} />

          {/* Main Action Area */}
          {currentStep === "dashboard" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <StartJobModal onJobStart={() => setCurrentStep("otp")} />
                </CardContent>
              </Card>

              <StatusTracking brokerId={brokerId} />
            </>
          )}

          {currentStep === "otp" && (
            <OTPVerification
              onVerified={() => setCurrentStep("vehicle_details")}
              onCancel={() => setCurrentStep("dashboard")}
            />
          )}

          {currentStep === "vehicle_details" && (
            <>
              <VehicleDetails applicationId={selectedApplication} />
              <DocumentUpload applicationId={selectedApplication} />
            </>
          )}
        </div>

        {/* Right Column - Tools & Support */}
        <div className="space-y-6">
          <FeeEstimator />
          <ComplaintsBox brokerId={brokerId} />
          <SupportInfo />
        </div>
      </div>
    </div>
  )
}
```

---

## 🎯 Priority 2: Application Detail Page

### File: `frontend2/app/applications/[id]/page.tsx`

**Purpose:** Show complete application information with vehicle details

**API Endpoint:** `GET /applications/{id}`

**Sections:**
1. Application Overview (ID, Type, Status, Date)
2. Citizen Information (Name, Email, Phone, Address)
3. Assigned Broker (Name, Contact, Specialization)
4. Vehicle Details (all fields from database)
5. Rating (if available)
6. Fraud Status indicator

**Component Structure:**
```tsx
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, CheckCircle2, User, Car } from "lucide-react"

export default function ApplicationDetailPage() {
  const params = useParams()
  const [application, setApplication] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplication()
  }, [])

  async function fetchApplication() {
    const res = await fetch(`http://localhost:8000/applications/${params.id}`)
    const data = await res.json()
    setApplication(data)
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Application #{application.id}</h1>
          <p className="text-muted-foreground">{application.application_type}</p>
        </div>
        <Badge variant={
          application.status === "Approved" ? "success" :
          application.status === "Rejected" ? "destructive" : "secondary"
        }>
          {application.status}
        </Badge>
      </div>

      {/* Fraud Warning */}
      {application.is_fraud && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fraud Alert</AlertTitle>
          <AlertDescription>
            This application has been flagged for potential fraud. Manual review required.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Citizen Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Citizen Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">{application.citizen?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p>{application.citizen?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p>{application.citizen?.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p>{application.citizen?.address}</p>
            </div>
          </CardContent>
        </Card>

        {/* Broker Information */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Broker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-semibold">{application.broker?.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Specialization</p>
              <p>{application.broker?.specialization}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <p>{application.broker?.phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details - Full Width */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="basic">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="registration">Registration</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Chassis Number</p>
                    <p className="font-mono">{application.vehicle_details?.chassis_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Engine Number</p>
                    <p className="font-mono">{application.vehicle_details?.engine_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Maker & Model</p>
                    <p>{application.vehicle_details?.maker_name} {application.vehicle_details?.model_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vehicle Class</p>
                    <p>{application.vehicle_details?.vehicle_class || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fuel Type</p>
                    <p>{application.vehicle_details?.fuel_type || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p>{application.vehicle_details?.vehicle_color || "N/A"}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="registration" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Registration Number</p>
                    <p className="font-semibold text-lg">{application.vehicle_details?.registration_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registration Date</p>
                    <p>{application.vehicle_details?.date_of_registration || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valid Upto</p>
                    <p>{application.vehicle_details?.registration_valid_upto || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tax Valid Upto</p>
                    <p>{application.vehicle_details?.tax_valid_upto || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Registering Authority</p>
                    <p>{application.vehicle_details?.registering_authority || "N/A"}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Fitness Status</p>
                    <Badge variant={application.vehicle_details?.fitness_status === "Fit" ? "success" : "secondary"}>
                      {application.vehicle_details?.fitness_status || "N/A"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Insurance Details</p>
                    <p>{application.vehicle_details?.insurance_details || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Insurance Valid Upto</p>
                    <p>{application.vehicle_details?.insurance_valid_upto || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PUCC Number</p>
                    <p>{application.vehicle_details?.pucc_no || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PUCC Valid Upto</p>
                    <p>{application.vehicle_details?.pucc_valid_upto || "N/A"}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Rating (if available) */}
        {application.rating && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Service Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Punctuality</p>
                  <p className="text-2xl font-bold">{application.rating.punctuality}/5</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Quality</p>
                  <p className="text-2xl font-bold">{application.rating.quality}/5</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Compliance</p>
                  <p className="text-2xl font-bold">{application.rating.compliance}/5</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Communication</p>
                  <p className="text-2xl font-bold">{application.rating.communication}/5</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Overall</p>
                  <p className="text-2xl font-bold text-primary">{application.rating.overall}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
```

---

## 🎯 Priority 3: Broker Profile Page

### File: `frontend2/app/brokers/[id]/page.tsx`

**Purpose:** Show detailed broker profile with ratings, stats, and recent work

**API Endpoint:** `GET /brokers/{id}/details`

**Sections:**
1. Broker header (Name, License, Specialization)
2. Rating breakdown (5 dimensions + overall)
3. Statistics (Total jobs, Success rate, Approved applications)
4. Recent applications handled
5. Contact button

**Component Structure:**
```tsx
"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Phone, Mail, Award, TrendingUp } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export default function BrokerProfilePage() {
  const params = useParams()
  const [broker, setBroker] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBroker()
  }, [])

  async function fetchBroker() {
    const res = await fetch(`http://localhost:8000/brokers/${params.id}/details`)
    const data = await res.json()
    setBroker(data)
    setLoading(false)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-6">
      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
                {broker.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{broker.name}</h1>
                <p className="text-muted-foreground">License: {broker.license_number}</p>
                <Badge className="mt-2">{broker.specialization}</Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 mb-2">
                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                <span className="text-3xl font-bold">{broker.ratings.overall}</span>
                <span className="text-muted-foreground">/5</span>
              </div>
              <p className="text-sm text-muted-foreground">{broker.ratings.total_ratings} ratings</p>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <Button className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call: {broker.phone}
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email: {broker.email}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rating Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Rating Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Punctuality</span>
                <span className="text-sm font-semibold">{broker.ratings.punctuality}/5</span>
              </div>
              <Progress value={broker.ratings.punctuality * 20} />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Quality</span>
                <span className="text-sm font-semibold">{broker.ratings.quality}/5</span>
              </div>
              <Progress value={broker.ratings.quality * 20} />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Compliance</span>
                <span className="text-sm font-semibold">{broker.ratings.compliance}/5</span>
              </div>
              <Progress value={broker.ratings.compliance * 20} />
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm">Communication</span>
                <span className="text-sm font-semibold">{broker.ratings.communication}/5</span>
              </div>
              <Progress value={broker.ratings.communication * 20} />
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Applications</span>
              <span className="text-2xl font-bold">{broker.statistics.total_applications}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Approved</span>
              <span className="text-2xl font-bold text-green-600">{broker.statistics.approved_applications}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="text-2xl font-bold">{broker.statistics.success_rate}%</span>
            </div>

            <Progress value={broker.statistics.success_rate} className="h-3" />
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {broker.recent_applications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-semibold">Application #{app.id}</p>
                    <p className="text-sm text-muted-foreground">{app.application_type}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      app.status === "Approved" ? "success" :
                      app.status === "Pending" ? "secondary" : "default"
                    }>
                      {app.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(app.submission_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## 🎯 Priority 4: Connect Citizen Dashboard

### File: `frontend2/app/citizen/page.tsx`

**Current State:** Shows only stats, no application list

**Enhancement:** Add applications list with clickable cards

**API Endpoint:** `GET /applications/?citizen_id={id}&page=1&limit=10`

**Add this section after the stats cards:**

```tsx
// Add this component to citizen dashboard
<Card className="mt-6">
  <CardHeader>
    <CardTitle>My Applications</CardTitle>
  </CardHeader>
  <CardContent>
    {applications.applications?.map((app) => (
      <Link
        key={app.id}
        href={`/applications/${app.id}`}
        className="block mb-3"
      >
        <Card className="hover:bg-accent cursor-pointer transition">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">Application #{app.id}</p>
                <p className="text-sm text-muted-foreground">{app.application_type}</p>
                {app.is_fraud && (
                  <Badge variant="destructive" className="mt-1">Fraud Alert</Badge>
                )}
              </div>
              <div className="text-right">
                <Badge variant={
                  app.status === "Approved" ? "success" :
                  app.status === "Rejected" ? "destructive" : "secondary"
                }>
                  {app.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(app.submission_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    ))}

    {/* Pagination */}
    <div className="flex justify-between items-center mt-4">
      <Button
        variant="outline"
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {Math.ceil(applications.total / 10)}
      </span>
      <Button
        variant="outline"
        disabled={page * 10 >= applications.total}
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 🎯 Priority 5: Make Broker Cards Clickable

### File: `frontend2/app/brokers/page.tsx`

**Enhancement:** Add link to broker profile page

**Change:**
```tsx
// Wrap broker card content with Link
{brokers.map((broker) => (
  <Link key={broker.id} href={`/brokers/${broker.id}`}>
    <Card className="hover:bg-accent cursor-pointer transition">
      {/* Existing card content */}
    </Card>
  </Link>
))}
```

---

## 🎯 Priority 6: Admin Fraud Review Page

### File: `frontend2/app/admin/fraud-review/page.tsx`

**Purpose:** List and review fraud-flagged applications

**API Endpoint:** `GET /applications/?is_fraud=true&page=1&limit=20`

**Component:**
```tsx
"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function FraudReviewPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFraudApplications()
  }, [])

  async function fetchFraudApplications() {
    const res = await fetch("http://localhost:8000/applications/?is_fraud=true")
    const data = await res.json()
    setApplications(data.applications)
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <h1 className="text-3xl font-bold">Fraud Review Dashboard</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flagged Applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {applications.map((app) => (
              <Card key={app.id} className="border-destructive">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Application #{app.id}</p>
                      <p className="text-sm text-muted-foreground">
                        Citizen ID: {app.citizen_id} | Broker ID: {app.broker_id}
                      </p>
                      <p className="text-sm">{app.application_type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Fraud Flagged</Badge>
                      <Link href={`/applications/${app.id}`}>
                        <Button size="sm">Review</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 📦 Required npm Packages

Most packages are already installed. You may need to add:

```bash
npm install react-dropzone  # For document upload drag & drop (optional)
```

---

## 🔌 API Client Updates

### File: `frontend2/lib/api.ts`

Add these new functions:

```typescript
// Broker workflow
export async function startJob(brokerId: number, vehicleNumber: string) {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/start-job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle_number: vehicleNumber }),
  })
  return response.json()
}

export async function verifyOTP(phone: string, otp: string) {
  const response = await fetch(`${API_BASE_URL}/brokers/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  })
  return response.json()
}

export async function calculateFee(applicationId: number, applicationType: string, vehicleClass: string) {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/calculate-fee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ application_type: applicationType, vehicle_class: vehicleClass }),
  })
  return response.json()
}

export async function submitComplaint(complaintData: any) {
  const response = await fetch(`${API_BASE_URL}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(complaintData),
  })
  return response.json()
}

export async function getComplaints(brokerId?: number, status?: string) {
  const params = new URLSearchParams()
  if (brokerId) params.append('broker_id', brokerId.toString())
  if (status) params.append('status', status)

  const response = await fetch(`${API_BASE_URL}/complaints?${params}`)
  return response.json()
}

export async function updateApplicationStatus(applicationId: number, status: string) {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status?status=${status}`, {
    method: 'PUT',
  })
  return response.json()
}

export async function getSupportInfo() {
  const response = await fetch(`${API_BASE_URL}/support/info`)
  return response.json()
}

export async function getApplicationDetails(applicationId: number) {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`)
  return response.json()
}

export async function getBrokerDetails(brokerId: number) {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/details`)
  return response.json()
}

export async function getBrokerAssignments(brokerId: number) {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/assignments`)
  return response.json()
}

export async function getBrokerStatistics(brokerId: number) {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/statistics`)
  return response.json()
}

// Document upload with forgery check
export async function uploadDocument(base64Image: string) {
  const forgeryResponse = await fetch(`${API_BASE_URL}/forgery/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  })
  return forgeryResponse.json()
}

// OCR text extraction
export async function extractText(base64Image: string) {
  const response = await fetch(`${API_BASE_URL}/ocr/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image }),
  })
  return response.json()
}
```

---

## 📝 Implementation Checklist

### Phase 1: Core Pages (2-3 hours)
- [ ] Create Application Detail Page (`app/applications/[id]/page.tsx`)
- [ ] Create Broker Profile Page (`app/brokers/[id]/page.tsx`)
- [ ] Make broker cards clickable (add Link wrapper)
- [ ] Add application list to citizen dashboard

### Phase 2: Broker Dashboard Components (3-4 hours)
- [ ] Create `BrokerProfile` component
- [ ] Create `StartJobModal` component
- [ ] Create `OTPVerification` component
- [ ] Create `VehicleDetails` component
- [ ] Create `DocumentUpload` component
- [ ] Create `FeeEstimator` component
- [ ] Create `StatusTracking` component
- [ ] Create `ComplaintsBox` component
- [ ] Create `SupportInfo` component

### Phase 3: Integration (1-2 hours)
- [ ] Update API client with all new functions
- [ ] Test all API integrations
- [ ] Add error handling and loading states
- [ ] Test document upload and forgery detection
- [ ] Test fee calculator
- [ ] Test complaints submission

### Phase 4: Polish (1 hour)
- [ ] Add toast notifications for all actions
- [ ] Improve error messages
- [ ] Add loading spinners
- [ ] Test mobile responsiveness
- [ ] Add breadcrumbs to all pages

---

## 🚀 Deployment Notes

### Before Deploying:
1. Update `.env.local` with production API URL
2. Test all features locally
3. Commit and push to GitHub
4. Redeploy on Vercel (auto-deploys from GitHub)
5. Redeploy backend on Render to get updated database with Tamil names

### Environment Variables:
```
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
```

---

## 🐛 Testing Checklist

### Broker Dashboard Tests:
- [ ] Start new job with valid vehicle number
- [ ] Start new job with invalid vehicle number
- [ ] OTP verification with 6-digit code
- [ ] OTP verification with invalid code
- [ ] View vehicle details
- [ ] Upload document and check forgery detection
- [ ] Calculate fee for different vehicle classes
- [ ] Submit complaint
- [ ] View complaints history
- [ ] Update application status
- [ ] View support info

### General Tests:
- [ ] Navigate to application detail page
- [ ] Navigate to broker profile page
- [ ] View citizen applications list
- [ ] Pagination works correctly
- [ ] All links work
- [ ] Mobile responsive
- [ ] Loading states work
- [ ] Error handling works

---

## 📚 Resources

### shadcn/ui Components Used:
- Card, CardContent, CardHeader, CardTitle
- Button
- Input, Textarea
- Select, SelectTrigger, SelectContent, SelectItem
- Tabs, TabsList, TabsTrigger, TabsContent
- Badge
- Alert, AlertTitle, AlertDescription
- Progress
- Dialog, DialogTrigger, DialogContent
- Toast (for notifications)
- Separator

### Lucide React Icons:
- Phone, Mail, AlertCircle, Upload, File, Trash2, User, Car, Star, Award, TrendingUp, AlertTriangle, CheckCircle2

---

## ✅ Success Criteria

The implementation is complete when:
1. ✅ All broker dashboard features are functional
2. ✅ Brokers can start new jobs and verify OTP
3. ✅ Vehicle details are displayed correctly
4. ✅ Document upload with forgery detection works
5. ✅ Fee calculator provides accurate estimates
6. ✅ Complaints can be submitted and viewed
7. ✅ Application detail page shows all information
8. ✅ Broker profile page displays ratings and stats
9. ✅ Citizen can view list of applications
10. ✅ All navigation links work correctly

---

**Total Estimated Time:** 7-10 hours for complete implementation

**Backend Status:** ✅ 100% Complete (All APIs ready)

**Frontend Status:** ⏳ 0% Complete (Ready to implement using this plan)
