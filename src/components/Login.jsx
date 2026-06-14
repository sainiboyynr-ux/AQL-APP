import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const { login, error: authError } = useAuth();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employeeId.trim()) {
      setError('Employee ID is required.');
      return;
    }
    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(employeeId.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-height-100vh flex flex-col justify-between p-6 max-w-md mx-auto w-full select-none">
      
      {/* Top spacing */}
      <div className="flex-1 flex flex-col justify-center items-center py-10">
        
        {/* Brand/Logo Section */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30 mx-auto mb-4 animate-pulse-glow">
            <span className="text-3xl font-extrabold text-white font-display tracking-wider">ES</span>
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 dark:text-white m-0">
            ESME CONSUMER
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest font-semibold">
            Quality Assurance Portal
          </p>
        </div>

        {/* Login Card (Glassmorphism inspired) */}
        <div className="w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-lg font-bold font-display text-slate-800 dark:text-slate-200 mb-5">
            QA Executive Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input - Employee ID */}
            <div className="space-y-1">
              <label 
                htmlFor="employeeId"
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 block"
              >
                Employee ID
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User className="w-5 h-5" />
                </span>
                <input
                  id="employeeId"
                  type="text"
                  placeholder="e.g. EMP001"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 text-sm bg-slate-50 border border-slate-300 dark:bg-slate-850 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 disabled:opacity-50 transition-all font-mono"
                />
              </div>
            </div>

            {/* Input - Password */}
            <div className="space-y-1">
              <label 
                htmlFor="password"
                className="text-xs font-semibold text-slate-500 dark:text-slate-400 block"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 text-sm bg-slate-50 border border-slate-300 dark:bg-slate-850 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-slate-800 dark:text-slate-200 disabled:opacity-50 transition-all"
                />
              </div>
            </div>

            {/* Error Notification */}
            {(error || authError) && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/50 dark:text-rose-400 rounded-2xl flex items-start gap-2 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error || authError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 cursor-pointer disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Quick instructions for demo */}
          <div className="mt-5 text-center text-[10px] text-slate-400 dark:text-slate-500 leading-normal border-t border-slate-100 dark:border-slate-800/80 pt-4">
            Authorized QA Personnel Only.
            <br />
            For demo, enter employee ID <strong>EMP001</strong> or <strong>EMP002</strong>.
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-400 dark:text-slate-600 pb-2">
        ESME-QA-SOP-22-F-02 Digital Version v1.0.0
        <br />
        © {new Date().getFullYear()} Esme Consumer Pvt. Ltd. All rights reserved.
      </div>
    </div>
  );
}
