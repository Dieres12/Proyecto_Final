// src/App.jsx - Main App with routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import ParentsPage from './pages/ParentsPage';
import DriversPage from './pages/DriversPage';
import BusesPage from './pages/BusesPage';
import RoutesPage from './pages/RoutesPage';
import PaymentsPage from './pages/PaymentsPage';
import AttendancePage from './pages/AttendancePage';
import GPSTrackingPage from './pages/GPSTrackingPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '10px'
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#f1f5f9' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' } }
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="parents" element={
              <ProtectedRoute adminOnly>
                <ParentsPage />
              </ProtectedRoute>
            } />
            <Route path="drivers" element={
              <ProtectedRoute adminOnly>
                <DriversPage />
              </ProtectedRoute>
            } />
            <Route path="buses" element={
              <ProtectedRoute adminOnly>
                <BusesPage />
              </ProtectedRoute>
            } />
            <Route path="routes" element={
              <ProtectedRoute adminOnly>
                <RoutesPage />
              </ProtectedRoute>
            } />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="tracking" element={<GPSTrackingPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
