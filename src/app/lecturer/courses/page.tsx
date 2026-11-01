'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LecturerCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch assigned courses along with their enrollments count
      const { data, error } = await supabase
        .from('course_assignments')
        .select(`
          course_id,
          courses ( id, course_code, course_name, department, academic_year, semester, status )
        `)
        .eq('lecturer_id', session.user.id);

      if (data) {
        // For each course, we need to fetch the student count
        const coursesWithCounts = await Promise.all(data.map(async (item: any) => {
          const course = item.courses;
          
          const { count } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          return {
            ...course,
            studentCount: count || 0
          };
        }));
        setCourses(coursesWithCounts);
      }
      setLoading(false);
    };

    fetchCourses();
  }, []);

  if (loading) return <div className="text-gray-500">Loading your courses...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Courses</h1>
        <p className="text-gray-500">Manage and view all the courses assigned to you.</p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No courses assigned</h3>
          <p className="text-gray-500">You have not been assigned to any courses yet. Please contact the administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              {/* Card Header */}
              <div className="bg-blue-600 p-6 text-white relative">
                <div className="absolute top-4 right-4 bg-blue-500 px-2.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                  {course.status || 'Active'}
                </div>
                <h3 className="text-2xl font-bold mb-1">{course.course_code}</h3>
                <p className="text-blue-100 font-medium line-clamp-1">{course.course_name}</p>
              </div>
              
              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Department</p>
                    <p className="text-sm font-medium text-gray-800">{course.department || 'General'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Class Size</p>
                    <p className="text-sm font-medium text-gray-800">{course.studentCount} Students</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Academic Year</p>
                    <p className="text-sm font-medium text-gray-800">{course.academic_year || '2026/2027'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Semester</p>
                    <p className="text-sm font-medium text-gray-800">{course.semester || 'Semester 1'}</p>
                  </div>
                </div>

                {/* Card Footer */}
                <Link 
                  href={`/lecturer/courses/${course.id}`}
                  className="block w-full text-center bg-gray-50 hover:bg-blue-50 text-blue-700 font-bold py-3 rounded-xl border border-gray-200 hover:border-blue-200 transition-colors"
                >
                  View Course
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}