'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Toast } from '@/app/components/Toast';
import { ConfirmModal } from '@/app/components/ConfirmModal';
import { ChevronRight, Megaphone, Trash2, Send } from 'lucide-react';
import Link from 'next/link';

export default function ManageAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetRole, setTargetRole] = useState('all');

  // UI State
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', action: () => {}, isDestructive: false, confirmText: 'Confirm' });

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setToast(null);

    const { error } = await supabase.from('announcements').insert([{ title, content, target_role: targetRole }]);

    if (error) {
      setToast({ type: 'error', text: error.message });
    } else {
      setToast({ type: 'success', text: 'Announcement published successfully!' });
      setTitle(''); setContent(''); setTargetRole('all');
      fetchAnnouncements();
    }
    setSubmitting(false);
  };

  const handleDelete = (id: string) => {
    setModalConfig({
      isOpen: true, title: 'Delete Announcement', confirmText: 'Delete', isDestructive: true,
      message: 'Are you sure you want to delete this announcement? Users will no longer see it.',
      action: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        const { error } = await supabase.from('announcements').delete().eq('id', id);
        if (!error) {
          setAnnouncements(announcements.filter(a => a.id !== id));
          setToast({ type: 'success', text: 'Announcement deleted.' });
        } else {
          setToast({ type: 'error', text: error.message });
        }
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}
      <ConfirmModal 
        isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} 
        confirmText={modalConfig.confirmText} isDestructive={modalConfig.isDestructive}
        onConfirm={modalConfig.action} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />

      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600 transition">Admin</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Communication</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Announcements</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" /> Post Announcement
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Midterm Schedule Released" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Target Audience</label>
                <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="all">Everyone</option>
                  <option value="student">Students Only</option>
                  <option value="lecturer">Lecturers Only</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Message</label>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={5} className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder="Type your message here..."></textarea>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50">
                <Send className="w-4 h-4" /> {submitting ? 'Publishing...' : 'Publish'}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="text-gray-500">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900">No announcements yet</h3>
              <p className="text-gray-500">Post your first announcement using the form.</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-900 pr-12">{announcement.title}</h3>
                  <button onClick={() => handleDelete(announcement.id)} className="absolute top-6 right-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                    announcement.target_role === 'all' ? 'bg-purple-100 text-purple-700' :
                    announcement.target_role === 'lecturer' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {announcement.target_role === 'all' ? 'Everyone' : announcement.target_role + 's'}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">{new Date(announcement.created_at).toLocaleString()}</span>
                </div>
                <p className="text-gray-600 whitespace-pre-wrap">{announcement.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}