'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Toast } from '@/app/components/Toast';
import { ConfirmModal } from '@/app/components/ConfirmModal';
import { ChevronRight, Calendar, Trash2, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ManageTimetable() {
  const [courses, setCourses] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [courseId, setCourseId] = useState('');
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');

  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', action: () => {}, isDestructive: false, confirmText: 'Confirm' });

  const fetchData = async () => {
    setLoading(true);
    const [coursesRes, timeRes] = await Promise.all([
      supabase.from('courses').select('*').order('course_code'),
      supabase.from('timetable').select(`id, day_of_week, start_time, end_time, location, courses(course_code, course_name)`).order('start_time')
    ]);
    
    if (coursesRes.data) setCourses(coursesRes.data);
    if (timeRes.data) {
      // Sort by day of week manually
      const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const sorted = timeRes.data.sort((a, b) => {
        const dayDiff = daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week);
        if (dayDiff !== 0) return dayDiff;
        return a.start_time.localeCompare(b.start_time);
      });
      setTimetable(sorted);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime >= endTime) {
      setToast({ type: 'error', text: 'End time must be after start time.' });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('timetable').insert([{
      course_id: courseId, day_of_week: day, start_time: startTime, end_time: endTime, location
    }]);

    if (error) {
      setToast({ type: 'error', text: error.message });
    } else {
      setToast({ type: 'success', text: 'Schedule added successfully!' });
      setCourseId(''); setLocation('');
      fetchData();
    }
    setSubmitting(false);
  };

  const handleDelete = (id: string) => {
    setModalConfig({
      isOpen: true, title: 'Remove Schedule', confirmText: 'Remove', isDestructive: true,
      message: 'Are you sure you want to remove this class from the timetable?',
      action: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        const { error } = await supabase.from('timetable').delete().eq('id', id);
        if (!error) {
          setTimetable(timetable.filter(t => t.id !== id));
          setToast({ type: 'success', text: 'Schedule removed.' });
        }
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
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
          <span className="text-gray-900">Academic Management</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Timetable</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" /> Add Schedule Entry
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Course</label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a Course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Day of Week</label>
                <select value={day} onChange={(e) => setDay(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Location / Room</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="e.g. Room 402" className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50">
                {submitting ? 'Adding...' : 'Add to Timetable'}
              </button>
            </form>
          </div>
        </div>

        {/* Timetable List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Master Timetable</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading timetable...</div>
              ) : timetable.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No schedules added yet.</div>
              ) : (
                timetable.map((entry) => (
                  <div key={entry.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-20 text-center bg-blue-50 rounded-lg py-2 border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 uppercase">{entry.day_of_week.substring(0, 3)}</p>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{entry.courses?.course_code} - {entry.courses?.course_name}</p>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {entry.location}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(entry.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}