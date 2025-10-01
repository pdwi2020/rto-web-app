import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
  application_type: z.string().min(1, 'Application type is required'),
  broker_id: z.number().min(1, 'Broker selection is required'),
  documents: z.string().min(1, 'Documents are required'),
});

type FormData = z.infer<typeof schema>;

const NewApplication = () => {
  const { brokers, createApplication, isLoading, error } = useStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (brokers.length === 0) {
      // Fetch brokers if not loaded
    }
  }, [brokers]);

  const onSubmit = async (data: FormData) => {
    await createApplication({
      citizen_id: 1, // For demo
      broker_id: data.broker_id,
      application_type: data.application_type,
      documents: data.documents,
    });
    reset();
    navigate('/citizen');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="backdrop-blur-lg bg-white/30 rounded-2xl border border-white/40 p-8">
          <h1 className="text-3xl font-bold mb-6 text-gray-800">New Application</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Type
              </label>
              <select
                {...register('application_type')}
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select type</option>
                <option value="New Registration">New Registration</option>
                <option value="Renewal">Renewal</option>
                <option value="Transfer">Transfer</option>
              </select>
              {errors.application_type && (
                <p className="text-red-500 text-sm mt-1">{errors.application_type.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Broker
              </label>
              <select
                {...register('broker_id', { valueAsNumber: true })}
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select broker</option>
                {brokers.map((broker) => (
                  <option key={broker.id} value={broker.id}>
                    {broker.name} - {broker.specialization} (Rating: {broker.avg_overall.toFixed(1)})
                  </option>
                ))}
              </select>
              {errors.broker_id && (
                <p className="text-red-500 text-sm mt-1">{errors.broker_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Documents
              </label>
              <textarea
                {...register('documents')}
                rows={4}
                placeholder="List required documents (e.g., Aadhaar, PAN, etc.)"
                className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {errors.documents && (
                <p className="text-red-500 text-sm mt-1">{errors.documents.message}</p>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewApplication;
