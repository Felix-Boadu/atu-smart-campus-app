'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Mail, ArrowRight, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 1. Check if the email is registered in our database
    const { data: exists, error: rpcError } = await supabase.rpc('check_email_exists', {
      email_to_check: email.trim()
    });

    if (rpcError) {
      setError('An error occurred. Please try again later.');
      setLoading(false);
      return;
    }

    if (!exists) {
      setError('Email not registered. Please check the spelling or contact the administrator.');
      setLoading(false);
      return;
    }

    // 2. If email exists, send the reset link
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Forgot Password?</h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter your official ATU email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg mb-6 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {success ? (
          <div className="text-center">
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100 mb-6">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-green-900 mb-1">Check your email</h3>
              <p className="text-sm text-green-700">
                A password reset link has been sent to your email address.
              </p>
            </div>
            <Link href="/login" className="w-full block bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  placeholder="you@atu.edu.gh"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Send Reset Link'} <ArrowRight className="w-5 h-5" />
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