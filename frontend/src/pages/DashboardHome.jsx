import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { UserPlus, Calendar, Phone, BookOpen, AlertCircle, PhoneCall } from 'lucide-react';

export default function DashboardHome() {
  const [data, setData] = useState({ followUps: [], counts: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/students/dashboard');
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { followUps, counts } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Welcome back! Here's what's happening today.</p>
        </div>
        <Link 
          to="/dashboard/new-student" 
          className="btn-primary sm:w-auto inline-flex items-center gap-2"
        >
          <UserPlus size={18} />
          <span>New Inquiry</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-l-yellow-400">
          <p className="text-sm font-medium text-gray-500">Open Inquiries</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{counts.open_count || 0}</p>
        </div>
        <div className="card p-5 border-l-4 border-l-blue-400">
          <p className="text-sm font-medium text-gray-500">Pending</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{counts.pending_count || 0}</p>
        </div>
        <div className="card p-5 border-l-4 border-l-green-500">
          <p className="text-sm font-medium text-gray-500">Enrolled</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{counts.enrolled_count || 0}</p>
        </div>
      </div>

      {/* Follow-up Reminders */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertCircle className="text-orange-500" size={20} />
            Follow-ups Due Today
            <span className="bg-orange-100 text-orange-700 py-0.5 px-2.5 rounded-full text-xs font-bold ml-2">
              {followUps.length}
            </span>
          </h2>
        </div>
        
        {followUps.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
             <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
             <p>No follow-ups due today.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {followUps.map((student) => (
              <div key={student.id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-1 sm:w-2/3">
                    <h3 className="font-semibold text-gray-900 text-lg">{student.name || 'Unnamed Student'}</h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      {student.education && (
                        <div className="flex items-center gap-1.5 pt-1">
                          <BookOpen size={16} className="text-gray-400 shrink-0" />
                          <span className="line-clamp-1">{student.education}</span>
                        </div>
                      )}
                      
                      {student.courses && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {student.courses.split(',').slice(0, 2).map((course, idx) => (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {course}
                            </span>
                          ))}
                          {student.courses.split(',').length > 2 && (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                               +{student.courses.split(',').length - 2} more
                             </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="sm:text-right flex flex-col items-start sm:items-end gap-2 shrink-0">
                    {student.phone_numbers && student.phone_numbers.split(',').map((phone, idx) => (
                      <a 
                        key={idx}
                        href={`tel:${phone.trim()}`} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium text-sm transition-colors border border-green-200"
                      >
                        <PhoneCall size={14} />
                        {phone.trim()}
                      </a>
                    ))}
                    {student.phone_numbers && student.phone_numbers.split(',').length > 0 && (
                      <a 
                         href={`https://wa.me/${student.phone_numbers.split(',')[0].replace(/\D/g, '')}`} 
                         target="_blank" 
                         rel="noreferrer"
                         className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 font-medium text-sm transition-colors shadow-sm"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
