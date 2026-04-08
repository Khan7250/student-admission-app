import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './pages/DashboardHome';
import NewStudent from './pages/NewStudent';
import FollowUps from './pages/FollowUps';
import Search from './pages/Search';
import Enrollment from './pages/Enrollment';
import Reports from './pages/Reports';
import AdminPanel from './pages/AdminPanel';
import ViewStudents from './pages/ViewStudents';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// App Routes
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Navigate to="/dashboard" />
        </ProtectedRoute>
      } />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardHome />} />
        <Route path="new-student" element={<NewStudent />} />
        <Route path="follow-ups" element={<FollowUps />} />
        <Route path="students" element={<ViewStudents />} />
        <Route path="search" element={<Search />} />
        <Route path="enrollment" element={<Enrollment type="enroll" />} />
        <Route path="re-enrollment" element={<Enrollment type="reenroll" />} />
        <Route path="reports" element={<Reports />} />
        <Route path="admin" element={<AdminPanel />} />
        {/* Child routes will go here */}
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
