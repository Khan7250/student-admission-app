import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, Server, BookOpen, UserPlus, FileEdit, Trash2, Ban } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sources, setSources] = useState([]);
  
  const [loading, setLoading] = useState(true);

  // Form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('User');
  
  const [newItemName, setNewItemName] = useState('');

  // Edit states
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserRole, setEditUserRole] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemName, setEditItemName] = useState('');

  if (user?.role !== 'Admin') {
    return <Navigate to="/dashboard" />;
  }

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, cRes, sRes] = await Promise.all([
        axios.get('/admin/users'),
        axios.get('/admin/courses'),
        axios.get('/admin/sources')
      ]);
      setUsers(uRes.data);
      setCourses(cRes.data);
      setSources(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // User Actions
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/admin/users', { username: newUsername, password: newPassword, role: newRole });
      setNewUsername(''); setNewPassword(''); setNewRole('User');
      fetchData();
    } catch (e) {
      alert(e.response?.data?.error || "Error creating user");
    }
  };

  const toggleUserStatus = async (id, currentRole) => {
    const newStatus = currentRole === 'Suspended' ? 'User' : 'Suspended';
    try {
      if (currentRole === 'Admin') return alert("Cannot suspend admins");
      await axios.put(`/admin/users/${id}`, { role: newStatus });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (id) => {
    if(!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`/admin/users/${id}`);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  // Course/Source Actions
  const handleUpdateItem = async (e, type, id) => {
    e.preventDefault();
    try {
      if (type === 'users') {
        const payload = { role: editUserRole };
        if (editUsername) payload.username = editUsername;
        if (editPassword) payload.password = editPassword;
        
        await axios.put(`/admin/users/${id}`, payload);
        setEditingUserId(null);
        setEditUsername('');
        setEditPassword('');
      } else {
        if (!editItemName) return;
        await axios.put(`/admin/${type}/${id}`, { [type === 'courses' ? 'course_name' : 'name']: editItemName });
        setEditingItemId(null);
      }
      fetchData();
    } catch (e) {
      alert("Error updating item: " + (e.response?.data?.error || e.message));
    }
  };

  const handleCreateItem = async (e, type) => {
    e.preventDefault();
    try {
      await axios.post(`/admin/${type}`, { [type === 'courses' ? 'course_name' : 'name']: newItemName });
      setNewItemName('');
      fetchData();
    } catch (e) {
      alert("Error adding item");
    }
  };

  const MainLayout = ({ title, icon: Icon, children }) => (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
        <div className="p-2 bg-primary-100 rounded-lg text-primary-700"><Icon size={24} /></div>
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
        <p className="text-sm text-gray-500 mt-1">Manage system users, courses, and incoming sources.</p>
      </div>

      <div className="flex space-x-2 border-b border-gray-200 mb-6 overflow-x-auto">
        {[
          { id: 'users', name: 'Users', icon: Users },
          { id: 'courses', name: 'Courses', icon: BookOpen },
          { id: 'sources', name: 'Sources', icon: Server },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 py-3 px-5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
      ) : (
        <div className="card p-6 min-h-[500px]">
          
          {/* USERS TAB */}
          {activeTab === 'users' && (
            <MainLayout title="User Management" icon={Users}>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1 bg-gray-50 p-5 rounded-xl border border-gray-100 h-fit">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                    <UserPlus size={18} /> Add New User
                  </h3>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                      <input required type="text" className="input-field py-2 text-sm" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                      <input required type="password" className="input-field py-2 text-sm" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                      <select className="input-field bg-white py-2 text-sm" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                        <option value="User">User</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <button type="submit" className="btn-primary py-2 w-full text-sm">Create account</button>
                  </form>
                </div>

                <div className="md:col-span-2 overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Username</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-600">Role</th>
                        <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(u => (
                        editingUserId === u.id ? (
                          <tr key={u.id}>
                            <td colSpan="4" className="px-4 py-3 bg-gray-50/80 rounded">
                              <form onSubmit={(e) => handleUpdateItem(e, 'users', u.id)} className="flex items-end gap-3 flex-wrap">
                                <div className="flex-1 min-w-[150px]">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Username</label>
                                  <input type="text" className="input-field py-1 px-2 text-sm bg-white" value={editUsername} onChange={e => setEditUsername(e.target.value)} required />
                                </div>
                                <div className="flex-1 min-w-[150px]">
                                  <label className="block text-xs font-medium text-gray-700 mb-1">New Password <span className="text-gray-400 font-normal">(optional)</span></label>
                                  <input type="password" placeholder="Leave blank to keep" className="input-field py-1 px-2 text-sm bg-white" value={editPassword} onChange={e => setEditPassword(e.target.value)} />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                                  <select className="input-field py-1 px-2 text-sm bg-white" value={editUserRole} onChange={e => setEditUserRole(e.target.value)}>
                                    <option value="User">User</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Suspended">Suspended</option>
                                  </select>
                                </div>
                                <div className="flex gap-2 h-8">
                                  <button type="submit" className="inline-flex items-center py-1 px-3 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors whitespace-nowrap h-full">Save Changes</button>
                                  <button type="button" onClick={() => { setEditingUserId(null); setEditUsername(''); setEditPassword(''); }} className="inline-flex items-center py-1 px-3 text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded transition-colors whitespace-nowrap h-full">Cancel</button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        ) : (
                          <tr key={u.id}>
                            <td className="px-4 py-3 text-gray-500">{u.id}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'Admin' ? 'bg-purple-100 text-purple-800' : u.role === 'Suspended' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              {u.role !== 'Admin' && (
                                <button onClick={() => toggleUserStatus(u.id, u.role)} className="inline-flex p-1.5 text-gray-500 hover:text-orange-600 bg-gray-50 rounded" title={u.role === 'Suspended' ? 'Unsuspend' : 'Suspend'}>
                                  <Ban size={16} />
                                </button>
                              )}
                              <button onClick={() => { setEditingUserId(u.id); setEditUserRole(u.role); setEditUsername(u.username); setEditPassword(''); }} className="inline-flex p-1.5 text-gray-500 hover:text-blue-600 bg-gray-50 rounded" title="Edit User">
                                <FileEdit size={16} />
                              </button>
                              <button onClick={() => deleteUser(u.id)} className="inline-flex p-1.5 text-gray-500 hover:text-red-600 bg-gray-50 rounded" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        )
                      ))}
                    </tbody>
                   </table>
                </div>
              </div>
            </MainLayout>
          )}

          {/* COURSES & SOURCES */}
          {(activeTab === 'courses' || activeTab === 'sources') && (
            <MainLayout title={`Manage ${activeTab === 'courses' ? 'Courses' : 'Sources'}`} icon={activeTab === 'courses' ? BookOpen : Server}>
              <div className="max-w-xl">
                 <form onSubmit={(e) => handleCreateItem(e, activeTab)} className="flex gap-2 mb-6">
                    <input 
                      type="text" required
                      className="input-field flex-1 text-sm bg-gray-50"
                      placeholder={`New ${activeTab === 'courses' ? 'Course Name' : 'Source Name'}`}
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                    />
                    <button type="submit" className="btn-primary sm:w-auto px-6 text-sm">Add</button>
                 </form>

                 <div className="border border-gray-200 rounded-lg overflow-hidden">
                   <ul className="divide-y divide-gray-200">
                     {(activeTab === 'courses' ? courses : sources).map(item => (
                       <li key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 border-b border-gray-100 last:border-0">
                         {editingItemId === item.id ? (
                           <form onSubmit={(e) => handleUpdateItem(e, activeTab, item.id)} className="flex-1 flex gap-2 mr-4">
                             <input 
                               type="text" required autoFocus
                               className="input-field py-1 px-3 text-sm flex-1 bg-white"
                               value={editItemName}
                               onChange={(e) => setEditItemName(e.target.value)}
                             />
                             <button type="submit" className="px-3 py-1 text-xs text-white bg-green-600 hover:bg-green-700 rounded">Save</button>
                             <button type="button" onClick={() => setEditingItemId(null)} className="px-3 py-1 text-xs text-gray-600 bg-gray-200 hover:bg-gray-300 rounded">Cancel</button>
                           </form>
                         ) : (
                           <div className="flex-1 flex items-center justify-between">
                             <span className="font-medium text-gray-700">{item.course_name || item.name}</span>
                             <div className="flex items-center gap-3">
                               <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-100">ID: {item.id}</span>
                               <button 
                                 onClick={() => {
                                   setEditingItemId(item.id);
                                   setEditItemName(item.course_name || item.name);
                                 }}
                                 className="text-gray-400 hover:text-blue-600 p-1"
                                 title="Edit"
                               >
                                 <FileEdit size={16} />
                               </button>
                             </div>
                           </div>
                         )}
                       </li>
                     ))}
                   </ul>
                 </div>
              </div>
            </MainLayout>
          )}

        </div>
      )}
    </div>
  );
}
