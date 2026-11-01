'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Users } from 'lucide-react';

export default function LecturerStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // 1. Get the lecturer's assigned course IDs
        const { data: assignments, error: assignError } = await supabase
          .from('course_assignments')
          .select('course_id')
          .eq('lecturer_id', session.user.id);

        if (assignError) throw assignError;
        if (!assignments || assignments.length === 0) { setLoading(false); return; }

        const courseIds = assignments.map(a => a.course_id);

        // 2. Get enrollments for those courses
        const { data: enrollments, error: enrollError } = await supabase
          .from('enrollments')
          .select('student_id, course_id')
          .in('course_id', courseIds);

        if (enrollError) throw enrollError;
        if (!enrollments || enrollments.length === 0) { setLoading(false); return; }

        // 3. Fetch profiles and courses in parallel
        const studentIds = [...new Set(enrollments.map(e => e.student_id))];
        
        const [profilesRes, coursesRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name, email').in('id', studentIds),
          supabase.from('courses').select('id, course_code').in('id', courseIds)
        ]);

        const profiles = profilesRes.data || [];
        const courses = coursesRes.data || [];

        // 4. Group by student safely
        const studentMap = new Map();
        enrollments.forEach((e) => {
          if (!studentMap.has(e.student_id)) {
            const profile = profiles.find(p => p.id === e.student_id);
            studentMap.set(e.student_id, {
              id: e.student_id,
              full_name: profile?.full_name || 'Unknown Student',
              email: profile?.email || 'No email',
              courses: []
            });
          }
          const course = courses.find(c => c.id === e.course_id);
          if (course && studentMap.get(e.student_id)) {
             studentMap.get(e.student_id).courses.push(course.course_code);
          }
        });

        setStudents(Array.from(studentMap.values()));
      } catch (err) {
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student => 
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="text-gray-500 p-8">Loading your students...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Students</h1>
          <p className="text-gray-500">View all students enrolled in your assigned courses.</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
          <input 
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Student Name</th>
              <th className="p-4 font-semibold text-gray-600">Email Address</th>
              <th className="p-4 font-semibold text-gray-600">Enrolled Courses</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Users className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-lg font-medium text-gray-900">
                      {students.length === 0 ? "No students enrolled yet" : "No students match your search"}
                    </p>
                    <p className="text-sm">
                      {students.length === 0 ? "Students will appear here once they are enrolled in your courses." : "Try adjusting your search terms."}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="p-4 font-bold text-gray-900">{student.full_name}</td>
                  <td className="p-4 text-gray-600">{student.email}</td>
                  <td className="p-4">
                    <div className="flex gap-2 flex-wrap">
                      {student.courses.map((courseCode: string, idx: number) => (
                        <span key={idx} className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100">
                          {courseCode}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}