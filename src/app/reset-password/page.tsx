'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    // When the user clicks the email link, Supabase automatically logs them in 
    // with a temporary session. We check if that session exists.
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      }
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password.length < 12) {
      setError('Password must be at least 12 characters long.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    // Update the user's password
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      // Log them out so they can log in fresh with the new password
      setTimeout(async () => {
        await supabase.auth.signOut();
        router.push('/login');
      }, 3000);
    }
    setLoading(false);
  };

  if (checkingSession) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Verifying secure link...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
          <p className="text-sm text-gray-500 mt-2">Please enter your new secure password below.</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg mb-6">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success ? (
          <div className="text-center">
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-900 mb-1">Password Updated!</h3>
              <p className="text-sm text-green-700">Your password has been changed successfully. Redirecting to login...</p>
            </div>
          </div>
        ) : !isValidSession ? (
          /* Invalid or expired link */
          <div className="text-center bg-red-50 p-6 rounded-2xl border border-red-100">
            <p className="text-sm text-red-700 font-medium mb-4">This password reset link is invalid or has expired.</p>
            <Link href="/login" className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 transition">
              Return to Login
            </Link>
          </div>
        ) : (
          /* The Form */
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={12}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Min 12 characters"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={12}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="Re-type password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'} <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        {/* Footer Link */}
        {!success && (
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm font-semibold text-gray-500 hover:text-blue-600 transition">
              &larr; Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}