'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import { exportToCSV } from '@/utils/exportToCSV';

export default function CourseDetail() {
  const params = useParams();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]); 
  
  const [assessmentName, setAssessmentName] = useState('Midterm Exam');
  const [maxScore, setMaxScore] = useState(100);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');

  const fetchMaterials = async () => {
    const { data } = await supabase.from('course_materials').select('*').eq('course_id', courseId).order('created_at', { ascending: false });
    if (data) setMaterials(data);
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      const { data: courseData } = await supabase.from('courses').select('*').eq('id', courseId).single();
      if (courseData) setCourse(courseData);

      const { data: enrolledData } = await supabase.from('enrollments').select(`student_id, profiles ( full_name, email )`).eq('course_id', courseId);
      if (enrolledData) setStudents(enrolledData.map((e: any) => ({ id: e.student_id, ...e.profiles })));

      const { data: sessionData } = await supabase.from('attendance_sessions').select(`*`).eq('course_id', courseId).order('created_at', { ascending: false });
      if (sessionData) setSessions(sessionData);

      const { data: gradeData } = await supabase.from('grades').select('*').eq('course_id', courseId);
      if (gradeData) setGrades(gradeData);

      await fetchMaterials();
      setLoading(false);
    };
    if (courseId) fetchCourseData();
  }, [courseId]);

  // --- EXPORT FUNCTIONS ---
  const exportAttendance = () => {
    const data = sessions.map(s => ({
      Date: new Date(s.created_at).toLocaleString(),
      Code: s.code,
      Status: s.is_active ? 'Active' : 'Closed'
    }));
    exportToCSV(data, ['Date', 'Code', 'Status'], `${course?.course_code}_Attendance_History`);
  };

  const exportGrades = () => {
    const data = students.map(student => {
      const grade = grades.find(g => g.student_id === student.id && g.assessment_name === assessmentName);
      return {
        StudentName: student.full_name,
        Email: student.email,
        Assessment: assessmentName,
        Score: grade ? grade.score : 'Not Graded',
        MaxScore: maxScore
      };
    });
    exportToCSV(data, ['StudentName', 'Email', 'Assessment', 'Score', 'MaxScore'], `${course?.course_code}_${assessmentName.replace(/\s+/g, '_')}_Grades`);
  };
  // ------------------------

  const handleGradeChange = async (studentId: string, scoreStr: string) => {
    const score = parseFloat(scoreStr);
    if (isNaN(score)) return;
    const existingGrade = grades.find(g => g.student_id === studentId && g.assessment_name === assessmentName);

    if (existingGrade) {
      await supabase.from('grades').update({ score, max_score: maxScore }).eq('id', existingGrade.id);
      setGrades(grades.map(g => g.id === existingGrade.id ? { ...g, score, max_score: maxScore } : g));
    } else {
      const { data } = await supabase.from('grades').insert([{ course_id: courseId, student_id: studentId, assessment_name: assessmentName, score, max_score: maxScore }]).select().single();
      if (data) setGrades([...grades, data]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !uploadTitle) return;
    setUploading(true);
    const file = e.target.files[0];
    const filePath = `${courseId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from('materials').upload(filePath, file);
    if (uploadError) { alert(uploadError.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('materials').getPublicUrl(filePath);
    await supabase.from('course_materials').insert([{ course_id: courseId, title: uploadTitle, file_url: urlData.publicUrl }]);

    setUploadTitle('');
    await fetchMaterials();
    setUploading(false);
  };

  const handleDeleteMaterial = async (id: string, url: string) => {
    if (!window.confirm("Delete this file?")) return;
    await supabase.from('course_materials').delete().eq('id', id);
    const path = url.split('/').pop();
    if (path) await supabase.storage.from('materials').remove([`${courseId}/${path}`]);
    fetchMaterials();
  };

  if (loading) return <div className="text-gray-500 p-8">Loading course details...</div>;
  if (!course) return <div className="text-red-500 p-8">Course not found.</div>;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="mb-8">
        <Link href="/lecturer/courses" className="text-sm font-semibold text-blue-600 hover:text-blue-800 mb-4 inline-block">&larr; Back to My Courses</Link>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">{course.course_code}: {course.course_name}</h1>
            <p className="text-gray-500">{course.department || 'General Department'} • {course.academic_year || '2026/2027'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto whitespace-nowrap">
        <button onClick={() => setActiveTab('students')} className={`pb-4 font-semibold transition-colors ${activeTab === 'students' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>Enrolled Students ({students.length})</button>
        <button onClick={() => setActiveTab('attendance')} className={`pb-4 font-semibold transition-colors ${activeTab === 'attendance' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>Attendance ({sessions.length})</button>
        <button onClick={() => setActiveTab('grades')} className={`pb-4 font-semibold transition-colors ${activeTab === 'grades' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>Grades</button>
        <button onClick={() => setActiveTab('materials')} className={`pb-4 font-semibold transition-colors ${activeTab === 'materials' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-500 hover:text-gray-900'}`}>Materials ({materials.length})</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr><th className="p-4 font-semibold text-gray-600">Student Name</th><th className="p-4 font-semibold text-gray-600">Email Address</th></tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={2} className="p-8 text-center text-gray-500">No students enrolled.</td></tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4 font-bold text-gray-900">{student.full_name}</td>
                      <td className="p-4 text-gray-600">{student.email}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div>
            <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-end">
              <button onClick={exportAttendance} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-50 transition shadow-sm text-sm">
                <Download className="w-4 h-4" /> Export Attendance
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white border-b border-gray-100">
                  <tr><th className="p-4 font-semibold text-gray-600">Date</th><th className="p-4 font-semibold text-gray-600">Code</th><th className="p-4 font-semibold text-gray-600">Status</th></tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-500">No attendance sessions created yet.</td></tr>
                  ) : (
                    sessions.map((session) => (
                      <tr key={session.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="p-4 text-gray-900 font-medium">{new Date(session.created_at).toLocaleString()}</td>
                        <td className="p-4 font-mono font-bold text-blue-700">{session.code}</td>
                        <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${session.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{session.is_active ? 'Active' : 'Closed'}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GRADES TAB */}
        {activeTab === 'grades' && (
          <div>
            <div className="p-6 bg-blue-50 border-b border-blue-100 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Assessment Name</label>
                  <select value={assessmentName} onChange={e => setAssessmentName(e.target.value)} className="p-2 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[200px]">
                    <option value="Quiz 1">Quiz 1</option>
                    <option value="Assignment 1">Assignment 1</option>
                    <option value="Midterm Exam">Midterm Exam</option>
                    <option value="Final Exam">Final Exam</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Max Score</label>
                  <input type="number" value={maxScore} onChange={e => setMaxScore(Number(e.target.value))} className="p-2 w-24 rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
                </div>
              </div>
              <button onClick={exportGrades} className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition shadow-sm text-sm">
                <Download className="w-4 h-4" /> Export Grades
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr><th className="p-4 font-semibold text-gray-600">Student Name</th><th className="p-4 font-semibold text-gray-600 text-right">Score (out of {maxScore})</th></tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan={2} className="p-8 text-center text-gray-500">No students enrolled.</td></tr>
                  ) : (
                    students.map((student) => {
                      const gradeRecord = grades.find(g => g.student_id === student.id && g.assessment_name === assessmentName);
                      return (
                        <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="p-4 font-bold text-gray-900">{student.full_name}</td>
                          <td className="p-4 text-right">
                            <input type="number" placeholder="--" defaultValue={gradeRecord ? gradeRecord.score : ''} onBlur={(e) => handleGradeChange(student.id, e.target.value)} className="w-24 p-2 text-center font-bold text-lg rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MATERIALS TAB */}
        {activeTab === 'materials' && (
          <div className="p-6">
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-blue-900 mb-2">Upload New Material</label>
                <input type="text" placeholder="e.g. Week 1 - Lecture Slides" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} className="w-full p-2.5 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="w-full md:w-auto">
                <label className={`cursor-pointer w-full justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold transition flex items-center gap-2 ${(!uploadTitle || uploading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Choose File'}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={!uploadTitle || uploading} />
                </label>
              </div>
            </div>

            <div className="space-y-3">
              {materials.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No materials uploaded yet.</div>
              ) : (
                materials.map((mat) => (
                  <div key={mat.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100/50 transition gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                      <div>
                        <p className="font-bold text-gray-900">{mat.title}</p>
                        <p className="text-xs text-gray-500">{new Date(mat.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <a href={mat.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:border-blue-300 transition">Download</a>
                      <button onClick={() => handleDeleteMaterial(mat.id, mat.file_url)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}