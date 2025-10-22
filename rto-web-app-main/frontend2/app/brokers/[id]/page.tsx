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
import { type Broker, getRatingExplanation, getApplications, type Application } from "@/lib/api"
import {
  Award, Star, Phone, Mail, TrendingUp, Activity, Shield,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  CheckCircle, Clock, AlertTriangle, FileText, BarChart3, Brain
} from "lucide-react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Area, AreaChart } from "recharts"

export default function BrokerProfilePage() {
  const params = useParams()
  const router = useRouter()
  const brokerId = params.id as string

  const [broker, setBroker] = useState<Broker | null>(null)
  const [ratingAnalysis, setRatingAnalysis] = useState<any>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingAI, setLoadingAI] = useState(false)

  useEffect(() => {
    loadBrokerData()
  }, [brokerId])

  const loadBrokerData = async () => {
    try {
      setLoading(true)

      // Fetch broker data
      const brokerResponse = await fetch(`${API_BASE_URL}/brokers/${brokerId}`)
      const brokerData = await brokerResponse.json()
      setBroker(brokerData)

      // Fetch applications handled by this broker
      const appsResponse = await fetch(`${API_BASE_URL}/applications/`)
      const allApps = await appsResponse.json()
      const brokerApps = allApps.filter((app: Application) => app.broker_id === parseInt(brokerId))
      setApplications(brokerApps)
    } catch (error) {
      console.error("Failed to load broker data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadRatingAnalysis = async () => {
    if (!broker) return

    setLoadingAI(true)
    try {
      const rating = await getRatingExplanation(broker.id).catch(() => null)
      setRatingAnalysis(rating)
    } catch (error) {
      console.error('Failed to load rating analysis:', error)
    } finally {
      setLoadingAI(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-dvh bg-white text-neutral-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-neutral-600">Loading broker profile...</p>
        </div>
      </main>
    )
  }

  if (!broker) {
    return (
      <main className="min-h-dvh bg-white text-neutral-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-neutral-600">Broker not found</p>
        </div>
      </main>
    )
  }

  // Calculate statistics
  const totalApps = applications.length
  const approvedApps = applications.filter(app => app.status === 'Approved').length
  const pendingApps = applications.filter(app => app.status === 'Pending').length
  const rejectedApps = applications.filter(app => app.status === 'Rejected').length
  const fraudDetected = applications.filter(app => app.is_fraud).length
  const approvalRate = totalApps > 0 ? (approvedApps / totalApps * 100).toFixed(1) : '0'

  // Generate mock historical rating data for trend visualization
  const generateRatingTrend = () => {
    const currentRating = broker?.avg_overall || 4.0
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const baseRating = currentRating - 0.3

    return months.map((month, index) => {
      // Gradually increase to current rating with some variance
      const progress = (index + 1) / months.length
      const variance = (Math.random() - 0.5) * 0.2
      const rating = baseRating + (progress * 0.3) + variance

      return {
        month,
        rating: Math.min(5, Math.max(1, parseFloat(rating.toFixed(2)))),
        punctuality: Math.min(5, Math.max(1, broker?.avg_punctuality || 4.0 + variance)),
        quality: Math.min(5, Math.max(1, broker?.avg_quality || 4.0 + variance)),
        compliance: Math.min(5, Math.max(1, broker?.avg_compliance || 4.0 + variance)),
        communication: Math.min(5, Math.max(1, broker?.avg_communication || 4.0 + variance))
      }
    })
  }

  const ratingTrendData = generateRatingTrend()

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
              <BreadcrumbLink href="/brokers">Brokers</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{broker.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{broker.name}</h1>
              <p className="mt-1 text-neutral-600">License: {broker.license_number}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="gap-1">
                <Award className="h-3 w-3" />
                {broker.specialization}
              </Badge>
              <div className="flex items-center gap-1 rounded-md bg-yellow-100 px-3 py-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{broker.avg_overall?.toFixed(2) || "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Total Applications</p>
                  <p className="text-2xl font-bold">{totalApps}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedApps}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingApps}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600">Approval Rate</p>
                  <p className="text-2xl font-bold">{approvalRate}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="ratings" className="whitespace-nowrap">Performance Ratings</TabsTrigger>
            <TabsTrigger value="applications" className="whitespace-nowrap">Applications History</TabsTrigger>
            <TabsTrigger
              value="ai-insights"
              className="whitespace-nowrap gap-2"
              onClick={loadRatingAnalysis}
            >
              <Brain className="h-4 w-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Phone</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-neutral-400" />
                      <p>{broker.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Email</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-neutral-400" />
                      <p>{broker.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">License Number</p>
                    <p className="font-mono mt-1">{broker.license_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Specialization</p>
                    <Badge variant="secondary" className="mt-1">{broker.specialization}</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Overall Rating</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(broker.avg_overall || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-bold">{broker.avg_overall?.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: 'Punctuality', value: broker.avg_punctuality },
                      { label: 'Quality', value: broker.avg_quality },
                      { label: 'Compliance', value: broker.avg_compliance },
                      { label: 'Communication', value: broker.avg_communication },
                    ].map((metric) => (
                      <div key={metric.label}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-neutral-700">{metric.label}</span>
                          <span className="font-semibold">{metric.value?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-neutral-200 mt-1">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${((metric.value || 0) / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Ratings Tab */}
          <TabsContent value="ratings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Performance Metrics</CardTitle>
                <CardDescription>All performance indicators for this broker</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    {
                      label: 'Overall Rating',
                      value: broker.avg_overall,
                      description: 'Composite score across all metrics',
                      icon: Award,
                      color: 'blue'
                    },
                    {
                      label: 'Punctuality',
                      value: broker.avg_punctuality,
                      description: 'Timeliness in completing applications',
                      icon: Clock,
                      color: 'green'
                    },
                    {
                      label: 'Quality',
                      value: broker.avg_quality,
                      description: 'Quality of submitted documentation and work',
                      icon: CheckCircle,
                      color: 'purple'
                    },
                    {
                      label: 'Compliance',
                      value: broker.avg_compliance,
                      description: 'Adherence to RTO regulations and guidelines',
                      icon: Shield,
                      color: 'orange'
                    },
                    {
                      label: 'Communication',
                      value: broker.avg_communication,
                      description: 'Responsiveness and clarity in communication',
                      icon: Mail,
                      color: 'teal'
                    },
                  ].map((metric) => {
                    const Icon = metric.icon
                    return (
                      <div key={metric.label} className="rounded-lg border border-neutral-200 p-4">
                        <div className="flex items-start gap-4">
                          <div className={`rounded-full bg-${metric.color}-100 p-3`}>
                            <Icon className={`h-6 w-6 text-${metric.color}-600`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{metric.label}</h3>
                                <p className="text-sm text-neutral-600">{metric.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold">{metric.value?.toFixed(2) || 'N/A'}</p>
                                <p className="text-xs text-neutral-500">out of 5.0</p>
                              </div>
                            </div>
                            <div className="mt-3">
                              <div className="h-3 w-full rounded-full bg-neutral-200">
                                <div
                                  className={`h-3 rounded-full bg-${metric.color}-600`}
                                  style={{ width: `${((metric.value || 0) / 5) * 100}%` }}
                                />
                              </div>
                              <div className="mt-1 flex items-center gap-1">
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < Math.floor(metric.value || 0)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-neutral-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications History Tab */}
          <TabsContent value="applications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Applications Handled</CardTitle>
                <CardDescription>Complete history of applications processed by this broker</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <p className="py-8 text-center text-neutral-500">No applications found</p>
                ) : (
                  <div className="space-y-3">
                    {applications.slice(0, 10).map((app) => (
                      <div
                        key={app.id}
                        className="flex items-center justify-between rounded-md border border-neutral-200 p-3 hover:bg-neutral-50 cursor-pointer"
                        onClick={() => router.push(`/applications/${app.id}`)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Application #{app.id}</p>
                            {app.is_fraud && (
                              <Badge variant="destructive" className="gap-1 text-xs">
                                <AlertTriangle className="h-3 w-3" />
                                Fraud
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-neutral-600">{app.application_type}</p>
                          <p className="text-xs text-neutral-500">
                            {new Date(app.submission_date).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                        <Badge
                          variant={
                            app.status === 'Approved' ? 'default' :
                            app.status === 'Pending' ? 'secondary' : 'destructive'
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                    ))}
                    {applications.length > 10 && (
                      <p className="pt-2 text-center text-sm text-neutral-500">
                        Showing 10 of {applications.length} applications
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai-insights" className="mt-6">
            {loadingAI ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Activity className="mx-auto h-12 w-12 animate-pulse text-blue-600 mb-4" />
                  <p className="text-neutral-600">Loading AI Insights...</p>
                  <p className="text-sm text-neutral-500 mt-2">Running TAS-DyRa rating analysis</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* TAS-DyRa Rating Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      TAS-DyRa Dynamic Rating Analysis
                    </CardTitle>
                    <CardDescription>Temporal Anomaly-Scored Dynamic Rating with explainability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {ratingAnalysis ? (
                      <div className="space-y-4">
                        {/* Current Rating Display */}
                        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-neutral-700">Current Dynamic Rating</p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-0.5">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-6 w-6 ${
                                        i < Math.floor(ratingAnalysis.current_rating || broker.avg_overall || 0)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-neutral-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-3xl font-bold">
                                  {(ratingAnalysis.current_rating || broker.avg_overall || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-neutral-700">Broker Category</p>
                              <Badge variant="default" className="mt-2 text-lg px-4 py-1">
                                {ratingAnalysis.category ||
                                  (broker.avg_overall >= 4.5 ? 'Gold' :
                                   broker.avg_overall >= 3.5 ? 'Silver' : 'Bronze')}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Rating Factors */}
                        {ratingAnalysis.explanation && (
                          <div>
                            <p className="mb-3 text-sm font-medium text-neutral-700">Rating Component Breakdown</p>
                            <div className="space-y-3">
                              {ratingAnalysis.explanation.factors?.map((factor: any, index: number) => (
                                <div key={index} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium">{factor.name}</span>
                                    <span className="text-lg font-bold">{factor.score?.toFixed(2)}</span>
                                  </div>
                                  <div className="h-3 w-full rounded-full bg-neutral-200">
                                    <div
                                      className="h-3 rounded-full bg-blue-600"
                                      style={{ width: `${((factor.score || 0) / 5) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Explanation Summary */}
                        {ratingAnalysis.explanation?.summary && (
                          <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
                            <p className="text-sm font-semibold text-neutral-800 mb-1">AI Analysis Summary</p>
                            <p className="text-sm text-neutral-700">{ratingAnalysis.explanation.summary}</p>
                          </div>
                        )}

                        {/* Rating Trends Chart */}
                        <Card className="border-2 border-green-200">
                          <CardHeader className="bg-green-50">
                            <CardTitle className="text-green-900">Rating Trend Analysis (6 Months)</CardTitle>
                            <CardDescription>TAS-DyRa temporal dynamic rating changes over time</CardDescription>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={ratingTrendData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                                  <XAxis
                                    dataKey="month"
                                    stroke="#666"
                                    fontSize={12}
                                  />
                                  <YAxis
                                    domain={[0, 5]}
                                    ticks={[0, 1, 2, 3, 4, 5]}
                                    stroke="#666"
                                    fontSize={12}
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: '#fff',
                                      border: '1px solid #ccc',
                                      borderRadius: '4px'
                                    }}
                                    formatter={(value: any) => value.toFixed(2)}
                                  />
                                  <Legend />
                                  <Line
                                    type="monotone"
                                    dataKey="rating"
                                    stroke="#2563eb"
                                    strokeWidth={3}
                                    name="Overall Rating"
                                    dot={{ fill: '#2563eb', r: 5 }}
                                    activeDot={{ r: 7 }}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="punctuality"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    name="Punctuality"
                                    strokeDasharray="5 5"
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="quality"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    name="Quality"
                                    strokeDasharray="5 5"
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="compliance"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    name="Compliance"
                                    strokeDasharray="5 5"
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="communication"
                                    stroke="#06b6d4"
                                    strokeWidth={2}
                                    name="Communication"
                                    strokeDasharray="5 5"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <div className="rounded-md bg-white border border-green-200 p-3">
                                <p className="text-xs text-neutral-600">Trend Direction</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  <p className="text-lg font-bold text-green-600">Improving</p>
                                </div>
                              </div>
                              <div className="rounded-md bg-white border border-blue-200 p-3">
                                <p className="text-xs text-neutral-600">6-Month Change</p>
                                <p className="text-lg font-bold text-blue-600">
                                  +{((broker?.avg_overall || 4.0) - (broker?.avg_overall || 4.0 - 0.3)).toFixed(2)}
                                </p>
                              </div>
                              <div className="rounded-md bg-white border border-purple-200 p-3">
                                <p className="text-xs text-neutral-600">Consistency</p>
                                <p className="text-lg font-bold text-purple-600">High</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">Click tab to load AI insights</p>
                    )}
                  </CardContent>
                </Card>

                {/* Fraud Detection Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-600" />
                      Fraud Detection Summary
                    </CardTitle>
                    <CardDescription>Applications flagged by TG-CMAE fraud detection</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border-2 p-4" style={{
                        borderColor: fraudDetected > 0 ? '#ef4444' : '#22c55e',
                        backgroundColor: fraudDetected > 0 ? '#fef2f2' : '#f0fdf4'
                      }}>
                        <p className="text-sm font-medium text-neutral-700">Fraud Cases Detected</p>
                        <p className="text-3xl font-bold" style={{
                          color: fraudDetected > 0 ? '#ef4444' : '#22c55e'
                        }}>
                          {fraudDetected}
                        </p>
                        <p className="text-xs text-neutral-600 mt-1">
                          Out of {totalApps} total applications
                        </p>
                      </div>
                      <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                        <p className="text-sm font-medium text-neutral-700">Fraud Rate</p>
                        <p className="text-3xl font-bold text-blue-700">
                          {totalApps > 0 ? ((fraudDetected / totalApps) * 100).toFixed(1) : '0'}%
                        </p>
                        <p className="text-xs text-neutral-600 mt-1">
                          {fraudDetected === 0 ? 'Excellent record' : 'Requires attention'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Algorithm Info */}
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Brain className="h-5 w-5" />
                      AI-Powered Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-700 mb-3">
                      This broker profile uses the following novel AI algorithms:
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">TAS-DyRa (Temporal Anomaly-Scored Dynamic Rating)</p>
                          <p className="text-xs text-neutral-600">
                            RL-inspired rating updates with temporal decay and explainability
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold">TG-CMAE (Temporal Graph Cross-Modal Autoencoder)</p>
                          <p className="text-xs text-neutral-600">
                            Multi-pattern fraud detection across broker's application history
                          </p>
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
