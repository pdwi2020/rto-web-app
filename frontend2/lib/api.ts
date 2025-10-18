import { API_BASE_URL } from './config'

// Types
export interface Citizen {
  id: number
  name: string
  aadhaar: string
  phone: string
  email: string
  address: string
}

export interface Broker {
  id: number
  name: string
  license_number: string
  phone: string
  email: string
  specialization: string
  avg_punctuality: number
  avg_quality: number
  avg_compliance: number
  avg_communication: number
  avg_overall: number
}

export interface Application {
  id: number
  citizen_id: number
  broker_id: number
  application_type: string
  status: string
  submission_date: string
  documents: string
  is_fraud: boolean
}

export interface Analytics {
  total_citizens: number
  total_brokers: number
  total_applications: number
  approved_applications: number
}

export interface ChatMessage {
  message: string
}

export interface ChatResponse {
  response: string
}

// API Functions
export async function getAnalytics(): Promise<Analytics> {
  const response = await fetch(`${API_BASE_URL}/analytics/`)
  if (!response.ok) throw new Error('Failed to fetch analytics')
  return response.json()
}

export async function getBrokers(): Promise<Broker[]> {
  const response = await fetch(`${API_BASE_URL}/brokers/`)
  if (!response.ok) throw new Error('Failed to fetch brokers')
  return response.json()
}

export async function getApplications(): Promise<Application[]> {
  const response = await fetch(`${API_BASE_URL}/applications/`)
  if (!response.ok) throw new Error('Failed to fetch applications')
  return response.json()
}

export async function createCitizen(data: Omit<Citizen, 'id'>): Promise<Citizen> {
  const response = await fetch(`${API_BASE_URL}/citizens/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create citizen')
  return response.json()
}

export async function createApplication(data: {
  citizen_id: number
  broker_id: number
  application_type: string
  documents: string
}): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/applications/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to create application')
  return response.json()
}

export async function sendChatMessage(message: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  })
  if (!response.ok) throw new Error('Failed to send chat message')
  const data: ChatResponse = await response.json()
  return data.response
}

export async function extractTextFromImage(imageBase64: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/ocr/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  })
  if (!response.ok) throw new Error('Failed to extract text')
  const data = await response.json()
  return data.extracted_text
}

// Broker Workflow API Functions
export interface StartJobRequest {
  vehicle_number: string
}

export interface StartJobResponse {
  success: boolean
  message: string
  application_id?: number
  vehicle_details?: any
}

export interface VerifyOTPRequest {
  phone: string
  otp: string
}

export interface VerifyOTPResponse {
  success: boolean
  message: string
  session_token?: string
}

export interface FeeEstimate {
  breakdown: {
    base_fee: number
    service_fee: number
    broker_commission: number
    tax_gst: number
    total: number
  }
}

export interface Complaint {
  id: number
  broker_id: number
  application_id: number
  complaint_type: string
  description: string
  status: string
  submitted_date: string
  resolved_date?: string
}

export interface SupportInfo {
  toll_free: string
  emergency_contact: string
  email: string
  working_hours: string
  helpdesk: string
}

export async function startJob(brokerId: number, vehicleNumber: string): Promise<StartJobResponse> {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/start-job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle_number: vehicleNumber }),
  })
  if (!response.ok) throw new Error('Failed to start job')
  return response.json()
}

export async function verifyOTP(phone: string, otp: string): Promise<VerifyOTPResponse> {
  const response = await fetch(`${API_BASE_URL}/brokers/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  })
  if (!response.ok) throw new Error('Failed to verify OTP')
  return response.json()
}

export async function calculateFee(applicationId: number, applicationType: string, vehicleClass: string): Promise<FeeEstimate> {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/calculate-fee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ application_type: applicationType, vehicle_class: vehicleClass }),
  })
  if (!response.ok) throw new Error('Failed to calculate fee')
  return response.json()
}

