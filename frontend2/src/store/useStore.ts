import { create } from 'zustand';
import api from '../lib/api';

interface Citizen {
  id: number;
  name: string;
  aadhaar: string;
  phone: string;
  email: string;
  address: string;
}

interface Broker {
  id: number;
  name: string;
  license_number: string;
  phone: string;
  email: string;
  specialization: string;
  avg_punctuality: number;
  avg_quality: number;
  avg_compliance: number;
  avg_communication: number;
  avg_overall: number;
}

interface Application {
  id: number;
  citizen_id: number;
  broker_id: number;
  application_type: string;
  status: string;
  submission_date: string;
  documents: string;
  is_fraud?: boolean;
}

interface Analytics {
  total_citizens: number;
  total_brokers: number;
  total_applications: number;
  approved_applications: number;
}

interface Store {
  citizen: Citizen | null;
  brokers: Broker[];
  applications: Application[];
  analytics: Analytics | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCitizen: (citizen: Citizen) => void;
  setBrokers: (brokers: Broker[]) => void;
  setApplications: (applications: Application[]) => void;
  setAnalytics: (analytics: Analytics) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // API actions
  fetchBrokers: () => Promise<void>;
  fetchApplications: () => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  createApplication: (appData: Omit<Application, 'id' | 'submission_date'>) => Promise<void>;
  createCitizen: (citizenData: Omit<Citizen, 'id'>) => Promise<void>;
}

export const useStore = create<Store>((set, get) => ({
  citizen: null,
  brokers: [],
  applications: [],
  analytics: null,
  isLoading: false,
  error: null,

  setCitizen: (citizen) => set({ citizen }),
  setBrokers: (brokers) => set({ brokers }),
  setApplications: (applications) => set({ applications }),
  setAnalytics: (analytics) => set({ analytics }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  fetchBrokers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/brokers/');
      set({ brokers: response.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchApplications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/applications/');
      set({ applications: response.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAnalytics: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/analytics/');
      set({ analytics: response.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  createApplication: async (appData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/applications/', appData);
      set((state) => ({ applications: [...state.applications, response.data] }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },

  createCitizen: async (citizenData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/citizens/', citizenData);
      set({ citizen: response.data });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      set({ isLoading: false });
    }
  },
}));
