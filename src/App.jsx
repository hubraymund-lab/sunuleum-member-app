// Created: 2026-03-18
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth';

// Guards
import AuthGuard from './components/guards/AuthGuard';
import AdminGuard from './components/guards/AdminGuard';

// Layouts
import MemberLayout from './components/layout/MemberLayout';
import AdminLayout from './components/layout/AdminLayout';

// Auth pages
import Login from './pages/auth/Login';
import Callback from './pages/auth/Callback';
import CompleteProfile from './pages/auth/CompleteProfile';

// Member pages
import Home from './pages/member/Home';
import Profile from './pages/member/Profile';
import Children from './pages/member/Children';
import Programs from './pages/member/Programs';
import MyEnrollments from './pages/member/MyEnrollments';
import MyAttendance from './pages/member/MyAttendance';
import MyFees from './pages/member/MyFees';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminMembers from './pages/admin/Members';
import AdminAttendance from './pages/admin/Attendance';
import AdminFees from './pages/admin/Fees';
import AdminPrograms from './pages/admin/Programs';
import AdminFacilities from './pages/admin/Facilities';
import AdminRentals from './pages/admin/Rentals';

// Public pages
import RentalRequest from './pages/public/RentalRequest';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<Callback />} />
            <Route path="/rental-request" element={<RentalRequest />} />

            {/* Auth required - profile completion */}
            <Route path="/auth/complete-profile" element={<CompleteProfile />} />

            {/* Member routes (authenticated) */}
            <Route element={<AuthGuard />}>
              <Route element={<MemberLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/children" element={<Children />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/my/enrollments" element={<MyEnrollments />} />
                <Route path="/my/attendance" element={<MyAttendance />} />
                <Route path="/my/fees" element={<MyFees />} />
              </Route>

              {/* Admin routes (authenticated + admin role) */}
              <Route element={<AdminGuard />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/members" element={<AdminMembers />} />
                  <Route path="/admin/attendance" element={<AdminAttendance />} />
                  <Route path="/admin/fees" element={<AdminFees />} />
                  <Route path="/admin/programs" element={<AdminPrograms />} />
                  <Route path="/admin/facilities" element={<AdminFacilities />} />
                  <Route path="/admin/rentals" element={<AdminRentals />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
