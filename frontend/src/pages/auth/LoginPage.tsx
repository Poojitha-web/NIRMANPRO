import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { toast } from 'react-hot-toast';
import { Mail, Lock, KeyRound, Chrome, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'password' | 'google' | 'otp'>('password');

  // Email & Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP state
  const [otpEmail, setOtpEmail] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      login(res.user, res.token);
      toast.success(`Welcome to NIRMAN PRO, ${res.user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message;
      const formattedMsg = Array.isArray(message) ? message.join('. ') : (message || 'Invalid email or password.');
      toast.error(formattedMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (!email) {
        toast.error('Google Sign-In is not configured. Please configure Google OAuth credentials.');
        setLoading(false);
        return;
      }
      const res = await authApi.googleAuth({ email });
      login(res.user, res.token);
      toast.success('Signed in with Google OAuth!');
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message;
      const formattedMsg = Array.isArray(message) ? message.join('. ') : (message || 'Google Sign-In is not configured. Please configure Google OAuth credentials.');
      toast.error(formattedMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpEmail) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.sendOtp(otpEmail);
      toast.success(res.message || 'Verification code sent to your email.');
      navigate(`/verify-otp?email=${encodeURIComponent(otpEmail)}`);
    } catch (err: any) {
      const message = err.response?.data?.message;
      const formattedMsg = Array.isArray(message) ? message.join('. ') : (message || 'Failed to send OTP.');
      toast.error(formattedMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Auth Method Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('password')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'password' ? 'bg-sky-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Password
        </button>
        <button
          onClick={() => setActiveTab('google')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'google' ? 'bg-sky-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Google OAuth
        </button>
        <button
          onClick={() => setActiveTab('otp')}
          className={`py-2 rounded-lg transition-all ${
            activeTab === 'otp' ? 'bg-sky-600 text-white shadow-md font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          Email OTP
        </button>
      </div>

      {/* 1. Email + Password Login */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@nirmanpro.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-sky-400 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* 2. Google OAuth */}
      {activeTab === 'google' && (
        <div className="space-y-4 py-2">
          <p className="text-xs text-slate-400 text-center">
            Authenticate securely using your Google Workspace or Personal Account
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Google Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@gmail.com"
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 mb-3 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl text-sm shadow-lg flex items-center justify-center gap-3 transition-all"
          >
            <Chrome className="w-5 h-5 text-rose-500" />
            Continue with Google
          </button>
        </div>
      )}

      {/* 3. Email OTP Login */}
      {activeTab === 'otp' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                placeholder="engineer@nirmanpro.com"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            {loading ? 'Sending Verification Code...' : 'Send OTP'}
            <KeyRound className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Signup Link */}
      <div className="text-center pt-2 border-t border-slate-800/60">
        <p className="text-xs text-slate-400">
          New to NIRMAN PRO?{' '}
          <Link to="/signup" className="font-semibold text-sky-400 hover:underline">
            Register Account
          </Link>
        </p>
      </div>
    </div>
  );
};
