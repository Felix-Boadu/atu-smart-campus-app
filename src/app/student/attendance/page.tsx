'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock, AlertTriangle, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AttendanceRecord {
  id: string;
  date: string;
  courseCode: string;
  courseName: string;
  status: 'present' | 'absent' | 'late';
}

export default function StudentAttendance() {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [courseStats, setCourseStats] = useState<any[]>([]);
  const [overallRate, setOverallRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Get student's enrolled courses
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', session.user.id);
      if (!enrollments || enrollments.length === 0) { setLoading(false); return; }
      const courseIds = enrollments.map(e => e.course_id);

      // 2. Get all sessions held for those courses
      const { data: sessionsData } = await supabase
        .from('attendance_sessions')
        .select(`id, created_at, courses ( course_code, course_name )`)
        .in('course_id', courseIds)
        .order('created_at', { ascending: false });

      // 3. Get all attendance records for this student
      const { data: recordsData } = await supabase
        .from('attendance_records')
        .select(`session_id, status`)
        .eq('student_id', session.user.id);

      if (sessionsData) {
        // 4. Merge sessions with records to build history
        const mergedHistory: AttendanceRecord[] = sessionsData.map(session => {
          const record = recordsData?.find(r => r.session_id === session.id);
          return {
            id: session.id,
            date: session.created_at,
            courseCode: (session.courses as any).course_code,
            courseName: (session.courses as any).course_name,
            status: record ? record.status : 'absent' // If no record, student was absent
          };
        });

        setHistory(mergedHistory);

        // 5. Calculate stats per course
        const statsMap: any = {};
        mergedHistory.forEach(item => {
          if (!statsMap[item.courseCode]) {
            statsMap[item.courseCode] = { name: item.courseName, total: 0, present: 0 };
          }
          statsMap[item.courseCode].total += 1;
          if (item.status === 'present' || item.status === 'late') {
            statsMap[item.courseCode].present += 1;
          }
        });

        const statsArray = Object.keys(statsMap).map(code => ({
          code,
          name: statsMap[code].name,
          total: statsMap[code].total,
          present: statsMap[code].present,
          percentage: Math.round((statsMap[code].present / statsMap[code].total) * 100)
        }));
        
        setCourseStats(statsArray);

        // 6. Calculate Overall Rate
        const totalClasses = mergedHistory.length;
        const totalAttended = mergedHistory.filter(h => h.status === 'present' || h.status === 'late').length;
        setOverallRate(totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100));
      }
      
      setLoading(false);
    };

    fetchAttendance();
  }, []);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'present': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700"><CheckCircle className="w-3.5 h-3.5" /> Present</span>;
      case 'late': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700"><Clock className="w-3.5 h-3.5" /> Late</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle className="w-3.5 h-3.5" /> Absent</span>;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  if (loading) return <div className="text-gray-500 p-8">Loading your attendance...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Attendance</h1>
        <p className="text-gray-500">Track your class attendance and overall performance.</p>
      </div>

      {/* Overall Stats & Progress */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">Overall Attendance Rate</h2>
          <p className="text-gray-500 text-sm">Across all your enrolled courses.</p>
        </div>
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="text-4xl font-extrabold text-[#123B72]">{overallRate}%</div>
          <div className="w-full md:w-64 h-4 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor(overallRate)} transition-all duration-1000`} 
              style={{ width: `${overallRate}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Per Course Stats */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Course Breakdown</h3>
          {courseStats.length === 0 ? (
            <p className="text-gray-500 text-sm">No attendance data yet.</p>
          ) : (
            courseStats.map((course) => (
              <div key={course.code} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-[#1769AA]">{course.code}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">{course.name}</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{course.percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${getProgressColor(course.percentage)}`} style={{ width: `${course.percentage}%` }}></div>
                </div>
                <p className="text-xs text-gray-500 font-medium text-right">
                  Attended {course.present} of {course.total} classes
                </p>
              </div>
            ))
          )}
        </div>

        {/* Right Column: Full History Log */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Attendance History</h3>
              <span className="text-sm font-semibold text-gray-500">{history.length} Classes Logged</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-white border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold text-gray-600">Date</th>
                    <th className="p-4 font-semibold text-gray-600">Course</th>
                    <th className="p-4 font-semibold text-gray-600 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-12 text-center">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No attendance records found.</p>
                        <p className="text-sm text-gray-400">Classes will appear here once your lecturer takes attendance.</p>
                      </td>
                    </tr>
                  ) : (
                    history.map((record) => (
                      <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-sm text-gray-600 font-medium">
                          {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-4">
                          <p className="font-bold text-[#123B72]">{record.courseCode}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{record.courseName}</p>
                        </td>
                        <td className="p-4 text-right">
                          {getStatusBadge(record.status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}