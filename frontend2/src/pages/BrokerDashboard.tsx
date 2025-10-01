import React, { useEffect } from 'react';
import { useStore } from '../store/useStore';

const BrokerDashboard = () => {
  const { applications, brokers, isLoading, error, fetchApplications, fetchBrokers } = useStore();

  useEffect(() => {
    fetchApplications();
    fetchBrokers();
  }, [fetchApplications, fetchBrokers]);

  // For demo, assume broker id 1
  const brokerApplications = applications.filter(app => app.broker_id === 1);
  const broker = brokers.find(b => b.id === 1);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Broker Dashboard</h1>

        {broker && (
          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Profile</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium">{broker.name}</h3>
                <p>License: {broker.license_number}</p>
                <p>Specialization: {broker.specialization}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Your Ratings</h3>
                <p>Punctuality: {broker.avg_punctuality.toFixed(1)}/5</p>
                <p>Quality: {broker.avg_quality.toFixed(1)}/5</p>
                <p>Compliance: {broker.avg_compliance.toFixed(1)}/5</p>
                <p>Communication: {broker.avg_communication.toFixed(1)}/5</p>
                <p>Overall: {broker.avg_overall.toFixed(1)}/5</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-8">
            <h2 className="text-2xl font-semibold mb-4">Your Applications</h2>
            {brokerApplications.length > 0 ? (
              <div className="space-y-4">
                {brokerApplications.slice(0, 5).map((app) => (
                  <div key={app.id} className="p-4 bg-white/20 rounded-lg">
                    <h3 className="font-semibold">{app.application_type}</h3>
                    <p>Status: <span className={`font-medium ${app.status === 'Approved' ? 'text-green-600' : app.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'}`}>{app.status}</span></p>
                    <p>Submitted: {new Date(app.submission_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No applications assigned yet.</p>
            )}
          </div>

          <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-8">
            <h2 className="text-2xl font-semibold mb-4">Performance Metrics</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Applications:</span>
                <span className="font-semibold">{brokerApplications.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Approved:</span>
                <span className="font-semibold text-green-600">{brokerApplications.filter(app => app.status === 'Approved').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending:</span>
                <span className="font-semibold text-yellow-600">{brokerApplications.filter(app => app.status === 'Pending').length}</span>
              </div>
              <div className="flex justify-between">
                <span>Rejected:</span>
                <span className="font-semibold text-red-600">{brokerApplications.filter(app => app.status === 'Rejected').length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerDashboard;
