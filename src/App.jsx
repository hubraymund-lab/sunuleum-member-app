// Created: 2026-03-18
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth';
import { BranchProvider } from './lib/branch';

// Guards
import AuthGuard from './components/guards/AuthGuard';
import BranchGuard from './components/guards/BranchGuard';
import BranchAdminGuard from './components/guards/BranchAdminGuard';
import SuperAdminGuard from './components/guards/SuperAdminGuard';

// Layouts
import MemberLayout from './components/layout/MemberLayout';
import AdminLayout from './components/layout/AdminLayout';
import SuperAdminLayout from './components/layout/SuperAdminLayout';

// Utility components
import RootRedirect from './components/RootRedirect';

// Auth pages
import Login from './pages/auth/Login';
import Callback from './pages/auth/Callback';
import CompleteProfile from './pages/auth/CompleteProfile';

// Branch selection
import BranchSelect from './pages/BranchSelect';

// Member pages
import Home from './pages/member/Home';
import Profile from './pages/member/Profile';
import Children from './pages/member/Children';
import Programs from './pages/member/Programs';
import MyEnrollments from './pages/member/MyEnrollments';
import MyAttendance from './pages/member/MyAttendance';
import MyFees from './pages/member/MyFees';
import Toys from './pages/member/Toys';
import MyToyRentals from './pages/member/MyToyRentals';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminMembers from './pages/admin/Members';
import AdminAttendance from './pages/admin/Attendance';
import AdminFees from './pages/admin/Fees';
import AdminPrograms from './pages/admin/Programs';
import AdminFacilities from './pages/admin/Facilities';
import AdminRentals from './pages/admin/Rentals';
import AdminToys from './pages/admin/Toys';
import AdminToyRentals from './pages/admin/ToyRentals';

// Super Admin pages
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import SuperAdminBranches from './pages/super-admin/Branches';

// Public pages
import RentalRequest from './pages/public/RentalRequest';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BranchProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/callback" element={<Callback />} />
              <Route path="/rental-request" element={<RentalRequest />} />
              <Route path="/auth/complete-profile" element={<CompleteProfile />} />

              {/* Authenticated routes */}
              <Route element={<AuthGuard />}>
                {/* Root redirect */}
                <Route path="/" element={<RootRedirect />} />

                {/* Branch selection */}
                <Route path="/select-branch" element={<BranchSelect />} />

                {/* Super Admin routes */}
                <Route element={<SuperAdminGuard />}>
                  <Route element={<SuperAdminLayout />}>
                    <Route path="/super-admin" element={<SuperAdminDashboard />} />
                    <Route path="/super-admin/branches" element={<SuperAdminBranches />} />
                  </Route>
                </Route>

                {/* Branch-scoped routes */}
                <Route path="/branch/:branchId" element={<BranchGuard />}>
                  <Route element={<MemberLayout />}>
                    <Route index element={<Home />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="children" element={<Children />} />
                    <Route path="programs" element={<Programs />} />
                    <Route path="toys" element={<Toys />} />
                    <Route path="my/enrollments" element={<MyEnrollments />} />
                    <Route path="my/attendance" element={<MyAttendance />} />
                    <Route path="my/fees" element={<MyFees />} />
                    <Route path="my/toys" element={<MyToyRentals />} />
                  </Route>

                  {/* Branch admin routes */}
                  <Route element={<BranchAdminGuard />}>
                    <Route element={<AdminLayout />}>
                      <Route path="admin" element={<AdminDashboard />} />
                      <Route path="admin/members" element={<AdminMembers />} />
                      <Route path="admin/attendance" element={<AdminAttendance />} />
                      <Route path="admin/fees" element={<AdminFees />} />
                      <Route path="admin/programs" element={<AdminPrograms />} />
                      <Route path="admin/facilities" element={<AdminFacilities />} />
                      <Route path="admin/rentals" element={<AdminRentals />} />
                      <Route path="admin/toys" element={<AdminToys />} />
                      <Route path="admin/toy-rentals" element={<AdminToyRentals />} />
                    </Route>
                  </Route>
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </BranchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
