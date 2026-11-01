'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FileText, Download, ArrowLeft } from 'lucide-react';

export default function StudentCourseView() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Course Info
      const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (courseData) setCourse(courseData);

      // Fetch Materials
      const { data: matData } = await supabase.from('course_materials').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
      if (matData) setMaterials(matData);

      setLoading(false);
    };
    if (courseId) fetchData();
  }, [courseId]);

  if (loading) return <div className="text-gray-500">Loading materials...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Link href="/student/courses" className="text-sm font-semibold text-[#1769AA] hover:underline mb-6 inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to My Courses
      </Link>

      <div className="bg-[#123B72] p-8 rounded-3xl text-white mb-8 shadow-md">
        <h1 className="text-3xl font-bold mb-2">{course?.course_code}</h1>
        <p className="text-blue-100 text-lg">{course?.course_name}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Course Materials & Resources</h2>
        
        <div className="space-y-4">
          {materials.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No materials have been uploaded for this course yet.</p>
            </div>
          ) : (
            materials.map((mat) => (
              <div key={mat.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-5 border border-gray-100 rounded-xl hover:bg-gray-50 transition gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 text-[#1769AA] rounded-lg"><FileText className="w-6 h-6" /></div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{mat.title}</p>
                    <p className="text-xs text-gray-500 mt-1">Uploaded {new Date(mat.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <a 
                  href={mat.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-[#1769AA] hover:bg-blue-800 text-white font-bold px-6 py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}