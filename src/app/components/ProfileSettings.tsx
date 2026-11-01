'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Toast } from '@/app/components/Toast';
import { Camera, Lock, User as UserIcon, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProfileSettings({ themeColor = 'blue' }: { themeColor?: 'blue' | 'green' | 'slate' }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  // Theme colors based on the portal
  const btnColor = themeColor === 'green' ? 'bg-green-600 hover:bg-green-700' : themeColor === 'slate' ? 'bg-slate-800 hover:bg-slate-900' : 'bg-blue-600 hover:bg-blue-700';
  const iconColor = themeColor === 'green' ? 'text-green-600 bg-green-50' : themeColor === 'slate' ? 'text-slate-700 bg-slate-100' : 'text-blue-600 bg-blue-50';

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      setUserId(session.user.id);
      setEmail(session.user.email || '');

      const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (data) {
        setFullName(data.full_name || '');
        setRole(data.role || '');
        setAvatarUrl(data.avatar_url || null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setToast(null);

    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', userId);
    
    if (error) {
      setToast({ type: 'error', text: error.message });
    } else {
      setToast({ type: 'success', text: 'Profile updated successfully!' });
      router.refresh(); // Refreshes the sidebar name
    }
    setUpdating(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setToast({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (newPassword.length < 12) {
      setToast({ type: 'error', text: 'Password must be at least 12 characters.' });
      return;
    }

    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      setToast({ type: 'error', text: error.message });
    } else {
      setToast({ type: 'success', text: 'Password changed successfully!' });
      setNewPassword(''); setConfirmPassword('');
    }
    setUpdating(false);
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}-${Math.random()}.${fileExt}`;

      // 1. Upload image to Supabase Storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      // 2. Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // 3. Save URL to profile
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', userId);
      if (updateError) throw updateError;

      setAvatarUrl(data.publicUrl);
      setToast({ type: 'success', text: 'Avatar updated successfully!' });
    } catch (error: any) {
      setToast({ type: 'error', text: error.message });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="text-gray-500">Loading profile...</div>;

  const initials = fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
        <p className="text-gray-500">Manage your personal information and security settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Avatar Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div className="relative group">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
            ) : (
              <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold border-4 border-gray-50 shadow-sm ${iconColor}`}>
                {initials}
              </div>
            )}
            
            <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-50 transition border border-gray-100">
              <Camera className="w-5 h-5 text-gray-600" />
              <input type="file" accept="image/*" onChange={uploadAvatar} disabled={uploading} className="hidden" />
            </label>
          </div>
          
          <h3 className="mt-4 text-xl font-bold text-gray-900">{fullName}</h3>
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{role}</p>
          {uploading && <p className="text-xs text-blue-600 mt-2">Uploading image...</p>}
        </div>

        {/* Forms */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Profile Details Form */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-gray-400" /> Personal Information
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address (Read-only)</label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <input type="email" value={email} disabled className="w-full p-2.5 pl-10 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl outline-none cursor-not-allowed" />
                </div>
              </div>
              <button type="submit" disabled={updating} className={`px-6 py-2.5 rounded-xl font-bold text-white transition ${btnColor} disabled:opacity-50`}>
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Password Reset Form */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5 text-gray-400" /> Change Password
            </h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={12} placeholder="Min 12 characters" className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={12} className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
              </div>
              <button type="submit" disabled={updating || !newPassword} className={`px-6 py-2.5 rounded-xl font-bold text-white transition ${btnColor} disabled:opacity-50`}>
                {updating ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}