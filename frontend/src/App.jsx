import { Route, Routes } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import { GuestRoute, AdminRoute, GuideRoute, ProtectedRoute } from './components/ProtectedRoute'

// Public Pages
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'

// Auth Pages - Unified
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'

// Protected Pages
import ItineraryBuilderPage from './pages/ItineraryBuilderPage'
import ProfilePage from './pages/ProfilePage'
import BookingPage from './pages/BookingPage'

// Admin Dashboard
import AdminDashboard from './pages/admin/AdminDashboard'

// Guide Dashboard
import GuideDashboard from './pages/guide/GuideDashboard'


const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <div className="relative min-h-screen bg-white">
          <Routes>
          {/* Public Landing Page with Map */}
          <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />

          {/* Protected Routes - Require Login */}
          <Route path="/dashboard" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/itinerary" element={<ProtectedRoute><ItineraryBuilderPage /></ProtectedRoute>} />
          <Route path="/itinerary/:id" element={<ProtectedRoute><ItineraryBuilderPage /></ProtectedRoute>} />
          <Route path="/book/:itineraryId" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

          {/* Unified Auth Routes */}
          <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Guide Dashboard (requires approved guide in guide mode) */}
          <Route path="/guide/dashboard" element={<GuideRoute><GuideDashboard /></GuideRoute>} />

          {/* Admin Routes */}
          {/* <Route path="/admin/login" element={<GuestRoute><AdminLoginPage /></GuestRoute>} /> */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          </Routes>
        </div>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;