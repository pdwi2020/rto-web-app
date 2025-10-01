import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTheme } from './store/useTheme';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import CitizenDashboard from './pages/CitizenDashboard';
import BrokerDashboard from './pages/BrokerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NewApplication from './pages/NewApplication';
import BrokerList from './pages/BrokerList';

function App() {
  const { isDark } = useTheme();

  return (
    <div className={`App ${isDark ? 'dark' : 'light'}`}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/broker" element={<BrokerDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/new-application" element={<NewApplication />} />
          <Route path="/brokers" element={<BrokerList />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </div>
  );
}

export default App;
