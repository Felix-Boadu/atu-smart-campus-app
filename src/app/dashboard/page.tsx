'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Users, GraduationCap, BookOpen, ShieldCheck, ChevronRight, BarChart3 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ students: 0, lecturers: 0, courses: 0, attendance: 0 });
  const [loading, setLoading] = useState(true);

  // Chart Data State
  const [enrollmentData, setEnrollmentData] = useState<any[]>([]);
  const [workloadData, setWorkloadData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      // 1. Fetch Global Stats
      const [studentsRes, lecturersRes, coursesRes, attendanceRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'lecturer'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('attendance_records').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        students: studentsRes.count || 0,
        lecturers: lecturersRes.count || 0,
        courses: coursesRes.count || 0,
        attendance: attendanceRes.count || 0
      });

      // 2. Fetch Data for Enrollment Chart
      const { data: enrollmentsData } = await supabase.from('enrollments').select(`course_id, courses ( course_code )`);
      
      const courseEnrollments: any = {};
      enrollmentsData?.forEach(e => {
        // FIX: Added 'as any' to satisfy TypeScript
        const code = (e.courses as any)?.course_code || 'Unknown';
        courseEnrollments[code] = (courseEnrollments[code] || 0) + 1;
      });
      
      const enrollmentChartData = Object.keys(courseEnrollments).map(key => ({
        name: key,
        students: courseEnrollments[key]
      })).sort((a, b) => b.students - a.students).slice(0, 5);
      setEnrollmentData(enrollmentChartData);

      // 3. Fetch Data for Lecturer Workload
      const { data: assignmentsData } = await supabase.from('course_assignments').select(`lecturer_id, profiles ( full_name )`);
      const lecturerWorkload: any = {};
      assignmentsData?.forEach(a => {
        // FIX: Added 'as any' to satisfy TypeScript
        const name = (a.profiles as any)?.full_name || 'Unknown';
        lecturerWorkload[name] = (lecturerWorkload[name] || 0) + 1;
      });
      
      const workloadChartData = Object.keys(lecturerWorkload).map(key => ({
        name: key.split(' ')[0],
        courses: lecturerWorkload[key]
      })).sort((a, b) => b.courses - a.courses).slice(0, 5);
      setWorkloadData(workloadChartData);

      // 4. Fetch Data for Attendance Rate
      const { data: recordsData } = await supabase.from('attendance_records').select('status');
      const presentCount = recordsData?.filter(r => r.status === 'present').length || 0;
      const absentCount = recordsData?.filter(r => r.status === 'absent').length || 0;
      const lateCount = recordsData?.filter(r => r.status === 'late').length || 0;
      
      setAttendanceData([
        { name: 'Present', value: presentCount, color: '#10b981' },
        { name: 'Absent', value: absentCount, color: '#ef4444' },
        { name: 'Late', value: lateCount, color: '#f59e0b' }
      ].filter(d => d.value > 0));

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="text-gray-500 p-8">Loading analytics...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Administrator Overview</h1>
        <p className="text-gray-500">System-wide statistics and analytics for ATU Smart Campus.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-blue-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Students</p>
            <p className="text-3xl font-bold text-gray-900">{stats.students}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-indigo-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Lecturers</p>
            <p className="text-3xl font-bold text-gray-900">{stats.lecturers}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><GraduationCap className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-green-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total Courses</p>
            <p className="text-3xl font-bold text-gray-900">{stats.courses}</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><BookOpen className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-purple-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Attendance Logs</p>
            <p className="text-3xl font-bold text-gray-900">{stats.attendance}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><ShieldCheck className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" /> Top 5 Course Enrollments
          </h3>
          <div className="h-72 w-full">
            {enrollmentData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">No enrollment data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={enrollmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Attendance Breakdown</h3>
          <div className="h-72 w-full flex items-center justify-center">
            {attendanceData.length === 0 ? (
              <div className="text-gray-400">No attendance data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attendanceData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 lg:col-span-3">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Lecturer Workload (Courses Assigned)</h3>
          <div className="h-64 w-full">
            {workloadData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">No assignment data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={80} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="courses" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/accounts" className="p-4 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors group">
            <h3 className="font-bold text-gray-900 group-hover:text-blue-700 mb-1 flex items-center justify-between">Create Account <ChevronRight className="w-4 h-4" /></h3>
            <p className="text-xs text-gray-500">Add a new student, lecturer, or admin.</p>
          </Link>
          <Link href="/dashboard/courses" className="p-4 border border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors group">
            <h3 className="font-bold text-gray-900 group-hover:text-green-700 mb-1 flex items-center justify-between">Add Course <ChevronRight className="w-4 h-4" /></h3>
            <p className="text-xs text-gray-500">Register a new course to the system.</p>
          </Link>
          <Link href="/dashboard/timetable" className="p-4 border border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors group">
            <h3 className="font-bold text-gray-900 group-hover:text-purple-700 mb-1 flex items-center justify-between">Manage Timetable <ChevronRight className="w-4 h-4" /></h3>
            <p className="text-xs text-gray-500">Schedule classes and room locations.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}