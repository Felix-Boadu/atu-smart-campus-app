'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', authData.user.id).single();

    if (profileError || !profile) {
      setError('Could not find user profile. Please contact the administrator.');
      setLoading(false);
      return;
    }

    if (profile.role === 'admin') router.push('/dashboard');
    else if (profile.role === 'lecturer') router.push('/lecturer');
    else router.push('/student');
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first to reset your password.');
      return;
    }
    
    setLoading(true); setError(''); setSuccessMsg('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) setError(error.message);
    else setSuccessMsg('Password reset link sent! Check your email inbox.');
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen relative bg-gray-50">
      
      {/* MOBILE BACKGROUND (Only shows on phones/tablets) */}
      <div className="absolute inset-0 lg:hidden bg-[url('/atu-campus.jpg')] bg-cover bg-center">
        {/* Dark blue overlay for readability */}
        <div className="absolute inset-0 bg-[#0A1628]/85"></div>
      </div>

      {/* LEFT SIDE: Branding (Only shows on Laptops) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-blue-900 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/atu-campus.jpg')] bg-cover bg-center"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628]/90 to-[#0A1628]/70 mix-blend-multiply"></div>
        
        <div className="relative z-10 flex flex-col justify-center w-full p-12 lg:p-20 text-white">
          <div className="mb-8 flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Accra Technical University</h1>
              <p className="text-blue-200 font-medium tracking-wide mt-1">SMART CAMPUS PORTAL</p>
            </div>
          </div>

          <div className="max-w-md mt-10">
            <h2 className="text-4xl font-extrabold mb-4 leading-tight">
              Welcome to the <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Future of Campus</span>
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed mb-8">
              The official digital platform for ATU students, lecturers, and administrators. Manage your courses, track attendance, and stay connected.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-md space-y-8 bg-white/95 backdrop-blur-md lg:bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20 lg:border-gray-100">
          
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-sm text-gray-500">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}
          {successMsg && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start">
              <p className="text-sm text-green-700 font-medium">{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" placeholder="you@atu.edu.gh" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" placeholder="••••••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" />
                <span className="text-sm text-gray-600 font-medium">Remember me</span>
              </label>
              
              <button type="button" onClick={handleForgotPassword} className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline transition">
                Forgot password?
              </button>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3.5 px-4 rounded-xl font-bold hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 mb-4">Use your official ATU email address to sign in.</p>
            <Link href="/" className="text-sm font-bold text-gray-700 hover:text-blue-600 transition">&larr; Back to Homepage</Link>
          </div>
        </div>
      </div>
    </div>
  );
}