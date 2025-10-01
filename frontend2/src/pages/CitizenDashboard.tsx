import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Link } from 'react-router-dom';

const CitizenDashboard = () => {
  const { citizen, applications, brokers, isLoading, error, fetchApplications, fetchBrokers, createApplication } = useStore();
  const [showNewAppForm, setShowNewAppForm] = useState(false);
  const [newApp, setNewApp] = useState({
    citizen_id: 1, // For demo, use 1
    broker_id: 1,
    application_type: 'New Registration',
    documents: 'aadhaar,pan'
  });

  useEffect(() => {
    fetchApplications();
    fetchBrokers();
  }, [fetchApplications, fetchBrokers]);

  const handleCreateApplication = async () => {
    await createApplication(newApp);
    setShowNewAppForm(false);
    setNewApp({ citizen_id: 1, broker_id: 1, application_type: 'New Registration', documents: 'aadhaar,pan' });
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="glass rounded-full p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
      <div className="glass rounded-2xl p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-semibold mb-2">Error</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Citizen Dashboard
            </h1>
            <p className="text-gray-600 mt-3 text-lg">Manage your RTO applications and connect with brokers</p>
          </div>
          <button
            onClick={() => setShowNewAppForm(!showNewAppForm)}
            className="glass text-white px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-500 to-blue-600"
          >
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Application
            </span>
          </button>
        </div>

        {/* New Application Form */}
        {showNewAppForm && (
          <div className="glass rounded-2xl p-10 mb-12 animate-in fade-in-50 duration-300">
            <h2 className="text-2xl font-semibold mb-8 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Create New Application
            </h2>
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Broker</label>
                <select
                  value={newApp.broker_id}
                  onChange={(e) => setNewApp({ ...newApp, broker_id: parseInt(e.target.value) })}
                  className="w-full p-4 glass rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                >
                  {brokers.map((broker) => (
                    <option key={broker.id} value={broker.id}>{broker.name} - {broker.specialization}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Application Type</label>
                <select
                  value={newApp.application_type}
                  onChange={(e) => setNewApp({ ...newApp, application_type: e.target.value })}
                  className="w-full p-4 glass rounded-lg border border-white/20 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                >
                  <option>New Registration</option>
                  <option>Renewal</option>
                  <option>Transfer</option>
                </select>
              </div>
            </div>
            <div className="flex gap-6 justify-center">
              <button
                onClick={handleCreateApplication}
                className="glass text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-green-500 to-green-600"
              >
                Submit Application
              </button>
              <button
                onClick={() => setShowNewAppForm(false)}
                className="glass text-gray-700 px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-gray-500 to-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Applications */}
          <div className="glass rounded-2xl p-10">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3 md:mr-4">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Your Applications</h2>
            </div>
            {applications.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="glass-dark rounded-lg p-4 hover:scale-105 transition-all duration-300">
                    <h3 className="font-semibold text-gray-800">{app.application_type}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Status: <span className={`font-medium ${
                        app.status === 'Approved' ? 'text-green-600' : 
                        app.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600'
                      }`}>{app.status}</span>
                    </p>
                    <p className="text-sm text-gray-500">Submitted: {new Date(app.submission_date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">📋</div>
                <p className="text-gray-600">No applications yet. Create your first application!</p>
              </div>
            )}
          </div>

          {/* Top Brokers */}
          <div className="glass rounded-2xl p-10">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3 md:mr-4">
                <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Top Brokers</h2>
            </div>
            {brokers.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {brokers.slice(0, 5).map((broker) => (
                  <div key={broker.id} className="glass-dark rounded-lg p-4 hover:scale-105 transition-all duration-300">
                    <h3 className="font-semibold text-gray-800">{broker.name}</h3>
                    <p className="text-sm text-gray-600">Specialization: {broker.specialization}</p>
                    <div className="flex items-center mt-2">
                      <div className="flex text-yellow-400 mr-2">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4" fill={i < Math.round(broker.avg_overall) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{broker.avg_overall.toFixed(1)}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">👥</div>
                <p className="text-gray-600">Loading brokers...</p>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/brokers"
            className="glass text-white px-10 py-5 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-r from-purple-500 to-purple-600"
          >
            <span className="flex items-center justify-center">
              Browse All Brokers
              <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
