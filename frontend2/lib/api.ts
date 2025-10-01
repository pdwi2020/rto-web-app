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
