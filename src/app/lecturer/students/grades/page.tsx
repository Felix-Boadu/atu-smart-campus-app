'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function StudentGrades() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch grades for this student, including the course name
      const { data } = await supabase
        .from('grades')
        .select(`id, assessment_name, score, max_score, courses ( course_code, course_name )`)
        .eq('student_id', session.user.id)
        .order('created_at', { ascending: false });

      if (data) setGrades(data);
      setLoading(false);
    };

    fetchGrades();
  }, []);

  if (loading) return <div className="text-gray-500">Loading your grades...</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Grades</h1>
        <p className="text-gray-500">View your assessment scores across all enrolled courses.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Course</th>
              <th className="p-4 font-semibold text-gray-600">Assessment</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Score</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Grade</th>
            </tr>
          </thead>
          <tbody>
            {grades.length === 0 ? (
              <tr><td colSpan={4} className="p-12 text-center text-gray-500">No grades have been published yet.</td></tr>
            ) : (
              grades.map((grade) => {
                const percentage = (grade.score / grade.max_score) * 100;
                let letterGrade = 'F';
                let color = 'text-red-600 bg-red-50';
                
                if (percentage >= 80) { letterGrade = 'A'; color = 'text-green-700 bg-green-50'; }
                else if (percentage >= 70) { letterGrade = 'B'; color = 'text-blue-700 bg-blue-50'; }
                else if (percentage >= 60) { letterGrade = 'C'; color = 'text-yellow-700 bg-yellow-50'; }
                else if (percentage >= 50) { letterGrade = 'D'; color = 'text-orange-700 bg-orange-50'; }

                return (
                  <tr key={grade.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{grade.courses?.course_code}</p>
                      <p className="text-xs text-gray-500">{grade.courses?.course_name}</p>
                    </td>
                    <td className="p-4 font-medium text-gray-700">{grade.assessment_name}</td>
                    <td className="p-4 text-right">
                      <span className="font-bold text-gray-900">{grade.score}</span>
                      <span className="text-gray-400 text-sm"> / {grade.max_score}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${color}`}>
                        {letterGrade}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}