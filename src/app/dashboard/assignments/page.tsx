'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Toast } from '@/app/components/Toast';
import { ConfirmModal } from '@/app/components/ConfirmModal';
import { Search, ChevronRight, UserPlus, Link2, Trash2, GraduationCap, Users } from 'lucide-react';
import Link from 'next/link';

export default function ManageAssignments() {
  const [courses, setCourses] = useState<any[]>([]);
  const [lecturers, setLecturers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'lecturers' | 'students'>('lecturers');
  
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', action: () => {}, isDestructive: false, confirmText: 'Confirm' });

  // Form State
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedLecturer, setSelectedLecturer] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');

  // Search State
  const [searchLecturer, setSearchLecturer] = useState('');
  const [searchStudent, setSearchStudent] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [coursesRes, lecturersRes, studentsRes] = await Promise.all([
      supabase.from('courses').select('*').order('course_code'),
      supabase.from('profiles').select('*').eq('role', 'lecturer').order('full_name'),
      supabase.from('profiles').select('*').eq('role', 'student').order('full_name'),
    ]);
    if (coursesRes.data) setCourses(coursesRes.data);
    if (lecturersRes.data) setLecturers(lecturersRes.data);
    if (studentsRes.data) setStudents(studentsRes.data);

    const [assignRes, enrollRes] = await Promise.all([
      supabase.from('course_assignments').select(`id, courses(course_code, course_name), profiles(full_name, email)`).order('created_at', { ascending: false }),
      supabase.from('enrollments').select(`id, courses(course_code, course_name), profiles(full_name, email)`).order('created_at', { ascending: false })
    ]);
    if (assignRes.data) setAssignments(assignRes.data);
    if (enrollRes.data) setEnrollments(enrollRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssignLecturer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setToast(null);

    const { error } = await supabase.from('course_assignments').insert([{ course_id: selectedCourse, lecturer_id: selectedLecturer }]);
    
    if (error) {
      if (error.code === '23505') setToast({ type: 'error', text: 'This lecturer is already assigned to this course.' });
      else setToast({ type: 'error', text: error.message });
    } else {
      setToast({ type: 'success', text: 'Lecturer assigned successfully!' });
      fetchData(); 
      setSelectedCourse(''); 
      setSelectedLecturer('');
    }
    setSubmitting(false);
  };

  const handleEnrollStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setToast(null);

    const { error } = await supabase.from('enrollments').insert([{ course_id: selectedCourse, student_id: selectedStudent }]);
    
    if (error) {
      if (error.code === '23505') setToast({ type: 'error', text: 'This student is already enrolled in this course.' });
      else setToast({ type: 'error', text: error.message });
    } else {
      setToast({ type: 'success', text: 'Student enrolled successfully!' });
      fetchData(); 
      setSelectedCourse(''); 
      setSelectedStudent('');
    }
    setSubmitting(false);
  };

  const handleRemoveAssignment = (id: string, lecturerName: string) => {
    setModalConfig({
      isOpen: true, title: 'Remove Lecturer', confirmText: 'Remove', isDestructive: true,
      message: `Are you sure you want to remove ${lecturerName} from this course?`,
      action: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        const { error } = await supabase.from('course_assignments').delete().eq('id', id);
        if (!error) {
          setAssignments(assignments.filter(a => a.id !== id));
          setToast({ type: 'success', text: 'Assignment removed.' });
        } else {
          setToast({ type: 'error', text: error.message });
        }
      }
    });
  };

  const handleRemoveEnrollment = (id: string, studentName: string) => {
    setModalConfig({
      isOpen: true, title: 'Remove Student', confirmText: 'Remove', isDestructive: true,
      message: `Are you sure you want to remove ${studentName} from this course?`,
      action: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        const { error } = await supabase.from('enrollments').delete().eq('id', id);
        if (!error) {
          setEnrollments(enrollments.filter(e => e.id !== id));
          setToast({ type: 'success', text: 'Enrollment removed.' });
        } else {
          setToast({ type: 'error', text: error.message });
        }
      }
    });
  };

  const filteredAssignments = assignments.filter(a => 
    a.courses?.course_code.toLowerCase().includes(searchLecturer.toLowerCase()) || 
    a.profiles?.full_name.toLowerCase().includes(searchLecturer.toLowerCase())
  );

  const filteredEnrollments = enrollments.filter(e => 
    e.courses?.course_code.toLowerCase().includes(searchStudent.toLowerCase()) || 
    e.profiles?.full_name.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}
      <ConfirmModal 
        isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} 
        confirmText={modalConfig.confirmText} isDestructive={modalConfig.isDestructive}
        onConfirm={modalConfig.action} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />

      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600 transition">Admin</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Course Management</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Assignments</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button 
          onClick={() => { setActiveTab('lecturers'); setToast(null); }}
          className={`pb-4 px-6 font-bold text-lg transition-colors flex items-center gap-2 ${activeTab === 'lecturers' ? 'text-blue-700 border-b-4 border-blue-700' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <UserPlus className="w-5 h-5" />
          Lecturer Assignments ({assignments.length})
        </button>
        <button 
          onClick={() => { setActiveTab('students'); setToast(null); }}
          className={`pb-4 px-6 font-bold text-lg transition-colors flex items-center gap-2 ${activeTab === 'students' ? 'text-green-700 border-b-4 border-green-700' : 'text-gray-500 hover:text-gray-900'}`}
        >
          <GraduationCap className="w-5 h-5" />
          Student Enrollments ({enrollments.length})
        </button>
      </div>

      {/* LECTURER TAB */}
      {activeTab === 'lecturers' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-blue-600" /> Assign Lecturer to Course
            </h3>
            <form onSubmit={handleAssignLecturer} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Course</label>
                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a Course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>)}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Lecturer</label>
                <select value={selectedLecturer} onChange={(e) => setSelectedLecturer(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a Lecturer...</option>
                  {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name} ({l.email})</option>)}
                </select>
              </div>
              <button type="submit" disabled={submitting} className="w-full md:w-auto bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50">
                Assign
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Current Assignments</h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input type="text" placeholder="Search..." value={searchLecturer} onChange={(e) => setSearchLecturer(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-white border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-600">Course</th>
                  <th className="p-4 font-semibold text-gray-600">Assigned Lecturer</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredAssignments.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-500">No assignments found.</td></tr>
                ) : (
                  filteredAssignments.map(a => (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4">
                        <p className="font-bold text-blue-700">{a.courses?.course_code}</p>
                        <p className="text-xs text-gray-500">{a.courses?.course_name}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{a.profiles?.full_name}</p>
                        <p className="text-xs text-gray-500">{a.profiles?.email}</p>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleRemoveAssignment(a.id, a.profiles?.full_name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STUDENT TAB */}
      {activeTab === 'students' && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Link2 className="w-5 h-5 text-green-600" /> Enroll Student in Course
            </h3>
            <form onSubmit={handleEnrollStudent} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Course</label>
                <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select a Course...</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.course_code} - {c.course_name}</option>)}
                </select>
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Student</label>
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required className="w-full p-2.5 border border-gray-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select a Student...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.email})</option>)}
                </select>
              </div>
              <button type="submit" disabled={submitting} className="w-full md:w-auto bg-green-600 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-green-700 transition disabled:opacity-50">
                Enroll
              </button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-900">Current Enrollments</h3>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input type="text" placeholder="Search..." value={searchStudent} onChange={(e) => setSearchStudent(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>
            <table className="w-full text-left">
              <thead className="bg-white border-b border-gray-100">
                <tr>
                  <th className="p-4 font-semibold text-gray-600">Course</th>
                  <th className="p-4 font-semibold text-gray-600">Enrolled Student</th>
                  <th className="p-4 font-semibold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-500">Loading...</td></tr>
                ) : filteredEnrollments.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-gray-500">No enrollments found.</td></tr>
                ) : (
                  filteredEnrollments.map(e => (
                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="p-4">
                        <p className="font-bold text-green-700">{e.courses?.course_code}</p>
                        <p className="text-xs text-gray-500">{e.courses?.course_name}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{e.profiles?.full_name}</p>
                        <p className="text-xs text-gray-500">{e.profiles?.email}</p>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleRemoveEnrollment(e.id, e.profiles?.full_name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}