export async function submitComplaint(data: {
  broker_id: number
  application_id: number
  complaint_type: string
  description: string
}): Promise<{ success: boolean; complaint_id: number; message: string }> {
  const response = await fetch(`${API_BASE_URL}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) throw new Error('Failed to submit complaint')
  return response.json()
}

export async function getComplaints(brokerId?: number, status?: string): Promise<Complaint[]> {
  const params = new URLSearchParams()
  if (brokerId) params.append('broker_id', brokerId.toString())
  if (status) params.append('status', status)

  const response = await fetch(`${API_BASE_URL}/complaints?${params.toString()}`)
  if (!response.ok) throw new Error('Failed to fetch complaints')
  return response.json()
}

export async function getSupportInfo(): Promise<SupportInfo> {
  const response = await fetch(`${API_BASE_URL}/support/info`)
  if (!response.ok) throw new Error('Failed to fetch support info')
  return response.json()
}

export async function updateApplicationStatus(applicationId: number, status: string): Promise<Application> {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error('Failed to update application status')
  return response.json()
}

export async function getBrokerById(brokerId: number): Promise<Broker> {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}`)
  if (!response.ok) throw new Error('Failed to fetch broker')
  return response.json()
}

export async function detectForgery(imageBase64: string): Promise<{ is_forged: boolean; confidence: number; issues: string[] }> {
  const response = await fetch(`${API_BASE_URL}/detect-forgery/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  })
  if (!response.ok) throw new Error('Failed to detect forgery')
  return response.json()
}

// ==================== Approval & Payment Functions ====================

export async function approveApplication(applicationId: number, brokerId: number): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved_by: brokerId }),
  })
  if (!response.ok) throw new Error('Failed to approve application')
  return response.json()
}

export async function rejectApplication(applicationId: number, brokerId: number, reason: string): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rejected_by: brokerId, reason }),
  })
  if (!response.ok) throw new Error('Failed to reject application')
  return response.json()
}

export interface PaymentData {
  application_id: number
  amount: number
  payment_method: string
  fee_breakdown: string
}

export async function processPayment(paymentData: PaymentData): Promise<{
  success: boolean
  payment_id: number
  transaction_id: string
  amount: number
  status: string
  message: string
}> {
  const response = await fetch(`${API_BASE_URL}/payments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(paymentData),
  })
  if (!response.ok) throw new Error('Failed to process payment')
  return response.json()
}

export async function getPaymentByApplication(applicationId: number) {
  const response = await fetch(`${API_BASE_URL}/payments/${applicationId}`)
  if (!response.ok) throw new Error('Failed to fetch payment')
  return response.json()
}

// ==================== AI-Powered API Functions (Novel Algorithms) ====================

// XFDRC Fee Estimator (Advanced)
export interface FeeEstimateAdvanced {
  service_type: string
  vehicle_class: string
  broker_tier?: string
  region?: string
  avg_processing_time?: number
  seasonal_load?: number
  anomaly_score?: number
  use_ml?: boolean
}

export interface FeeEstimateResult {
  service_type: string
  vehicle_class: string
  broker_tier: string
  breakdown: {
    base_fee: number
    broker_commission: number
    service_fee: number
    tax_gst: number
    total: number
  }
  predicted_total: number
  confidence: number
  method: string
  explanation?: any
}

