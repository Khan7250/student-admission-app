import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, PhoneCall, CheckCircle, MessageCircle, FileEdit, X, Save, AlertCircle, Plus, Trash2 } from 'lucide-react';

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

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
    fetchFollowUps();
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

  const fetchFollowUps = async () => {
    try {
      const { data } = await axios.get('/students/dashboard');
      setFollowUps(data.followUps);
    } catch (error) {
      console.error("Failed to fetch follow-ups");
    } finally {
      setLoading(false);
    }
  };


  const markAcknowledged = async (id) => {
    try {
      await axios.put(`/students/${id}`, { followup_acknowledged: 1 });
      setFollowUps(followUps.filter(f => f.id !== id));
    } catch(e) {
      console.error("Failed to acknowledge followup");
    }
  };

  const markClosed = async (id) => {
    try {
      await axios.put(`/students/${id}`, { status: 'Closed' });
      setFollowUps(followUps.filter(f => f.id !== id));
    } catch(e) {
      console.error("Failed to update status");
    }
  };

  const formatWhatsAppNumber = (phone) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '92' + cleaned.substring(1);
    }
    return cleaned;
  };

  // --- Modal Logic ---
  const openEditModal = async (f) => {
    setEditError('');
    setIsEditModalOpen(true);
    setEditingStudentId(f.id);
    
    try {
      setEditLoading(true);
      const { data } = await axios.get(`/students/${f.id}`);
      
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
    if (phones.length > 1) setPhones(phones.filter((_, i) => i !== index));
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

      // Ensure that if user modifies follow-up date to future, it becomes unacknowledged again to remind them later
      const todayString = new Date().toISOString().split('T')[0];
      if (editData.next_followup_date && editData.next_followup_date > todayString) {
         payload.followup_acknowledged = 0;
      }

      await axios.put(`/students/${editingStudentId}`, payload);
      setIsEditModalOpen(false);
      
      // If student was marked closed or enrolled in edit, remove from followup view
      if(payload.status === 'Closed' || payload.status === 'Enrolled') {
         setFollowUps(followUps.filter(fol => fol.id !== editingStudentId));
      } else {
         fetchFollowUps(); // refresh list
      }
    } catch (e) {
      setEditError(e.response?.data?.error || "Error saving record");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in relative">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Follow-Up List</h1>
        <p className="text-sm text-gray-500 mt-1">Students requiring attention today.</p>
      </div>

      <div className="card">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : followUps.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>You're all caught up! No follow-ups due today.</p>
          </div>
        ) : (
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-200">
               <thead className="bg-gray-50">
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Follow-Up Date</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                   <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-gray-200">
                 {followUps.map(f => (
                   <tr key={f.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4">
                       <div className="text-sm font-medium text-gray-900">{f.name || 'Unnamed'}</div>
                       <div className="text-sm text-gray-500">{f.education || 'No details'}</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm text-gray-900 flex flex-col gap-1">
                         {f.phone_numbers && f.phone_numbers.split(',').map((p, i) => (
                           <div key={i} className="flex items-center gap-2 mb-1">
                             <a href={`tel:${p}`} className="flex items-center gap-1 hover:text-primary-600">
                               <PhoneCall size={14} className="text-gray-400" /> {p}
                             </a>
                             <a href={`https://wa.me/${formatWhatsAppNumber(p)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:text-green-700 ml-1 bg-green-50 px-1.5 py-0.5 rounded text-xs border border-green-100 transition-colors" title="Message on WhatsApp">
                               <MessageCircle size={12} className="text-green-500" /> WhatsApp
                             </a>
                           </div>
                         ))}
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="text-sm text-gray-900 max-w-xs truncate" title={f.courses}>{f.courses || 'None listed'}</div>
                       <div className="text-xs text-gray-500">Source: {f.source_name}</div>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                       <div className="flex items-center gap-1.5 font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded inline-flex">
                         <Calendar size={14} className="text-blue-500" />
                         {new Date(f.next_followup_date).toLocaleDateString()}
                       </div>
                     </td>
                     <td className="px-6 py-4 text-sm text-gray-700 max-w-xs break-words">
                       {f.followup_remarks || <span className="text-gray-400 italic">No remarks</span>}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                       <div className="flex items-center justify-end gap-2">
                         <button onClick={() => markAcknowledged(f.id)} className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1.5 rounded border border-blue-200 flex items-center gap-1 transition-colors" title="Mark as Done">
                           <CheckCircle size={14} /> Done
                         </button>
                         <button onClick={() => openEditModal(f)} className="text-primary-600 hover:text-primary-900 bg-primary-50 px-2 py-1.5 rounded border border-primary-100 flex items-center gap-1 transition-colors" title="Edit Student">
                           <FileEdit size={14} /> Edit
                         </button>
                         <button onClick={() => markClosed(f.id)} className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1.5 rounded border border-green-200 flex items-center gap-1 transition-colors" title="Quick Close">
                           <CheckCircle size={14} /> Close
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>

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
