'use client';

import Link from 'next/link';
import { GraduationCap, Menu, ArrowRight, ArrowDown, X, UserCog } from 'lucide-react';
import { useState } from 'react';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A1628] text-white flex flex-col font-sans relative">
      
      {/* Top Navigation */}
      <header className="w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-xl">
            <GraduationCap className="w-6 h-6 text-[#0A1628]" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-wide">ATU SMART CAMPUS</span>
            <span className="text-[10px] text-blue-300 font-medium tracking-widest uppercase">Accra Technical University</span>
          </div>
        </div>
        
        {/* Menu Button */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-white hover:text-blue-300 transition p-2">
          {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>

        {/* Dropdown Menu */}
        {menuOpen && (
          <div className="absolute top-20 right-6 bg-white text-gray-900 rounded-xl shadow-2xl w-56 overflow-hidden border border-gray-100">
            <div className="p-2">
              <Link href="/login" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 rounded-lg transition font-semibold">
                <GraduationCap className="w-5 h-5 text-blue-600" /> Student / Lecturer
              </Link>
              <Link href="/login" className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 rounded-lg transition font-semibold">
                <UserCog className="w-5 h-5 text-purple-600" /> Admin Portal
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 pt-10 pb-12 flex flex-col relative z-10">
        
        {/* Hero Text */}
        <div className="mb-10 max-w-2xl">
          <p className="text-[#3B82F6] text-xs font-bold tracking-widest uppercase mb-4">
            Welcome to ATU Smart Campus
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-6 tracking-tight">
            Your Campus. Your Learning.<br />
            One Smart Platform.
          </h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-8 max-w-xl">
            Experience a smarter way to connect with your academic world. Access courses, manage attendance, stay updated and connect with lecturers and students — all in one place.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 mb-12 max-w-2xl">
          <Link 
            href="/login" 
            className="flex items-center justify-center w-full bg-white text-[#0A1628] font-bold py-4 rounded-xl hover:bg-gray-100 transition shadow-lg"
          >
            Access Student Portal <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          
          <Link 
            href="/login" 
            className="flex items-center justify-center w-full border-2 border-white/80 text-white font-bold py-4 rounded-xl hover:bg-white/10 transition"
          >
            Access Lecturer Portal <ArrowRight className="w-5 h-5 ml-2" />
          </Link>

          <div className="pt-4 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center font-bold text-white hover:text-blue-300 transition"
            >
              Explore Smart Campus <ArrowDown className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Campus Image */}
        <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
          <img 
            src="/atu-campus.jpg" 
            alt="Accra Technical University Campus" 
            className="w-full h-[300px] md:h-[450px] object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* Watermark Badge */}
          <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
            <span className="text-xs font-semibold tracking-wide">atu.edu.gh</span>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full text-center py-8 text-xs text-gray-500 font-medium border-t border-white/5">
        Accra Technical University
      </footer>

    </div>
  );
}