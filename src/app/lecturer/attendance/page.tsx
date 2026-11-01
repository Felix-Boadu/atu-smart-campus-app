'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AttendanceManagement() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // 1. Fetch all past sessions for this lecturer
  useEffect(() => {
    const fetchSessions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from('attendance_sessions')
        .select(`*, courses ( course_code, course_name )`)
        .eq('lecturer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) {
        setSessions(data);
        if (data.length > 0) setSelectedSession(data[0]); // Auto-select the most recent session
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  // 2. When a session is selected, load the full roster
  useEffect(() => {
    const fetchRoster = async () => {
      if (!selectedSession) return;
      setUpdating(true);

      // A. Get all students enrolled in this course
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`student_id, profiles ( full_name, email )`)
        .eq('course_id', selectedSession.course_id);

      // B. Get any existing attendance records for this session
      const { data: records } = await supabase
        .from('attendance_records')
        .select(`*`)
        .eq('session_id', selectedSession.id);

      // C. Combine them into a single roster list
      const combined = enrollments?.map((e: any) => {
        const record = records?.find((r: any) => r.student_id === e.student_id);
        return {
          student_id: e.student_id,
          full_name: e.profiles.full_name,
          email: e.profiles.email,
          record_id: record?.id || null,
          status: record?.status || 'absent', // Default to absent if they haven't scanned
        };
      }) || [];

      setRoster(combined);
      setUpdating(false);
    };

    fetchRoster();
  }, [selectedSession]);

  // 3. Function to manually change a student's status
  const handleStatusChange = async (student: any, newStatus: string) => {
    // Optimistic UI update
    setRoster(roster.map(r => r.student_id === student.student_id ? { ...r, status: newStatus } : r));

    if (student.record_id) {
      // Update existing record
      await supabase.from('attendance_records').update({ status: newStatus }).eq('id', student.record_id);
    } else {
      // Insert new record
      const { data } = await supabase.from('attendance_records').insert([{
        course_id: selectedSession.course_id,
        student_id: student.student_id,
        session_id: selectedSession.id,
        status: newStatus
      }]).select().single();
      
      // Update local state with the new record ID
      if (data) {
        setRoster(prev => prev.map(r => r.student_id === student.student_id ? { ...r, record_id: data.id } : r));
      }
    }
  };

  if (loading) return <div className="text-gray-500">Loading attendance data...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Management</h1>
        <p className="text-gray-500">View, edit, and manage attendance registers for your courses.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar: List of Sessions */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Recent Sessions</h2>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-2">
            {sessions.length === 0 ? (
              <p className="text-gray-500 text-sm">No attendance sessions found.</p>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedSession?.id === session.id 
                      ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' 
                      : 'bg-white border-gray-100 hover:border-blue-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-900">{session.courses?.course_code}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${session.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {session.is_active ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{new Date(session.created_at).toLocaleString()}</p>
                  <p className="font-mono text-sm font-bold text-blue-700 bg-white inline-block px-2 py-1 rounded border border-gray-200 shadow-sm">
                    Code: {session.code}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Main Content: Roster for Selected Session */}
        <div className="lg:col-span-2">
          {selectedSession ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedSession.courses?.course_name}</h3>
                  <p className="text-sm text-gray-500">Attendance Register</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-700">Total Enrolled</p>
                  <p className="text-2xl font-bold text-blue-600">{roster.length}</p>
                </div>
              </div>
              
              <table className="w-full text-left">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Student</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.length === 0 ? (
                    <tr><td colSpan={2} className="p-8 text-center text-gray-500">No students are enrolled in this course.</td></tr>
                  ) : (
                    roster.map((student) => (
                      <tr key={student.student_id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="p-4">
                          <p className="font-bold text-gray-900">{student.full_name}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </td>
                        <td className="p-4 text-right">
                          <select
                            value={student.status}
                            onChange={(e) => handleStatusChange(student, e.target.value)}
                            className={`p-2 rounded-lg text-sm font-bold outline-none border ${
                              student.status === 'present' ? 'bg-green-50 text-green-700 border-green-200' :
                              student.status === 'late' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                              'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            <option value="present">Present</option>
                            <option value="late">Late</option>
                            <option value="absent">Absent</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 h-full flex flex-col items-center justify-center p-12 text-gray-400">
              <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              <p className="text-lg font-medium">Select a session to view the roster</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}