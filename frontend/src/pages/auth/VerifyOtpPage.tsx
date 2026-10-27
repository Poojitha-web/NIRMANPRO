import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-hot-toast';
import { ShieldCheck, ArrowLeft, RefreshCw, Mail } from 'lucide-react';

export const VerifyOtpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const emailParam = searchParams.get('email') || '';
  const purposeParam = searchParams.get('purpose') || 'LOGIN';
  const [email, setEmail] = useState(emailParam);
  const [otpValues, setOtpValues] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Expiration countdown (5 minutes = 300 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  // Resend cooldown (30 seconds)
  const [cooldown, setCooldown] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let timer: any;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleOtpBoxChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newValues = [...otpValues];
    newValues[index] = val.slice(-1);
    setOtpValues(newValues);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-box-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      const prevInput = document.getElementById(`otp-box-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpValues.join('');
    if (fullOtp.length !== 6) {
      toast.error('Please enter all 6 digits of the verification code.');
      return;
    }

    if (secondsRemaining <= 0) {
      toast.error('This OTP has expired. Please request a new OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email, fullOtp, purposeParam);
      login(res.user, res.token);
      toast.success('Account verified successfully! Welcome to NIRMAN PRO.');
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.message;
      const formattedMsg = Array.isArray(message) ? message.join('. ') : (message || 'Invalid verification code.');
      toast.error(formattedMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }
    setResendLoading(true);
    try {
      const res = await authApi.sendOtp(email, purposeParam);
      setSecondsRemaining(300); // reset 5 minute timer
      setCooldown(30); // 30s resend cooldown
      setOtpValues(['', '', '', '', '', '']);
      toast.success(res.message || 'New OTP sent to your email.');
    } catch (err: any) {
      const message = err.response?.data?.message;
      const formattedMsg = Array.isArray(message) ? message.join('. ') : (message || 'Failed to resend OTP.');
      toast.error(formattedMsg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <div className="inline-flex p-3 bg-sky-500/10 border border-sky-500/20 rounded-2xl mb-2">
          <ShieldCheck className="w-8 h-8 text-sky-400" />
        </div>
        <h3 className="text-xl font-bold text-white tracking-tight">Verification Code</h3>
        <p className="text-xs text-slate-400">
          Enter the 6-digit code sent to
        </p>
        <p className="text-xs font-semibold text-sky-400 font-mono">{email || 'your email'}</p>
      </div>

      <form onSubmit={handleVerifyOtp} className="space-y-6">
        {/* 6 OTP Input Boxes */}
        <div className="flex justify-between gap-2">
          {otpValues.map((val, idx) => (
            <input
              key={idx}
              id={`otp-box-${idx}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={val}
              onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-bold bg-slate-950 border border-slate-700 rounded-xl text-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 focus:outline-none transition-all"
            />
          ))}
        </div>

        {/* Real-Time Expiration Countdown */}
        <div className="text-center bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <p className="text-xs text-slate-400">
            OTP expires in:{' '}
            <span className={`font-mono font-bold ${secondsRemaining < 60 ? 'text-rose-400' : 'text-sky-400'}`}>
              {formatTimer(secondsRemaining)}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={loading || secondsRemaining <= 0}
            className="w-full py-3 bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={cooldown > 0 || resendLoading}
              onClick={handleResendOtp}
              className="text-xs font-semibold text-sky-400 hover:underline flex items-center gap-1.5 disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendLoading ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend OTP (${cooldown}s)` : 'Resend OTP'}
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change Email
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