export async function estimateFeeAdvanced(params: FeeEstimateAdvanced): Promise<FeeEstimateResult> {
  const response = await fetch(`${API_BASE_URL}/fee/estimate-advanced`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error('Failed to estimate fee')
  return response.json()
}

export async function detectFeeInflation(actualFee: number, serviceType: string, vehicleClass: string, brokerTier: string = 'Silver') {
  const params = new URLSearchParams({
    actual_fee: actualFee.toString(),
    service_type: serviceType,
    vehicle_class: vehicleClass,
    broker_tier: brokerTier
  })
  const response = await fetch(`${API_BASE_URL}/fee/detect-inflation?${params.toString()}`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('Failed to detect inflation')
  return response.json()
}

// RAG-IVR Enhanced Chatbot
export interface RAGChatRequest {
  message: string
  use_rag?: boolean
  top_k?: number
}

export interface RAGChatResponse {
  query: string
  response: string
  retrieved_documents?: any[]
  num_sources?: number
  retrieval_method?: string
  model?: string
  rag_enabled: boolean
}

export async function sendRAGChatMessage(params: RAGChatRequest): Promise<RAGChatResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/rag`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error('Failed to send RAG chat message')
  return response.json()
}

// Feedback Analysis & Sentiment
export interface FeedbackAnalysisRequest {
  text: string
  use_ml?: boolean
}

export async function analyzeFeedback(params: FeedbackAnalysisRequest) {
  const response = await fetch(`${API_BASE_URL}/feedback/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error('Failed to analyze feedback')
  return response.json()
}

export async function calculateRatingAdjustment(sentimentScore: number, complaintProbability: number) {
  const params = new URLSearchParams({
    sentiment_score: sentimentScore.toString(),
    complaint_probability: complaintProbability.toString()
  })
  const response = await fetch(`${API_BASE_URL}/feedback/rating-adjustment?${params.toString()}`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('Failed to calculate rating adjustment')
  return response.json()
}

// Communication & Escalation (CERE)
export interface EscalationCheckRequest {
  anomaly_score?: number
  complaint_probability?: number
  sentiment_score?: number
  delay_ratio?: number
}

export async function checkEscalation(params: EscalationCheckRequest) {
  const response = await fetch(`${API_BASE_URL}/communication/check-escalation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error('Failed to check escalation')
  return response.json()
}

// TAS-DyRa Dynamic Rating
export interface RatingUpdateRequest {
  broker_id: number
  current_rating: number
  actual_time: number
  expected_time: number
  completed_tasks: number
  total_tasks: number
  sentiment_score: number
  anomaly_score?: number
  fraud_score?: number
  days_ago?: number
}

export async function updateRatingDynamic(params: RatingUpdateRequest) {
  const response = await fetch(`${API_BASE_URL}/rating/update-dynamic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error('Failed to update rating')
  return response.json()
}

export async function getRatingExplanation(brokerId: number) {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/rating-explanation`)
  if (!response.ok) throw new Error('Failed to fetch rating explanation')
  return response.json()
}

// TG-CMAE Fraud Detection
export interface FraudCheckRequest {
  application_id: number
  otp_start_time?: string
  otp_close_time?: string
  actual_fee?: number
  expected_fee?: number
  actual_duration?: number
  expected_duration?: number
  broker_id?: number
}

export async function comprehensiveFraudCheck(params: FraudCheckRequest) {
  const response = await fetch(`${API_BASE_URL}/fraud/comprehensive-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!response.ok) throw new Error('Failed to perform fraud check')
  return response.json()
}

export async function detectGhosting(otpStartTime: string, otpCloseTime?: string) {
  const params = new URLSearchParams({
    otp_start_time: otpStartTime,
  })
  if (otpCloseTime) params.append('otp_close_time', otpCloseTime)

  const response = await fetch(`${API_BASE_URL}/fraud/detect-ghosting?${params.toString()}`, {
    method: 'POST',
  })
  if (!response.ok) throw new Error('Failed to detect ghosting')
  return response.json()
}

// VAFD-OCR Advanced Forgery Detection
export async function detectForgeryAdvanced(imageBase64: string) {
  const response = await fetch(`${API_BASE_URL}/forgery/advanced`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 }),
  })
  if (!response.ok) throw new Error('Failed to detect forgery (advanced)')
  return response.json()
}

// Health Check
export async function checkAIModulesHealth() {
  const response = await fetch(`${API_BASE_URL}/health/ai-modules`)
  if (!response.ok) throw new Error('Failed to check AI modules health')
  return response.json()
}
