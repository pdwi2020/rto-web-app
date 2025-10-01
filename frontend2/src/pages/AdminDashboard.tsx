import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminDashboard = () => {
  const { analytics, applications, brokers, isLoading, error, fetchAnalytics, fetchApplications, fetchBrokers } = useStore();

  useEffect(() => {
    fetchAnalytics();
    fetchApplications();
    fetchBrokers();
  }, [fetchAnalytics, fetchApplications, fetchBrokers]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;

  // Prepare data for charts
  const barData = analytics ? [
    { name: 'Citizens', value: analytics.total_citizens },
    { name: 'Brokers', value: analytics.total_brokers },
    { name: 'Applications', value: analytics.total_applications },
    { name: 'Approved', value: analytics.approved_applications },
  ] : [];

  const statusData = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusData).map(([status, count]) => ({ name: status, value: count }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>

        {analytics && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-6 text-center">
              <h2 className="text-2xl font-bold text-blue-600">{analytics.total_citizens}</h2>
              <p className="text-gray-600">Total Citizens</p>
            </div>
            <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-6 text-center">
              <h2 className="text-2xl font-bold text-green-600">{analytics.total_brokers}</h2>
              <p className="text-gray-600">Total Brokers</p>
            </div>
            <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-6 text-center">
              <h2 className="text-2xl font-bold text-purple-600">{analytics.total_applications}</h2>
              <p className="text-gray-600">Total Applications</p>
            </div>
            <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-6 text-center">
              <h2 className="text-2xl font-bold text-orange-600">{analytics.approved_applications}</h2>
              <p className="text-gray-600">Approved Applications</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-8">
            <h2 className="text-2xl font-semibold mb-4">Platform Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-8">
            <h2 className="text-2xl font-semibold mb-4">Application Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-8">
          <h2 className="text-2xl font-semibold mb-4">Top Performing Brokers</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {brokers.slice(0, 6).map((broker) => (
              <div key={broker.id} className="p-4 bg-white/20 rounded-lg">
                <h3 className="font-semibold">{broker.name}</h3>
                <p>Rating: {broker.avg_overall.toFixed(1)}/5</p>
                <p>Applications: {applications.filter(app => app.broker_id === broker.id).length}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
