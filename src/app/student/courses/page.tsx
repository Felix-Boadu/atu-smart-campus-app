'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen } from 'lucide-react';
import Link from 'next/link'; // <-- Added this import

export default function StudentCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch enrollments, including course details
      const { data } = await supabase
        .from('enrollments')
        .select(`
          course_id,
          courses ( id, course_code, course_name, department )
        `)
        .eq('student_id', session.user.id);

      if (data) {
        const formatted = data.map((e: any) => ({
          id: e.course_id,
          code: e.courses.course_code,
          name: e.courses.course_name,
          department: e.courses.department || 'General',
        }));
        setCourses(formatted);
      }
      setLoading(false);
    };
    fetchCourses();
  }, []);

  if (loading) return <div className="text-gray-500">Loading your courses...</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
        <p className="text-gray-500">View all the courses you are currently enrolled in.</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-1">No courses found</h3>
          <p className="text-gray-500">You are not enrolled in any courses for this semester.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-[#1769AA] p-6 text-white">
                <h3 className="text-2xl font-bold mb-1">{course.code}</h3>
                <p className="text-blue-100 font-medium line-clamp-1">{course.name}</p>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                  <span className="font-semibold text-gray-400 uppercase tracking-wider text-xs">Department</span>
                  <span className="font-medium text-gray-800">{course.department}</span>
                </div>
                
                {/* THIS IS THE UPDATED LINK */}
                <Link 
                  href={`/student/courses/${course.id}`}
                  className="block w-full text-center bg-gray-50 hover:bg-[#1769AA] text-[#1769AA] hover:text-white font-bold py-2.5 rounded-xl border border-gray-200 hover:border-[#1769AA] transition-colors"
                >
                  View Course Material
                </Link>

              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}