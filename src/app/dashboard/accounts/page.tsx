'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Toast } from '@/app/components/Toast';
import { ConfirmModal } from '@/app/components/ConfirmModal';
import { Search, ChevronRight, Eye, EyeOff, Edit, ShieldAlert, ShieldCheck, Download, Users, GraduationCap, Shield, UserX } from 'lucide-react';
import Link from 'next/link';
import { exportToCSV } from '@/utils/exportToCSV'; // <-- NEW IMPORT

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: 'student' | 'lecturer' | 'admin';
  active: boolean;
  created_at: string;
}

export default function ManageAccounts() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'lecturer' | 'admin'>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', action: () => {}, isDestructive: false, confirmText: 'Confirm' });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchUsers = useCallback(async () => {
    setFetchingUsers(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setUsers(data as UserProfile[]);
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'Failed to fetch users.' });
    } finally {
      setFetchingUsers(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // --- NEW: EXPORT FUNCTION ---
  const handleExportCSV = () => {
    const dataToExport = filteredUsers.map(u => ({
      Name: u.full_name || 'N/A',
      Email: u.email,
      Role: u.role,
      Status: u.active ? 'Active' : 'Inactive',
      Joined: new Date(u.created_at).toLocaleDateString()
    }));
    
    exportToCSV(dataToExport, ['Name', 'Email', 'Role', 'Status', 'Joined'], 'ATU_User_List');
  };
  // -----------------------------

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 12) {
      setToast({ type: 'error', text: 'Password must be at least 12 characters.' });
      return;
    }

    setModalConfig({
      isOpen: true, title: 'Create Account', confirmText: 'Create',
      message: `Are you sure you want to create a ${role} account for ${fullName}?`,
      isDestructive: false,
      action: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          const response = await fetch('/api/create-user', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName, role }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          
          setToast({ type: 'success', text: `Account created for ${fullName}!` });
          setFullName(''); setEmail(''); setPassword('');
          fetchUsers(); 
        } catch (err: any) {
          setToast({ type: 'error', text: err.message });
        } finally { setLoading(false); }
      }
    });
  };

  const toggleActiveStatus = (user: UserProfile) => {
    if (user.id === currentUserId) {
      setToast({ type: 'error', text: 'You cannot deactivate your own account.' });
      return;
    }

    setModalConfig({
      isOpen: true,
      title: user.active ? 'Deactivate Account' : 'Activate Account',
      confirmText: user.active ? 'Deactivate' : 'Activate',
      message: `Are you sure you want to ${user.active ? 'deactivate' : 'activate'} ${user.full_name}'s account?`,
      isDestructive: user.active,
      action: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setActionLoading(user.id);
        try {
          const { error } = await supabase.from('profiles').update({ active: !user.active }).eq('id', user.id);
          if (error) throw error;
          setUsers(users.map(u => u.id === user.id ? { ...u, active: !user.active } : u));
          setToast({ type: 'success', text: 'Account status updated.' });
        } catch (err) {
          setToast({ type: 'error', text: 'Failed to update account.' });
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const handleEditClick = (user: UserProfile) => {
    setEditingId(user.id);
    setFullName(user.full_name || '');
    setRole(user.role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    
    setModalConfig({
      isOpen: true, title: 'Update Profile', confirmText: 'Save Changes',
      message: `Are you sure you want to update ${fullName}'s profile?`,
      isDestructive: false,
      action: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setLoading(true);
        try {
          const { error } = await supabase.from('profiles').update({ full_name: fullName, role }).eq('id', editingId);
          if (error) throw error;
          setToast({ type: 'success', text: 'User profile updated!' });
          setEditingId(null); setFullName(''); setRole('student');
          fetchUsers();
        } catch (err) {
          setToast({ type: 'error', text: 'Failed to update profile.' });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const filteredUsers = users.filter(user => {
    const searchMatch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = filterRole === 'all' || user.role === filterRole;
    return searchMatch && roleMatch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterRole]);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}
      <ConfirmModal 
        isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} 
        confirmText={modalConfig.confirmText} isDestructive={modalConfig.isDestructive}
        onConfirm={modalConfig.action} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />

      {/* Breadcrumbs & Header with Export Button */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600 transition">Admin</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">User Management</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Manage Accounts</h1>
          <button onClick={handleExportCSV} className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl font-semibold hover:bg-gray-50 transition shadow-sm w-full sm:w-auto">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
          <div><p className="text-xs text-gray-500 font-semibold uppercase">Total Users</p><p className="text-xl font-bold text-gray-900">{users.length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg"><GraduationCap className="w-5 h-5" /></div>
          <div><p className="text-xs text-gray-500 font-semibold uppercase">Students</p><p className="text-xl font-bold text-gray-900">{users.filter(u => u.role === 'student').length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users className="w-5 h-5" /></div>
          <div><p className="text-xs text-gray-500 font-semibold uppercase">Lecturers</p><p className="text-xl font-bold text-gray-900">{users.filter(u => u.role === 'lecturer').length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Shield className="w-5 h-5" /></div>
          <div><p className="text-xs text-gray-500 font-semibold uppercase">Admins</p><p className="text-xl font-bold text-gray-900">{users.filter(u => u.role === 'admin').length}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* FORM COLUMN */}
        <div className="xl:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingId ? 'Edit Profile' : 'Create User'}</h3>
            <form onSubmit={editingId ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)} className="w-full p-2.5 border border-gray-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="student">Student</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              {!editingId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password (12+ chars)</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={12} className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition pr-10" placeholder="••••••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50">{loading ? 'Saving...' : editingId ? 'Save' : 'Create'}</button>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setFullName(''); }} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>}
              </div>
            </form>
          </div>
        </div>

        {/* TABLE COLUMN */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input type="text" placeholder="Search name or email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="w-full sm:w-auto p-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="lecturer">Lecturers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">User</th>
                    <th className="p-4 font-semibold text-gray-600">Role</th>
                    <th className="p-4 font-semibold text-gray-600">Status</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fetchingUsers ? (
                    <tr><td colSpan={4} className="p-12 text-center text-gray-500">Loading users...</td></tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <UserX className="w-12 h-12 mb-3 text-gray-300" />
                          <p className="text-lg font-medium text-gray-900">No users found</p>
                          <p className="text-sm">Try adjusting your search or filters.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                        <td className="p-4 flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'lecturer' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {getInitials(user.full_name)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{user.full_name || 'N/A'}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'lecturer' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>{user.role}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${user.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                            {user.active ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button onClick={() => handleEditClick(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => toggleActiveStatus(user)} disabled={actionLoading === user.id || user.id === currentUserId} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${user.id === currentUserId ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : user.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {actionLoading === user.id ? '...' : user.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
                <span className="text-sm text-gray-600 font-medium">Page {currentPage} of {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Next</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}