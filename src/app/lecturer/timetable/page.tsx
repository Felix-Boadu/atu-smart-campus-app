'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Clock, MapPin, Calendar } from 'lucide-react';

export default function LecturerTimetable() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Get lecturer assignments
      const { data: assignments } = await supabase.from('course_assignments').select('course_id').eq('lecturer_id', session.user.id);
      
      if (assignments && assignments.length > 0) {
        const courseIds = assignments.map(a => a.course_id);
        // 2. Get timetable for these courses
        const { data } = await supabase.from('timetable').select(`*, courses(course_code, course_name)`).in('course_id', courseIds);
        
        if (data) {
          const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          setTimetable(data.sort((a, b) => {
            const dayDiff = daysOrder.indexOf(a.day_of_week) - daysOrder.indexOf(b.day_of_week);
            if (dayDiff !== 0) return dayDiff;
            return a.start_time.localeCompare(b.start_time);
          }));
        }
      }
      setLoading(false);
    };
    fetchTimetable();
  }, []);

  if (loading) return <div className="text-gray-500">Loading your timetable...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Timetable</h1>
        <p className="text-gray-500">Your weekly teaching schedule.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Weekly Schedule</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {timetable.length === 0 ? (
            <div className="p-12 text-center text-gray-500">You have no scheduled classes yet.</div>
          ) : (
            timetable.map((entry) => (
              <div key={entry.id} className="p-5 flex items-center gap-6 hover:bg-gray-50/30 transition">
                <div className="w-24 text-center bg-blue-50 rounded-xl py-3 border border-blue-100">
                  <p className="text-sm font-bold text-blue-700 uppercase">{entry.day_of_week.substring(0, 3)}</p>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg">{entry.courses?.course_code}</p>
                  <p className="text-gray-600 mb-2">{entry.courses?.course_name}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> {entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> {entry.location}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}