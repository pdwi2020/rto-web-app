import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

const BrokerList = () => {
  const { brokers, fetchBrokers, isLoading, error } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [sortBy, setSortBy] = useState('overall');

  useEffect(() => {
    fetchBrokers();
  }, [fetchBrokers]);

  const filteredBrokers = brokers
    .filter(broker =>
      broker.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (specializationFilter === '' || broker.specialization === specializationFilter)
    )
    .sort((a, b) => {
      if (sortBy === 'overall') return b.avg_overall - a.avg_overall;
      if (sortBy === 'punctuality') return b.avg_punctuality - a.avg_punctuality;
      if (sortBy === 'quality') return b.avg_quality - a.avg_quality;
      return 0;
    });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Broker Directory</h1>

        <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-8 mb-8">
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search brokers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Specializations</option>
              <option value="Vehicle Registration">Vehicle Registration</option>
              <option value="License Renewal">License Renewal</option>
              <option value="Transfer of Ownership">Transfer of Ownership</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
            >
              <option value="overall">Sort by Overall Rating</option>
              <option value="punctuality">Sort by Punctuality</option>
              <option value="quality">Sort by Quality</option>
            </select>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrokers.map((broker) => (
              <div key={broker.id} className="backdrop-blur-lg bg-white/20 rounded-2xl border border-white/40 p-6 hover:bg-white/30 transition-all duration-300">
                <h3 className="text-xl font-semibold mb-2">{broker.name}</h3>
                <p className="text-gray-600 mb-2">{broker.specialization}</p>
                <p className="text-sm text-gray-500 mb-4">{broker.email} | {broker.phone}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span>Overall:</span>
                    <span className="font-semibold">{broker.avg_overall.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Punctuality:</span>
                    <span className="font-semibold">{broker.avg_punctuality.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quality:</span>
                    <span className="font-semibold">{broker.avg_quality.toFixed(1)}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Compliance:</span>
                    <span className="font-semibold">{broker.avg_compliance.toFixed(1)}/5</span>
                  </div>
                </div>

                <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300">
                  Contact Broker
                </button>
              </div>
            ))}
          </div>

          {filteredBrokers.length === 0 && (
            <p className="text-center text-gray-600 mt-8">No brokers found matching your criteria.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrokerList;
