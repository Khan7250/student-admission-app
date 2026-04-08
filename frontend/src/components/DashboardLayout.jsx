import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, DefaultIcon, Users, UserPlus, 
  CalendarCheck, Clock, Search, BarChart3, 
  Settings, LogOut, GraduationCap 
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard Home', href: '/dashboard', icon: BarChart3, end: true },
    { name: 'New Student', href: '/dashboard/new-student', icon: UserPlus },
    { name: 'Follow Ups', href: '/dashboard/follow-ups', icon: Clock },
    { name: 'View Students', href: '/dashboard/students', icon: Users },
    { name: 'Enrollment', href: '/dashboard/enrollment', icon: CalendarCheck },
    { name: 'Re-enrollment', href: '/dashboard/re-enrollment', icon: CalendarCheck },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { name: 'Search Student', href: '/dashboard/search', icon: Search },
  ];

  if (user?.role === 'Admin') {
    navigation.push({ name: 'Admin Panel', href: '/dashboard/admin', icon: Settings });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <GraduationCap className="h-8 w-8 text-primary-600 mr-3" />
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-700 to-primary-500">
          Admissions Hub
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-3 space-y-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.end}
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => `
                group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                ${isActive 
                  ? 'bg-primary-50 text-primary-700' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                }
              `}
            >
              <item.icon className="flex-shrink-0 mr-3 h-5 w-5 opacity-80 group-hover:opacity-100 transition-opacity" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4 px-3 py-2 bg-gray-50 rounded-lg">
          <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase">
             {user?.username?.[0] || 'U'}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">{user?.username || 'User'}</p>
            <p className="text-xs text-gray-500">{user?.role || 'Staff'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-10 shadow-sm">
        <SidebarContent />
      </div>

      {/* Mobile Header & Overlay */}
      <div className="md:hidden flex flex-col w-full z-20 absolute">
        <div className="flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4 sticky top-0 w-full shadow-sm z-30">
          <div className="flex items-center">
             <GraduationCap className="h-6 w-6 text-primary-600 mr-2" />
             <span className="font-bold text-gray-800">Admissions Portal</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-500 hover:text-gray-900 focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Sidebar overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white animate-slide-right">
              <SidebarContent />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 w-full min-h-screen">
        <main className="flex-1 relative overflow-y-auto focus:outline-none pt-16 md:pt-0 p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
