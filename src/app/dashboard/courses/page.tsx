'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Toast } from '@/app/components/Toast';
import { ConfirmModal } from '@/app/components/ConfirmModal';
import { Search, ChevronRight, BookOpen, Edit, Trash2, Plus, Users, GraduationCap } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  course_code: string;
  course_name: string;
  department: string | null;
  semester: string | null;
  lecturerCount?: number;
  studentCount?: number;
}

export default function ManageCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Toast & Modal State
  const [toast, setToast] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', message: '', action: () => {}, isDestructive: false, confirmText: 'Confirm' });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('Semester 1');

  const fetchCourses = async () => {
    setLoading(true);
    const { data: coursesData, error } = await supabase.from('courses').select('*').order('course_code');
    
    if (error) {
      setToast({ type: 'error', text: error.message });
    } else if (coursesData) {
      const [assignRes, enrollRes] = await Promise.all([
        supabase.from('course_assignments').select('course_id'),
        supabase.from('enrollments').select('course_id')
      ]);

      const assignments = assignRes.data || [];
      const enrollments = enrollRes.data || [];

      const coursesWithCounts = coursesData.map(course => ({
        ...course,
        lecturerCount: assignments.filter(a => a.course_id === course.id).length,
        studentCount: enrollments.filter(e => e.course_id === course.id).length
      }));

      setCourses(coursesWithCounts as Course[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setCourseCode('');
    setCourseName('');
    setDepartment('');
    setSemester('Semester 1');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setModalConfig({
      isOpen: true,
      title: editingId ? 'Update Course' : 'Create Course',
      confirmText: editingId ? 'Save Changes' : 'Create',
      message: `Are you sure you want to ${editingId ? 'update' : 'create'} ${courseCode}?`,
      isDestructive: false,
      action: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setSubmitting(true);

        const payload = {
          course_code: courseCode.toUpperCase(),
          course_name: courseName,
          department: department,
          semester: semester
        };

        let error;
        if (editingId) {
          const res = await supabase.from('courses').update(payload).eq('id', editingId);
          error = res.error;
        } else {
          const res = await supabase.from('courses').insert([payload]);
          error = res.error;
        }

        if (error) {
          if (error.code === '23505') setToast({ type: 'error', text: 'A course with this code already exists.' });
          else setToast({ type: 'error', text: error.message });
        } else {
          setToast({ type: 'success', text: editingId ? 'Course updated successfully!' : 'Course added successfully!' });
          resetForm();
          fetchCourses();
        }
        setSubmitting(false);
      }
    });
  };

  const handleEdit = (course: Course) => {
    setEditingId(course.id);
    setCourseCode(course.course_code);
    setCourseName(course.course_name);
    setDepartment(course.department || '');
    setSemester(course.semester || 'Semester 1');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string, code: string) => {
    setModalConfig({
      isOpen: true,
      title: 'Delete Course',
      confirmText: 'Delete',
      isDestructive: true,
      message: `Are you sure you want to delete ${code}? This will permanently remove all assignments, enrollments, and attendance records for this course.`,
      action: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        const { error } = await supabase.from('courses').delete().eq('id', id);
        if (error) {
          setToast({ type: 'error', text: error.message });
        } else {
          setToast({ type: 'success', text: 'Course deleted successfully.' });
          setCourses(courses.filter(c => c.id !== id));
        }
      }
    });
  };

  const filteredCourses = courses.filter(c => 
    c.course_code.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {toast && <Toast type={toast.type} message={toast.text} onClose={() => setToast(null)} />}
      <ConfirmModal 
        isOpen={modalConfig.isOpen} title={modalConfig.title} message={modalConfig.message} 
        confirmText={modalConfig.confirmText} isDestructive={modalConfig.isDestructive}
        onConfirm={modalConfig.action} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} 
      />

      {/* Breadcrumbs */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-blue-600 transition">Admin</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Academic Management</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Manage Courses</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BookOpen className="w-5 h-5" /></div>
          <div><p className="text-xs text-gray-500 font-semibold uppercase">Total Courses</p><p className="text-xl font-bold text-gray-900">{courses.length}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Users className="w-5 h-5" /></div>
          <div><p className="text-xs text-gray-500 font-semibold uppercase">Total Assignments</p><p className="text-xl font-bold text-gray-900">{courses.reduce((acc, curr) => acc + (curr.lecturerCount || 0), 0)}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg"><GraduationCap className="w-5 h-5" /></div>
          <div><p className="text-xs text-gray-500 font-semibold uppercase">Total Enrollments</p><p className="text-xl font-bold text-gray-900">{courses.reduce((acc, curr) => acc + (curr.studentCount || 0), 0)}</p></div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          {editingId ? <Edit className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
          {editingId ? 'Edit Course' : 'Add New Course'}
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Course Code</label>
            <input type="text" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} placeholder="CSC 101" required className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase" />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Course Name</label>
            <input type="text" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="Introduction to Programming" required className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
            <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Computer Science" className="w-full p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Semester</label>
            <select value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-xl bg-white outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Semester 1">Semester 1</option>
              <option value="Semester 2">Semester 2</option>
            </select>
          </div>
          <div className="md:col-span-1 flex gap-2">
            <button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50">
              {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-200 transition">
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">All Courses</h3>
          <div className="relative w-full md:w-80">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            <input type="text" placeholder="Search courses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-white border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Course Info</th>
                <th className="p-4 font-semibold text-gray-600">Dept / Semester</th>
                <th className="p-4 font-semibold text-gray-600 text-center">Lecturers</th>
                <th className="p-4 font-semibold text-gray-600 text-center">Students</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-gray-500">Loading courses...</td></tr>
              ) : filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <BookOpen className="w-12 h-12 mb-3 text-gray-300" />
                      <p className="text-lg font-medium text-gray-900">No courses found</p>
                      <p className="text-sm">Try adjusting your search or add a new course.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-blue-700">{course.course_code}</p>
                      <p className="text-sm text-gray-800 font-medium">{course.course_name}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-gray-900">{course.department || 'General'}</p>
                      <p className="text-xs text-gray-500">{course.semester || 'N/A'}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-lg">{course.lecturerCount}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="inline-block bg-green-50 text-green-700 font-bold px-3 py-1 rounded-lg">{course.studentCount}</span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button onClick={() => handleEdit(course)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(course.id, course.course_code)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
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
    </div>
  );
}