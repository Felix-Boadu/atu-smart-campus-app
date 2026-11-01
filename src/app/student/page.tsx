'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { BookOpen, CheckCircle, Clock, MapPin, Megaphone, Bell, ChevronRight } from 'lucide-react';

export default function StudentDashboard() {
  const [student, setStudent] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [todaysClasses, setTodaysClasses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [loading, setLoading] = useState(true);

  const [codeInput, setCodeInput] = useState('');
  const [attendanceMsg, setAttendanceMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setStudent(profile);

      const { data: enrolledData } = await supabase.from('enrollments').select(`course_id, courses ( course_code, course_name )`).eq('student_id', session.user.id);
      const formattedCourses = enrolledData?.map((item: any) => ({
        id: item.course_id, code: (item.courses as any).course_code, name: (item.courses as any).course_name
      })) || [];
      setCourses(formattedCourses);

      if (formattedCourses.length > 0) {
        const courseIds = formattedCourses.map(c => c.id);
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        
        const { data: timeData } = await supabase
          .from('timetable')
          .select(`*, courses ( course_code, course_name )`)
          .in('course_id', courseIds)
          .eq('day_of_week', today)
          .order('start_time');
        setTodaysClasses(timeData || []);

        const { data: attendanceData } = await supabase
          .from('attendance_records')
          .select('status')
          .eq('student_id', session.user.id)
          .in('course_id', courseIds);
        
        if (attendanceData && attendanceData.length > 0) {
          const present = attendanceData.filter(a => a.status === 'present' || a.status === 'late').length;
          setAttendanceRate(Math.round((present / attendanceData.length) * 100));
        }
      }

      const { data: annData } = await supabase.from('announcements').select('*').in('target_role', ['all', 'student']).order('created_at', { ascending: false }).limit(3);
      setAnnouncements(annData || []);

      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  const handleMarkAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAttendanceMsg({ type: '', text: '' });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    // FIX: Check if session exists to satisfy TypeScript
    if (!session) {
      setAttendanceMsg({ type: 'error', text: 'Session expired. Please log in again.' });
      setSubmitting(false);
      return;
    }

    const formattedCode = codeInput.toUpperCase().trim();

    const { data: sessionData, error: sessionError } = await supabase.from('attendance_sessions').select('id, course_id, courses(course_code)').eq('code', formattedCode).eq('is_active', true).single();
    if (sessionError || !sessionData) { setAttendanceMsg({ type: 'error', text: 'Invalid or expired code.' }); setSubmitting(false); return; }

    const isEnrolled = courses.some(c => c.id === sessionData.course_id);
    if (!isEnrolled) { setAttendanceMsg({ type: 'error', text: 'You are not enrolled in this course.' }); setSubmitting(false); return; }

    const { data: existingRecord } = await supabase.from('attendance_records').select('id').eq('session_id', sessionData.id).eq('student_id', session.user.id).single();
    if (existingRecord) { setAttendanceMsg({ type: 'error', text: 'You have already marked attendance.' }); setSubmitting(false); return; }

    const { error: insertError } = await supabase.from('attendance_records').insert([{ course_id: sessionData.course_id, student_id: session.user.id, session_id: sessionData.id, status: 'present' }]);

    if (insertError) { setAttendanceMsg({ type: 'error', text: insertError.message }); } 
    else { setAttendanceMsg({ type: 'success', text: `Successfully marked present for ${(sessionData.courses as any).course_code}!` }); setCodeInput(''); }
    setSubmitting(false);
  };

  if (loading) return <div className="text-gray-500 p-8">Loading your dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#123B72] to-[#1769AA] rounded-3xl p-8 mb-8 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {student?.full_name?.split(' ')[0] || 'Student'}!</h1>
          <p className="text-blue-100 flex items-center gap-3">
            <span className="bg-white/20 px-3 py-1 rounded-md text-sm font-semibold">Level 300</span>
            <span className="bg-white/20 px-3 py-1 rounded-md text-sm font-semibold">Semester 1</span>
          </p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-[#1769AA] rounded-xl"><BookOpen className="w-8 h-8" /></div>
          <div><p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Courses</p><p className="text-3xl font-bold text-gray-900">{courses.length}</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl"><CheckCircle className="w-8 h-8" /></div>
          <div><p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Attendance</p><p className="text-3xl font-bold text-gray-900">{attendanceRate}%</p></div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-xl"><Clock className="w-8 h-8" /></div>
          <div><p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Classes Today</p><p className="text-3xl font-bold text-gray-900">{todaysClasses.length}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-8">
          
          {/* Mark Attendance Box */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Mark Your Attendance</h2>
            <p className="text-gray-500 mb-4 text-sm">Enter the 6-character code provided by your lecturer.</p>
            
            {attendanceMsg.text && (
              <div className={`p-3 mb-4 rounded-lg text-sm font-bold ${attendanceMsg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {attendanceMsg.text}
              </div>
            )}

            <form onSubmit={handleMarkAttendance} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="A1B2C3"
                required
                maxLength={6}
                className="w-full sm:w-48 p-3 border border-gray-300 rounded-xl text-center text-xl font-mono tracking-widest text-gray-900 focus:ring-2 focus:ring-[#1769AA] focus:border-transparent outline-none transition-all uppercase"
              />
              <button type="submit" disabled={submitting || codeInput.length < 6} className="w-full sm:w-auto bg-[#1769AA] text-white px-8 py-3 rounded-xl hover:bg-blue-800 font-bold transition disabled:opacity-50">
                {submitting ? 'Checking...' : 'Submit Code'}
              </button>
            </form>
          </div>

          {/* Today's Classes */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
              <Link href="/student/timetable" className="text-sm font-semibold text-[#1769AA] hover:underline">View Full Timetable</Link>
            </div>
            <div className="p-6">
              {todaysClasses.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No classes scheduled for today.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysClasses.map((cls) => (
                    <div key={cls.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex flex-col items-center justify-center bg-white px-4 rounded-lg border border-gray-200 shadow-sm min-w-[80px]">
                        <span className="text-sm font-bold text-gray-900">{cls.start_time.substring(0, 5)}</span>
                        <span className="text-xs text-gray-500">{cls.end_time.substring(0, 5)}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-[#1769AA]">{(cls.courses as any)?.course_code}</h4>
                        <p className="text-sm text-gray-700 font-medium mb-1">{(cls.courses as any)?.course_name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {cls.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/student/timetable" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-[#1769AA] transition group flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-[#1769AA] rounded-xl group-hover:bg-[#1769AA] group-hover:text-white transition"><Clock className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-[#1769AA] transition">My Timetable</h3>
                  <p className="text-xs text-gray-500">View schedule</p>
                </div>
              </Link>
              <Link href="/student/grades" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-green-500 transition group flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-600 group-hover:text-white transition"><CheckCircle className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition">View Grades</h3>
                  <p className="text-xs text-gray-500">Check your scores</p>
                </div>
              </Link>
            </div>
          </div>

        </div>

        {/* Right Column: Announcements & Notifications */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#1769AA]" /> Announcements
              </h2>
            </div>
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <p className="text-sm text-gray-500">No new announcements.</p>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-4 bg-gray-50 rounded-xl border-l-4 border-[#1769AA] border-y border-r border-gray-100">
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{ann.title}</h4>
                    <p className="text-xs text-gray-400 mb-2">{new Date(ann.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{ann.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-orange-500 rounded-lg"><Bell className="w-5 h-5" /></div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Notifications</p>
                <p className="text-xs text-gray-500">You have no unread alerts.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>

      </div>
    </div>
  );
}