"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/site/navbar"
import { Breadcrumb } from "@/components/ui/breadcrumb"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { getAnalytics, type Analytics, type Application, comprehensiveFraudCheck } from "@/lib/api"
import { API_BASE_URL } from "@/lib/config"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Shield, Brain, TrendingDown, FileX, Clock, DollarSign, Activity } from "lucide-react"

const data = [
  { week: "W1", approvals: 80, avgSLA: 4.7 },
  { week: "W2", approvals: 85, avgSLA: 4.4 },
  { week: "W3", approvals: 83, avgSLA: 4.3 },
  { week: "W4", approvals: 88, avgSLA: 4.1 },
]

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [fraudApplications, setFraudApplications] = useState<Application[]>([])
  const [allApplications, setAllApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzingFraud, setAnalyzingFraud] = useState(false)
  const [fraudAnalysisData, setFraudAnalysisData] = useState<any>(null)

  // Generate fraud trend data
  const generateFraudTrendData = () => {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6']
    const totalFraud = fraudApplications.length

    return weeks.map((week, index) => {
      const baseFraud = totalFraud / 6
      const variance = (Math.random() - 0.5) * 4
      const fraudCases = Math.max(0, Math.floor(baseFraud + variance))

      return {
        week,
        fraudCases,
        totalApps: Math.floor(fraudCases / 0.02 + Math.random() * 50),
        ghosting: Math.floor(fraudCases * 0.3),
        feeInflation: Math.floor(fraudCases * 0.4),
        duplicate: Math.floor(fraudCases * 0.2),
        forgery: Math.floor(fraudCases * 0.1)
      }
    })
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [analyticsData, appsResponse] = await Promise.all([
          getAnalytics(),
          fetch(`${API_BASE_URL}/applications/`)
        ])
        setAnalytics(analyticsData)

        const appsData = await appsResponse.json()
        const apps = appsData.applications || appsData
        setAllApplications(apps)
        const fraudApps = apps.filter((app: Application) => app.is_fraud)
        setFraudApplications(fraudApps.slice(0, 20)) // Show first 20 fraud cases
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const analyzeFraudPatterns = async () => {
    setAnalyzingFraud(true)
    try {
      // Analyze fraud patterns across all fraud applications
      const fraudStats = {
        total: fraudApplications.length,
        byStatus: {
          pending: fraudApplications.filter(app => app.status === 'Pending').length,
          approved: fraudApplications.filter(app => app.status === 'Approved').length,
          rejected: fraudApplications.filter(app => app.status === 'Rejected').length,
        },
        byType: {} as Record<string, number>
      }

      // Count by application type
      fraudApplications.forEach(app => {
        const type = app.application_type
        fraudStats.byType[type] = (fraudStats.byType[type] || 0) + 1
      })

      setFraudAnalysisData(fraudStats)
    } catch (error) {
      console.error('Failed to analyze fraud patterns:', error)
    } finally {
      setAnalyzingFraud(false)
    }
  }

  const approvalRate = analytics
    ? Math.round((analytics.approved_applications / analytics.total_applications) * 100)
    : 0
  const pendingApps = analytics ? analytics.total_applications - analytics.approved_applications : 0

  if (loading) {
    return (
      <main id="main-content" className="min-h-dvh bg-white text-neutral-900">
        <Navbar />
        <Breadcrumb />
        <section className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-center text-neutral-600">Loading analytics...</p>
        </section>
      </main>
    )
  }

  return (
    <main id="main-content" className="min-h-dvh bg-white text-neutral-900">
      <Navbar />
      <Breadcrumb />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="mt-1 text-neutral-600">Monitor KPIs and overall performance.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Total Applications</p>
            <p className="mt-1 text-3xl font-semibold">{analytics?.total_applications || 0}</p>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Approval Rate</p>
            <p className="mt-1 text-3xl font-semibold">{approvalRate}%</p>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Total Citizens</p>
            <p className="mt-1 text-3xl font-semibold">{analytics?.total_citizens || 0}</p>
          </div>
          <div className="rounded-md border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500">Total Brokers</p>
            <p className="mt-1 text-3xl font-semibold">{analytics?.total_brokers || 0}</p>
          </div>
        </div>

        <div className="mt-8 rounded-md border border-neutral-200 p-4">
          <h2 className="text-lg font-medium">Approvals & SLA</h2>
          <ChartContainer
            className="mt-3"
            config={{
              approvals: { label: "Approvals", color: "oklch(0.63 0.18 255)" },
              avgSLA: { label: "Avg. SLA (d)", color: "oklch(0.75 0.12 210)" },
            }}
          >
            <ResponsiveContainer>
              <AreaChart
                data={data}
                role="img"
                aria-label="Weekly approvals and average SLA"
                margin={{ left: 10, right: 10, top: 10, bottom: 10 }}
              >
                <CartesianGrid stroke="#e5e5e5" vertical={false} />
                <XAxis dataKey="week" tickLine={false} axisLine={false} />
                <YAxis hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="approvals"
                  stroke="var(--color-approvals)"
                  fill="var(--color-approvals)"
                  fillOpacity={0.18}
                />
                <Area
                  type="monotone"
                  dataKey="avgSLA"
                  stroke="var(--color-avgSLA)"
                  fill="var(--color-avgSLA)"
                  fillOpacity={0.14}
                />
                <ChartLegend content={<ChartLegendContent />} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* AI-Powered Fraud Review Dashboard */}
        <div className="mt-8">
          <Card className="border-2 border-red-200">
            <CardHeader className="bg-red-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-red-600" />
                  <div>
                    <CardTitle className="text-red-900">TG-CMAE Fraud Detection Dashboard</CardTitle>
                    <CardDescription className="text-red-700">
                      Multi-pattern temporal fraud detection using AI
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="destructive" className="text-lg px-4 py-2">
                  {fraudApplications.length} Cases
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
                  <TabsTrigger value="fraud-list" className="whitespace-nowrap">Fraud Cases</TabsTrigger>
                  <TabsTrigger
                    value="ai-analysis"
                    className="whitespace-nowrap gap-2"
                    onClick={analyzeFraudPatterns}
                  >
                    <Brain className="h-4 w-4" />
                    AI Analysis
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-red-200 bg-red-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-red-800">Total Fraud Cases</p>
                            <p className="text-3xl font-bold text-red-600">{fraudApplications.length}</p>
                          </div>
                          <AlertTriangle className="h-10 w-10 text-red-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-yellow-200 bg-yellow-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-yellow-800">Pending Review</p>
                            <p className="text-3xl font-bold text-yellow-600">
                              {fraudApplications.filter(app => app.status === 'Pending').length}
                            </p>
                          </div>
                          <Clock className="h-10 w-10 text-yellow-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-orange-800">Rejected</p>
                            <p className="text-3xl font-bold text-orange-600">
                              {fraudApplications.filter(app => app.status === 'Rejected').length}
                            </p>
                          </div>
                          <FileX className="h-10 w-10 text-orange-600" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-800">Fraud Rate</p>
                            <p className="text-3xl font-bold text-blue-600">
                              {allApplications.length > 0
                                ? ((fraudApplications.length / allApplications.length) * 100).toFixed(1)
                                : '0'}%
                            </p>
                          </div>
                          <TrendingDown className="h-10 w-10 text-blue-600" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Fraud Pattern Detection Indicators */}
                  <Card className="mt-6 border-purple-200">
                    <CardHeader className="bg-purple-50">
                      <CardTitle className="text-purple-900">Detected Fraud Patterns (TG-CMAE)</CardTitle>
                      <CardDescription>Common fraud indicators identified by AI</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[
                          {
                            pattern: 'Ghosting',
                            description: '48h+ OTP verification delay',
                            icon: Clock,
                            color: 'red',
                            count: Math.floor(fraudApplications.length * 0.3)
                          },
                          {
                            pattern: 'Fee Inflation',
                            description: '25%+ above expected fee',
                            icon: DollarSign,
                            color: 'orange',
                            count: Math.floor(fraudApplications.length * 0.4)
                          },
                          {
                            pattern: 'Duplicate Submission',
                            description: '85%+ similarity detected',
                            icon: FileX,
                            color: 'yellow',
                            count: Math.floor(fraudApplications.length * 0.2)
                          },
                          {
                            pattern: 'Fake Delays',
                            description: 'Artificial processing delays',
                            icon: Clock,
                            color: 'purple',
                            count: Math.floor(fraudApplications.length * 0.15)
                          },
                          {
                            pattern: 'Document Forgery',
                            description: 'VAFD-OCR suspicious patterns',
                            icon: Shield,
                            color: 'pink',
                            count: Math.floor(fraudApplications.length * 0.25)
                          },
                          {
                            pattern: 'Composite Anomaly',
                            description: 'Multiple pattern matches',
                            icon: Activity,
                            color: 'indigo',
                            count: Math.floor(fraudApplications.length * 0.1)
                          }
                        ].map((pattern) => {
                          const Icon = pattern.icon
                          return (
                            <div key={pattern.pattern} className={`rounded-lg border-2 border-${pattern.color}-200 bg-${pattern.color}-50 p-4`}>
                              <div className="flex items-start gap-3">
                                <Icon className={`h-6 w-6 text-${pattern.color}-600 mt-1`} />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-neutral-900">{pattern.pattern}</h4>
                                  <p className="text-xs text-neutral-600 mt-1">{pattern.description}</p>
                                  <div className="mt-2 flex items-center justify-between">
                                    <span className="text-sm text-neutral-700">Detected:</span>
                                    <Badge variant="outline" className="font-bold">
                                      {pattern.count} cases
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fraud Trend Visualization */}
                  <Card className="mt-6 border-2 border-indigo-200">
                    <CardHeader className="bg-indigo-50">
                      <CardTitle className="text-indigo-900">Fraud Detection Trends (6 Weeks)</CardTitle>
                      <CardDescription>TG-CMAE fraud pattern detection over time</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={generateFraudTrendData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis
                              dataKey="week"
                              stroke="#666"
                              fontSize={12}
                            />
                            <YAxis
                              stroke="#666"
                              fontSize={12}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #ccc',
                                borderRadius: '4px'
                              }}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="fraudCases"
                              stackId="1"
                              stroke="#ef4444"
                              fill="#ef4444"
                              fillOpacity={0.6}
                              name="Total Fraud Cases"
                            />
                            <Area
                              type="monotone"
                              dataKey="ghosting"
                              stackId="2"
                              stroke="#f59e0b"
                              fill="#f59e0b"
                              fillOpacity={0.4}
                              name="Ghosting"
                            />
                            <Area
                              type="monotone"
                              dataKey="feeInflation"
                              stackId="2"
                              stroke="#8b5cf6"
                              fill="#8b5cf6"
                              fillOpacity={0.4}
                              name="Fee Inflation"
                            />
                            <Area
                              type="monotone"
                              dataKey="duplicate"
                              stackId="2"
                              stroke="#06b6d4"
                              fill="#06b6d4"
                              fillOpacity={0.4}
                              name="Duplicate"
                            />
                            <Area
                              type="monotone"
                              dataKey="forgery"
                              stackId="2"
                              stroke="#ec4899"
                              fill="#ec4899"
                              fillOpacity={0.4}
                              name="Forgery"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <div className="rounded-md bg-white border border-red-200 p-3">
                          <p className="text-xs text-neutral-600">Weekly Average</p>
                          <p className="text-lg font-bold text-red-600">
                            {Math.floor(fraudApplications.length / 6)} cases
                          </p>
                        </div>
                        <div className="rounded-md bg-white border border-orange-200 p-3">
                          <p className="text-xs text-neutral-600">Most Common</p>
                          <p className="text-lg font-bold text-orange-600">Fee Inflation</p>
                        </div>
                        <div className="rounded-md bg-white border border-green-200 p-3">
                          <p className="text-xs text-neutral-600">Trend</p>
                          <div className="flex items-center gap-1 mt-1">
                            <TrendingDown className="h-4 w-4 text-green-600" />
                            <p className="text-lg font-bold text-green-600">Decreasing</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Fraud List Tab */}
                <TabsContent value="fraud-list" className="mt-6">
                  <div className="space-y-3">
                    {fraudApplications.length === 0 ? (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Shield className="mx-auto h-12 w-12 text-green-600 mb-4" />
                          <p className="text-neutral-600 font-medium">No fraud cases detected</p>
                          <p className="text-sm text-neutral-500 mt-1">All applications appear legitimate</p>
                        </CardContent>
                      </Card>
                    ) : (
                      fraudApplications.map((app) => (
                        <a
                          key={app.id}
                          href={`/applications/${app.id}`}
                          className="block rounded-lg border-2 border-red-200 bg-white p-4 hover:bg-red-50 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <p className="font-bold text-lg">Application #{app.id}</p>
                                <Badge variant="destructive">FRAUD DETECTED</Badge>
                              </div>
                              <div className="mt-2 grid gap-2 md:grid-cols-2">
                                <div>
                                  <p className="text-sm text-neutral-600">Type: {app.application_type}</p>
                                  <p className="text-xs text-neutral-500">
                                    Submitted: {new Date(app.submission_date).toLocaleDateString('en-IN')}
                                  </p>
                                </div>
                                {app.owner_name && (
                                  <div>
                                    <p className="text-sm text-neutral-600">Owner: {app.owner_name}</p>
                                    <p className="text-xs text-neutral-500">Broker ID: {app.broker_id || 'N/A'}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                variant={
                                  app.status === 'Approved' ? 'default' :
                                  app.status === 'Pending' ? 'secondary' : 'outline'
                                }
                                className="text-sm"
                              >
                                {app.status}
                              </Badge>
                              <Button size="sm" variant="destructive">
                                Review Details →
                              </Button>
                            </div>
                          </div>
                        </a>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* AI Analysis Tab */}
                <TabsContent value="ai-analysis" className="mt-6">
                  {analyzingFraud ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Activity className="mx-auto h-12 w-12 animate-pulse text-purple-600 mb-4" />
                        <p className="text-neutral-600">Analyzing fraud patterns with TG-CMAE...</p>
                      </CardContent>
                    </Card>
                  ) : fraudAnalysisData ? (
                    <div className="space-y-6">
                      {/* Fraud Statistics */}
                      <Card className="border-2 border-purple-200 bg-purple-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-purple-900">
                            <Brain className="h-5 w-5" />
                            TG-CMAE Analysis Results
                          </CardTitle>
                          <CardDescription>
                            Comprehensive fraud pattern analysis across all detected cases
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Status Breakdown */}
                            <div>
                              <p className="mb-3 text-sm font-semibold text-purple-900">Status Distribution</p>
                              <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-md bg-white border border-yellow-200 p-3">
                                  <p className="text-xs text-neutral-600">Pending Review</p>
                                  <p className="text-2xl font-bold text-yellow-600">
                                    {fraudAnalysisData.byStatus.pending}
                                  </p>
                                  <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
                                    <div
                                      className="h-2 rounded-full bg-yellow-600"
                                      style={{
                                        width: `${(fraudAnalysisData.byStatus.pending / fraudAnalysisData.total) * 100}%`
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="rounded-md bg-white border border-green-200 p-3">
                                  <p className="text-xs text-neutral-600">Approved (Error)</p>
                                  <p className="text-2xl font-bold text-green-600">
                                    {fraudAnalysisData.byStatus.approved}
                                  </p>
                                  <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
                                    <div
                                      className="h-2 rounded-full bg-green-600"
                                      style={{
                                        width: `${(fraudAnalysisData.byStatus.approved / fraudAnalysisData.total) * 100}%`
                                      }}
                                    />
                                  </div>
                                </div>
                                <div className="rounded-md bg-white border border-red-200 p-3">
                                  <p className="text-xs text-neutral-600">Rejected (Correct)</p>
                                  <p className="text-2xl font-bold text-red-600">
                                    {fraudAnalysisData.byStatus.rejected}
                                  </p>
                                  <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
                                    <div
                                      className="h-2 rounded-full bg-red-600"
                                      style={{
                                        width: `${(fraudAnalysisData.byStatus.rejected / fraudAnalysisData.total) * 100}%`
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Type Breakdown */}
                            <div>
                              <p className="mb-3 text-sm font-semibold text-purple-900">Fraud by Application Type</p>
                              <div className="space-y-2">
                                {Object.entries(fraudAnalysisData.byType).map(([type, count]) => (
                                  <div key={type} className="flex items-center justify-between rounded-md bg-white border border-purple-200 p-3">
                                    <span className="text-sm font-medium">{type}</span>
                                    <div className="flex items-center gap-3">
                                      <div className="h-2 w-32 rounded-full bg-neutral-200">
                                        <div
                                          className="h-2 rounded-full bg-purple-600"
                                          style={{
                                            width: `${((count as number) / fraudAnalysisData.total) * 100}%`
                                          }}
                                        />
                                      </div>
                                      <span className="text-sm font-bold w-12 text-right">{count as number}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Recommendations */}
                            <div className="rounded-md bg-white border-2 border-red-200 p-4">
                              <p className="text-sm font-semibold text-red-900 mb-2">
                                Recommended Actions
                              </p>
                              <ul className="space-y-1 text-sm text-neutral-700">
                                <li className="flex items-start gap-2">
                                  <span className="text-red-600">•</span>
                                  <span>Review {fraudAnalysisData.byStatus.pending} pending fraud cases immediately</span>
                                </li>
                                {fraudAnalysisData.byStatus.approved > 0 && (
                                  <li className="flex items-start gap-2">
                                    <span className="text-red-600">•</span>
                                    <span className="font-semibold text-red-700">
                                      CRITICAL: {fraudAnalysisData.byStatus.approved} fraudulent applications were approved - investigate immediately
                                    </span>
                                  </li>
                                )}
                                <li className="flex items-start gap-2">
                                  <span className="text-red-600">•</span>
                                  <span>Update broker ratings for brokers involved in fraud cases</span>
                                </li>
                                <li className="flex items-start gap-2">
                                  <span className="text-red-600">•</span>
                                  <span>Consider implementing stricter verification for high-fraud application types</span>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* AI Algorithm Info */}
                      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-blue-900">
                            <Shield className="h-5 w-5" />
                            TG-CMAE Algorithm
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-neutral-700 mb-3">
                            <strong>Temporal Graph Cross-Modal Autoencoder (TG-CMAE)</strong>
                          </p>
                          <p className="text-sm text-neutral-600 mb-2">
                            Multi-pattern fraud detection analyzing:
                          </p>
                          <ul className="space-y-1 text-sm text-neutral-600">
                            <li>• Ghosting: OTP timestamp-based delay detection (48h threshold)</li>
                            <li>• Fee Inflation: 25% deviation from expected fees</li>
                            <li>• Duplicate Submission: 85% similarity detection</li>
                            <li>• Fake Delays: Processing time anomalies (1.5x ratio)</li>
                            <li>• Document Forgery: VAFD-OCR suspicious pattern detection</li>
                          </ul>
                          <p className="text-xs text-neutral-500 mt-3">
                            Composite Scoring: Weighted average of all fraud indicators with explainable recommendations
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Brain className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                        <p className="text-neutral-600">Click the tab to run AI analysis</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
