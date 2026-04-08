import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, AlertCircle } from 'lucide-react';

export default function NewStudent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [options, setOptions] = useState({ courses: [], sources: [] });

  const [formData, setFormData] = useState({
    source_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    name: '',
    education: '',
    city: '',
    summary: '',
    status: 'Open',
    next_followup_date: '',
    followup_remarks: '',
  });

  const [phones, setPhones] = useState(['']);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [followUpDays, setFollowUpDays] = useState(0);

  useEffect(() => {
    // Fetch options
    const fetchOptions = async () => {
      try {
        const { data } = await axios.get('/students/options');
        setOptions(data);
      } catch (err) {
        console.error("Failed to load options");
      }
    };
    fetchOptions();
  }, []);

  // Update follow-up date when days change
  useEffect(() => {
    if (followUpDays > 0) {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(followUpDays));
      setFormData(prev => ({ ...prev, next_followup_date: date.toISOString().split('T')[0] }));
    } else {
      setFormData(prev => ({ ...prev, next_followup_date: '' }));
    }
  }, [followUpDays]);

  const handlePhoneChange = (index, value) => {
    const newPhones = [...phones];
    newPhones[index] = value;
    setPhones(newPhones);
  };

  const addPhone = () => setPhones([...phones, '']);
  const removePhone = (index) => {
    if (phones.length > 1) {
      const newPhones = phones.filter((_, i) => i !== index);
      setPhones(newPhones);
    }
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
    setLoading(true);

    const payload = {
      ...formData,
      cell_numbers: phones.filter(p => p.trim() !== ''),
      interested_courses: selectedCourses,
      source_id: formData.source_id ? parseInt(formData.source_id) : null,
    };

    try {
      const { data } = await axios.post('/students', payload);
      setSuccess('Student inquiry saved successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      if (err.response?.status === 409) {
        setError(err.response.data.error + ': ' + err.response.data.details.map(d => d.phone_number).join(', '));
      } else {
        setError('An error occurred while saving the record.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Student Inquiry</h1>
        <p className="text-sm text-gray-500 mt-1">Fill out the details below to log a new inquiry or lead.</p>
      </div>

      <div className="card p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <span className="text-sm font-medium text-red-800">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-800">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Column 1 */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Optional Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone Numbers</label>
                {phones.map((phone, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="tel"
                      className="input-field bg-white"
                      value={phone}
                      onChange={(e) => handlePhoneChange(idx, e.target.value)}
                      placeholder="+1234567890"
                      required={idx === 0}
                    />
                    {phones.length > 1 && (
                      <button type="button" onClick={() => removePhone(idx)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addPhone} className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1">
                  <Plus size={16} /> Add Another Number
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="City Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">In Coming Source</label>
                <select
                  className="input-field bg-white"
                  value={formData.source_id}
                  onChange={(e) => setFormData({...formData, source_id: e.target.value})}
                >
                  <option value="">-- Select Source --</option>
                  {options.sources.map(src => (
                    <option key={src.id} value={src.id}>{src.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.education}
                  onChange={(e) => setFormData({...formData, education: e.target.value})}
                  placeholder="Highest Qualification"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Interested Courses</label>
                <div className="border border-gray-200 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-gray-50">
                  {options.courses.length === 0 ? <p className="text-sm text-gray-500 text-center py-2">No courses available.</p> : null}
                  {options.courses.map(course => (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="input-field bg-white"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Open">Open</option>
                  <option value="Pending">Pending</option>
                  <option value="Enrolled">Enrolled</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Follow-up & Summary Section */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Summary / Notes</label>
              <textarea
                rows="3"
                className="input-field"
                value={formData.summary}
                onChange={(e) => setFormData({...formData, summary: e.target.value})}
                placeholder="Initial inquiry details or background notes..."
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up IN (Days)</label>
                <input
                  type="number"
                  className="input-field bg-white"
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(e.target.value)}
                  min="0"
                  placeholder="e.g. 3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  className="input-field bg-white"
                  value={formData.next_followup_date}
                  onChange={(e) => setFormData({...formData, next_followup_date: e.target.value})}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Remarks</label>
                <input
                  type="text"
                  className="input-field bg-white"
                  value={formData.followup_remarks}
                  onChange={(e) => setFormData({...formData, followup_remarks: e.target.value})}
                  placeholder="What to discuss next..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary sm:w-auto px-8"
            >
              {loading ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Inquiry
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
