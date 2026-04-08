import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search as SearchIcon, CheckCircle, AlertCircle } from 'lucide-react';

export default function Enrollment({ type = 'enroll' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const title = type === 'enroll' ? 'Enrollment' : 'Re-enrollment';
  const apiEndpoint = type === 'enroll' ? 'enroll' : 'reenroll';

  useEffect(() => {
    // Reset state on type change
    setSearchTerm('');
    setSearchResults([]);
    setSelectedStudent(null);
    setSelectedCourses([]);
    setSuccess('');
    setError('');
  }, [type]);

  useEffect(() => {
    // Fetch courses
    axios.get('/students/options').then(({ data }) => {
      setCourses(data.courses);
    }).catch(console.error);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setLoading(true);
    setSelectedStudent(null);
    try {
      const { data } = await axios.get(`/students/search?term=${encodeURIComponent(searchTerm)}`);
      // Filter logic? If enrolling, maybe they shouldn't already be enrolled in the target course.
      // We rely on backend or common sense.
      setSearchResults(data);
    } catch (err) {
      console.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    setSearchResults([]);
  };

  const toggleCourse = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedStudent) return setError('Please select a student first.');
    if (selectedCourses.length === 0) return setError('Please select at least one course.');

    setLoading(true);
    try {
      const payload = {
        course_ids: selectedCourses,
      };
      if (type === 'enroll') payload.enrollment_date = enrollmentDate;
      else payload.reenrollment_date = enrollmentDate;

      await axios.post(`/students/${selectedStudent.id}/${apiEndpoint}`, payload);
      
      setSuccess(`${title} successful for ${selectedStudent.name}`);
      setSelectedStudent(null);
      setSelectedCourses([]);
      setSearchTerm('');
    } catch (err) {
      setError(err.response?.data?.error || `Failed to process ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title} Portal</h1>
        <p className="text-sm text-gray-500 mt-1">Search for a student and convert inquiry to enrollment.</p>
      </div>

      {!selectedStudent && (
        <div className="card p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Search student by name, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary sm:w-auto px-8">
              Search
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-4 border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {searchResults.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => handleSelectStudent(s)}
                  className="p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                >
                  <div>
                    <h4 className="font-semibold text-gray-900">{s.name || 'Unnamed'}</h4>
                    <p className="text-xs text-gray-500">{s.phone_numbers} • {s.city}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${s.status === 'Enrolled' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedStudent && (
        <div className="card p-6 border border-primary-100">
          <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Confirm {title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                Student: <span className="font-semibold text-primary-700">{selectedStudent.name || 'Unnamed'}</span>
              </p>
              <p className="text-sm text-gray-500">Contact: {selectedStudent.phone_numbers}</p>
            </div>
            <button onClick={() => setSelectedStudent(null)} className="text-sm text-gray-500 hover:text-gray-900 underline">
              Change Student
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-red-800">{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <span className="text-sm font-medium text-green-800">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="input-field max-w-sm"
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Courses</label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                  {courses.map(course => (
                    <label key={course.id} className="flex items-center space-x-3 p-1">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={() => toggleCourse(course.id)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-800 font-medium">{course.course_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary sm:w-auto px-8"
              >
                {loading ? 'Processing...' : `Submit ${title}`}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
