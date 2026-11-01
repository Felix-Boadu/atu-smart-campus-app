'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Toast } from '@/app/components/Toast';
import { ConfirmModal } from '@/app/components/ConfirmModal';
import { Search, ChevronRight, Eye, EyeOff, Edit, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function ManageAccounts() {
  const [users, setUsers] = useState<any[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  
  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Toast & Modal State
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', action: () => {}, isDestructive: false, confirmText: 'Confirm' });

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchUsers = async () => {
    setFetchingUsers(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
    setFetchingUsers(false);
  };

  useEffect(() => { fetchUsers(); }, []);

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

  const toggleActiveStatus = (id: string, currentStatus: boolean, name: string) => {
    setModalConfig({
      isOpen: true,
      title: currentStatus ? 'Deactivate Account' : 'Activate Account',
      confirmText: currentStatus ? 'Deactivate' : 'Activate',
      message: `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} ${name}'s account? They will ${currentStatus ? 'lose' : 'regain'} access to the portal.`,
      isDestructive: currentStatus,
      action: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setActionLoading(id);
        const { error } = await supabase.from('profiles').update({ active: !currentStatus }).eq('id', id);
        if (!error) {
          setUsers(users.map(u => u.id === id ? { ...u, active: !currentStatus } : u));
          setToast({ type: 'success', text: 'Account status updated.' });
        } else {
          setToast({ type: 'error', text: 'Failed to update account.' });
        }
        setActionLoading(null);
      }
    });
  };

  const handleEditClick = (user: any) => {
    setEditingId(user.id);
    setFullName(user.full_name || '');
    setRole(user.role);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setLoading(true);

    const { error } = await supabase.from('profiles').update({ full_name: fullName, role }).eq('id', editingId);
    if (!error) {
      setToast({ type: 'success', text: 'User profile updated!' });
      setEditingId(null); setFullName(''); setRole('student');
      fetchUsers();
    } else {
      setToast({ type: 'error', text: 'Failed to update profile.' });
    }
    setLoading(false);
  };

  const filteredUsers = users.filter(user => {
    const searchMatch = user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = filterRole === 'all' || user.role === filterRole;
    return searchMatch && roleMatch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Toast & Modal Components */}
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}
      <ConfirmModal 
        isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} 
        confirmText={modalConfig.confirmText} isDestructive={modalConfig.isDestructive}
        onConfirm={modalConfig.action} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />

      {/* Breadcrumbs & Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600 transition">Admin</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">User Management</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Accounts</h1>
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
                <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500">
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
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50">
                  {loading ? 'Saving...' : editingId ? 'Save' : 'Create'}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setFullName(''); }} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* TABLE COLUMN */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full">
            
            {/* Search & Filter Bar */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-72">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
                  <input type="text" placeholder="Search name or email..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setCurrentPage(1); }} className="p-2.5 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">All Roles</option>
                  <option value="student">Students</option>
                  <option value="lecturer">Lecturers</option>
                  <option value="admin">Admins</option>
                </select>
              </div>
              <p className="text-sm font-semibold text-gray-500 whitespace-nowrap">{filteredUsers.length} Users</p>
            </div>

            {/* Table */}
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
                    <tr><td colSpan={4} className="p-12 text-center text-gray-500">No users found.</td></tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-gray-900">{user.full_name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
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
                          <button onClick={() => toggleActiveStatus(user.id, user.active, user.full_name)} disabled={actionLoading === user.id} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${user.active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                            {actionLoading === user.id ? '...' : user.active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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