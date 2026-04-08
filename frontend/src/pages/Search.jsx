import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search as SearchIcon, PhoneCall, BookOpen, User, MapPin, FileEdit, X, AlertCircle, Plus, Trash2, MessageCircle } from 'lucide-react';

export default function Search() {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal / Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [options, setOptions] = useState({ courses: [], sources: [] });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  
  const [editData, setEditData] = useState({
    name: '',
    education: '',
    city: '',
    source_id: '',
    summary: '',
    status: 'Open',
    next_followup_date: '',
    followup_remarks: '',
  });
  const [phones, setPhones] = useState(['']);
  const [selectedCourses, setSelectedCourses] = useState([]);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const { data } = await axios.get('/students/options');
      setOptions(data);
    } catch (err) {
      console.error("Failed to load options");
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!term.trim()) return;
    
    setLoading(true);
    setHasSearched(true);
    try {
      const { data } = await axios.get(`/students/search?term=${encodeURIComponent(term)}`);
      setResults(data);
    } catch (error) {
      console.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  // --- Modal Logic ---
  const formatWhatsAppNumber = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '92' + cleaned.substring(1);
    }
    return cleaned;
  };

  const openEditModal = async (student) => {
    setEditError('');
    setIsEditModalOpen(true);
    setEditingStudentId(student.id);
    
    try {
      setEditLoading(true);
      const { data } = await axios.get(`/students/${student.id}`);
      
      setEditData({
        name: data.name || '',
        education: data.education || '',
        city: data.city || '',
        source_id: data.source_id || '',
        summary: data.summary || '',
        status: data.status || 'Open',
        next_followup_date: data.next_followup_date || '',
        followup_remarks: data.followup_remarks || ''
      });
      
      const phoneArr = data.phone_numbers?.map(p => p.phone_number) || [];
      setPhones(phoneArr.length > 0 ? phoneArr : ['']);
      setSelectedCourses(data.interested_courses?.map(c => c.course_id) || []);
      
    } catch(e) {
      setEditError("Failed to load full student details.");
    } finally {
      setEditLoading(false);
    }
  };

  const handlePhoneChange = (index, value) => {
    const newPhones = [...phones];
    newPhones[index] = value;
    setPhones(newPhones);
  };
  const addPhone = () => setPhones([...phones, '']);
  const removePhone = (index) => {
    if (phones.length > 1) {
      setPhones(phones.filter((_, i) => i !== index));
    }
  };

  const toggleCourse = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    
    try {
      const payload = {
        ...editData,
        new_cell_numbers: phones.filter(p => p.trim() !== ''),
        add_interested_courses: selectedCourses,
        source_id: editData.source_id ? parseInt(editData.source_id) : null,
      };
      
      await axios.put(`/students/${editingStudentId}`, payload);
      setIsEditModalOpen(false);
      handleSearch(); // refresh list
    } catch (e) {
      setEditError(e.response?.data?.error || "Error saving record");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in relative">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Search Students</h1>
        <p className="text-sm text-gray-500 mt-1">Search by name, phone number, city, course, or source.</p>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input-field pl-10"
              placeholder="e.g. John Doe, 0312..., New York"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary sm:w-auto px-8">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {hasSearched && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Results ({results.length})</h2>
          
          {results.length === 0 ? (
            <div className="card p-8 text-center text-gray-500">
              No students found matching "{term}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((student) => (
                <div key={student.id} className="card p-5 hover:border-primary-200 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{student.name || 'Unnamed'}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
                          ${student.status === 'Enrolled' ? 'bg-green-100 text-green-800' : 
                            student.status === 'Closed' ? 'bg-red-100 text-red-800' : 
                            student.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'}`}>
                          {student.status}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => openEditModal(student)} className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded transition-colors" title="Edit Full Record">
                      <FileEdit size={18} />
                    </button>
                  </div>

                  <div className="space-y-2 mt-4 text-sm text-gray-600">
                    {student.phone_numbers && student.phone_numbers.split(',').map((phone, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-1">
                        <a href={`tel:${phone}`} className="flex items-center gap-1 hover:text-primary-600">
                          <PhoneCall size={14} className="text-gray-400" /> <span className="hover:underline">{phone}</span>
                        </a>
                        <a href={`https://wa.me/${formatWhatsAppNumber(phone)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:text-green-700 ml-1 bg-green-50 px-1.5 py-0.5 rounded text-xs border border-green-100 transition-colors" title="Message on WhatsApp">
                          <MessageCircle size={12} className="text-green-500" /> WhatsApp
                        </a>
                      </div>
                    ))}
                    {student.city && (
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-gray-400" />
                        <span>{student.city}</span>
                      </div>
                    )}
                    {student.education && (
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-gray-400" />
                        <span>{student.education}</span>
                      </div>
                    )}
                  </div>

                  {student.courses && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-2">
                      {student.courses.split(',').map((course, idx) => (
                         <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                           {course}
                         </span>
                      ))}
                    </div>
                  )}
                  
                  {student.summary && (
                    <div className="mt-3 text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3">
                      "{student.summary}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FULL EDIT MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0 backdrop-blur-sm bg-gray-900/40 transition-opacity">
            <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
              
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                  <h3 className="text-xl leading-6 font-bold text-gray-900 flex items-center gap-2">
                    <FileEdit className="text-primary-600" /> Edit Student Record
                  </h3>
                  <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-500 focus:outline-none">
                    <X size={24} />
                  </button>
                </div>

                {editLoading && !editData.name && !editData.education ? (
                  <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
                ) : (
                  <form onSubmit={handleSaveEdit} className="space-y-6">
                    {editError && (
                      <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm flex gap-2"><AlertCircle size={16}/> {editError}</div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Col */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                          <input type="text" className="input-field py-2" value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Phone Numbers</label>
                          {phones.map((phone, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input type="tel" className="input-field py-2 bg-white" value={phone} onChange={(e) => handlePhoneChange(idx, e.target.value)} required={idx === 0} />
                              {phones.length > 1 && (
                                <button type="button" onClick={() => removePhone(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                              )}
                            </div>
                          ))}
                          <button type="button" onClick={addPhone} className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"><Plus size={14} /> Add Pattern</button>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input type="text" className="input-field py-2" value={editData.city} onChange={(e) => setEditData({...editData, city: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">In Coming Source</label>
                          <select className="input-field py-2 bg-white" value={editData.source_id} onChange={(e) => setEditData({...editData, source_id: e.target.value})}>
                            <option value="">-- Select Source --</option>
                            {options.sources.map(src => <option key={src.id} value={src.id}>{src.name}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Right Col */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                          <input type="text" className="input-field py-2" value={editData.education} onChange={(e) => setEditData({...editData, education: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Interested Courses</label>
                          <div className="border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto space-y-2 bg-gray-50">
                            {options.courses.map(course => (
                              <label key={course.id} className="flex items-center space-x-3 p-1">
                                <input type="checkbox" checked={selectedCourses.includes(course.id)} onChange={() => toggleCourse(course.id)} className="h-4 w-4 text-primary-600 rounded" />
                                <span className="text-sm text-gray-800">{course.course_name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select className="input-field py-2 bg-white" value={editData.status} onChange={(e) => setEditData({...editData, status: e.target.value})}>
                            <option value="Open">Open</option>
                            <option value="Pending">Pending</option>
                            <option value="Enrolled">Enrolled</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Summary / Notes</label>
                        <textarea rows="2" className="input-field py-2" value={editData.summary} onChange={(e) => setEditData({...editData, summary: e.target.value})}></textarea>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Next Follow-up Date</label>
                          <input type="date" className="input-field py-2 bg-white" value={editData.next_followup_date} onChange={(e) => setEditData({...editData, next_followup_date: e.target.value})} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Remarks</label>
                          <input type="text" className="input-field py-2 bg-white" value={editData.followup_remarks} onChange={(e) => setEditData({...editData, followup_remarks: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-xl border-t border-gray-200 -mx-6 -mb-6 mt-6">
                      <button type="submit" disabled={editLoading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 sm:ml-3 sm:w-auto sm:text-sm">
                        {editLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button type="button" onClick={() => setIsEditModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
