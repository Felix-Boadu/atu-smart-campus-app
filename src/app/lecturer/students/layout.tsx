'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const [studentName, setStudentName] = useState('Student');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // NEW
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setTimeout(() => { if (mounted) router.replace('/login'); }, 500); return; }
      
      const { data: profile } = await supabase.from('profiles').select('full_name, role, avatar_url').eq('id', session.user.id).single();
      if (profile?.role !== 'student') { if (mounted) router.replace('/login'); return; }
      
      if (mounted) {
        setStudentName(profile.full_name || 'Student');
        setAvatarUrl(profile.avatar_url || null);
        setLoading(false);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') router.replace('/login');
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const navItems = [
    { name: 'Dashboard', path: '/student', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'My Courses', path: '/student/courses', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { name: 'My Timetable', path: '/student/timetable', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { name: 'My Grades', path: '/student/grades', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'My Profile', path: '/student/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  ];

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex">
      
      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 w-full h-16 bg-[#123B72] text-white flex items-center justify-between px-4 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <span className="text-[#123B72] font-bold text-sm">A</span>
          </div>
          <span className="font-bold">ATU Student</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* SIDEBAR */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#123B72] text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-blue-800/50">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center mr-3">
              <span className="text-[#123B72] font-bold text-sm">A</span>
            </div>
            <span className="font-bold text-lg tracking-tight">ATU Student</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden p-1">
            <X className="w-6 h-6 text-blue-300" />
          </button>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-4">Main Menu</p>
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.name} 
                href={item.path} 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-[#1769AA] text-white font-semibold shadow-md' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path></svg>
                {item.name}
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-blue-800/50">
          <div className="mb-4 px-2 flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full object-cover border-2 border-blue-600" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#1769AA] flex items-center justify-center font-bold text-white border-2 border-blue-600">
                {studentName.substring(0, 1).toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-xs text-blue-300 uppercase leading-tight">Logged in as</p>
              <p className="font-semibold truncate leading-tight">{studentName}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full bg-blue-900/50 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full pt-20 pb-8 px-4 md:pt-8 md:pb-8 md:px-8 md:ml-64 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}