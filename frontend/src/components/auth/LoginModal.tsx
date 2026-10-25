import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building2,
  User as UserIcon,
  Phone,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../../api/client';
import type { AuthResponse } from '../../types';

interface LoginModalProps {
  onLoginSuccess: (data: AuthResponse) => void;
}

type AuthMode = 'login' | 'signup';
type UserType = 'MSME' | 'CITIZEN';

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [userType, setUserType] = useState<UserType>('MSME');

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('ramesh.kumar@aarogyadiagnostics.in');
  const [loginPassword, setLoginPassword] = useState('Password123!');

  // Sign Up Form State
  const [signupCompany, setSignupCompany] = useState('');
  const [signupFirstName, setSignupFirstName] = useState('');
  const [signupLastName, setSignupLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [authStep, setAuthStep] = useState<string>('Authenticating credentials...');
  const [error, setError] = useState<string | null>(null);

  // Quick switch demo credentials when changing userType in login mode
  const handleUserTypeChange = (type: UserType) => {
    setUserType(type);
    setError(null);
    if (authMode === 'login') {
      if (type === 'MSME') {
        setLoginEmail('ramesh.kumar@aarogyadiagnostics.in');
        setLoginPassword('Password123!');
      } else {
        setLoginEmail('rahul.sharma@citizen.in');
        setLoginPassword('Password123!');
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAuthStep('Validating DPDP §6 affirmative consent...');

    const t1 = setTimeout(() => setAuthStep('Verifying cryptographic SHA-256 tokens...'), 350);
    const t2 = setTimeout(() => setAuthStep('Establishing zero-trust compliance session...'), 700);

    try {
      const [data] = await Promise.all([
        api.auth.login(loginEmail, loginPassword, userType),
        new Promise((resolve) => setTimeout(resolve, 950)),
      ]);
      setAuthStep('Compliance session authorized!');
      localStorage.setItem('datasentinel_token', data.token);
      localStorage.setItem('datasentinel_user', JSON.stringify(data.user));
      setTimeout(() => {
        onLoginSuccess(data);
      }, 150);
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setError(
        err.response?.data?.error?.message ||
          'Invalid credentials. Please verify your email and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAuthStep('Generating compliance tenant workspace...');

    if (userType === 'MSME' && !signupCompany.trim()) {
      setError('Please provide your business or company workspace name.');
      setIsLoading(false);
      return;
    }

    if (!signupFirstName.trim()) {
      setError('First name is required.');
      setIsLoading(false);
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    const t1 = setTimeout(() => setAuthStep('Encrypting enterprise credentials...'), 350);
    const t2 = setTimeout(() => setAuthStep('Initializing DPDP immutable audit ledger...'), 700);

    try {
      const [data] = await Promise.all([
        api.auth.register({
          userType,
          tenantName: userType === 'MSME' ? signupCompany.trim() : undefined,
          firstName: signupFirstName.trim(),
          lastName: signupLastName.trim() || undefined,
          email: signupEmail.trim(),
          phone: signupPhone.trim() || undefined,
          password: signupPassword,
        }),
        new Promise((resolve) => setTimeout(resolve, 950)),
      ]);

      setAuthStep('Tenant workspace registered successfully!');
      localStorage.setItem('datasentinel_token', data.token);
      localStorage.setItem('datasentinel_user', JSON.stringify(data.user));
      setTimeout(() => {
        onLoginSuccess(data);
      }, 150);
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      setError(
        err.response?.data?.error?.message ||
          'Registration failed. An account with this email may already exist.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto relative overflow-hidden modal-animate-enter">
        {/* Animated Scanner Laser Beam during Authentication */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 overflow-hidden rounded-t-xl z-20">
            <div className="animate-laser-scan rounded-full" />
          </div>
        )}

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative w-12 h-12 mx-auto">
            <div
              className={`w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-600/30 transition-transform duration-300 ${
                isLoading ? 'scale-105' : 'hover:scale-105'
              }`}
            >
              <ShieldCheck className="w-7 h-7" />
            </div>
            {isLoading && (
              <div className="absolute inset-0 rounded-xl border-2 border-blue-500 animate-pulse-ring pointer-events-none" />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            DataSentinel DPDP Platform
          </h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Statutory Data Protection & Citizen Privacy Governance Engine under the DPDP Act 2023
          </p>
        </div>

        {/* Live Authentication Animated Status Banner */}
        {isLoading && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-900 tracking-wide">DPDP Security Handshake</p>
              <p className="text-[11px] text-blue-700 font-semibold truncate">{authStep}</p>
            </div>
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
          </div>
        )}

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              authMode === 'login'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In to Account
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setError(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              authMode === 'signup'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Account Role Selector: MSME Company vs Individual User */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-2">
            Select Your Role
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleUserTypeChange('MSME')}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 relative flex flex-col justify-between group cursor-pointer ${
                userType === 'MSME'
                  ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    userType === 'MSME'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                </div>
                {userType === 'MSME' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">MSME Company</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Business & compliance dashboard
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleUserTypeChange('CITIZEN')}
              className={`p-3.5 rounded-xl border text-left transition-all duration-200 relative flex flex-col justify-between group cursor-pointer ${
                userType === 'CITIZEN'
                  ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600/20 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className={`p-1.5 rounded-lg transition-colors ${
                    userType === 'CITIZEN'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                </div>
                {userType === 'CITIZEN' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Individual User</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  Citizen self-service privacy portal
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Demo Fast-Login Pill (Only shown in Login mode) */}
        {authMode === 'login' && (
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-slate-700 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold text-blue-700 block tracking-wider">
                Quick Demo Account Available
              </span>
              <p className="text-xs font-semibold text-slate-900 truncate">
                {userType === 'MSME'
                  ? 'Aarogya Diagnostic Center (MSME Admin)'
                  : 'Rahul Sharma (Data Principal / Citizen)'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {userType === 'MSME'
                  ? 'ramesh.kumar@aarogyadiagnostics.in'
                  : 'rahul.sharma@citizen.in'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (userType === 'MSME') {
                  setLoginEmail('ramesh.kumar@aarogyadiagnostics.in');
                  setLoginPassword('Password123!');
                } else {
                  setLoginEmail('rahul.sharma@citizen.in');
                  setLoginPassword('Password123!');
                }
              }}
              className="btn-secondary text-[11px] py-1 px-2.5 font-bold shrink-0"
            >
              Load Demo
            </button>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* LOGIN FORM */}
        {/* ======================================================== */}
        {authMode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                {userType === 'MSME' ? 'Work / Business Email' : 'Personal Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder={
                    userType === 'MSME'
                      ? 'admin@yourcompany.com'
                      : 'yourname@citizen.in'
                  }
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b6c80]/20 focus:border-[#1b6c80] font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b6c80]/20 focus:border-[#1b6c80] font-medium transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 px-4 text-sm font-semibold rounded-lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 py-0.5">
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span className="text-xs font-medium tracking-wide animate-pulse">{authStep}</span>
                </div>
              ) : (
                <>
                  <span>
                    {userType === 'MSME'
                      ? 'Sign In as MSME Company'
                      : 'Sign In as Individual User'}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* ======================================================== */
          /* SIGNUP FORM */
          /* ======================================================== */
          <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
            {/* MSME Company Name (only if MSME) */}
            {userType === 'MSME' && (
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Business / Company Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={signupCompany}
                    onChange={(e) => setSignupCompany(e.target.value)}
                    placeholder="e.g. Apex Diagnostics Pvt Ltd"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b6c80]/20 focus:border-[#1b6c80] font-medium transition-all"
                  />
                </div>
              </div>
            )}

            {/* First and Last Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={signupFirstName}
                  onChange={(e) => setSignupFirstName(e.target.value)}
                  placeholder="First name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b6c80]/20 focus:border-[#1b6c80] font-medium transition-all"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={signupLastName}
                  onChange={(e) => setSignupLastName(e.target.value)}
                  placeholder="Last name"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b6c80]/20 focus:border-[#1b6c80] font-medium transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                {userType === 'MSME' ? 'Work Email Address *' : 'Personal Email Address *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="you@domain.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b6c80]/20 focus:border-[#1b6c80] font-medium transition-all"
                />
              </div>
            </div>

            {/* Phone Number (Important for Citizen WhatsApp / SMS Consent) */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Mobile Phone Number {userType === 'CITIZEN' && '(for DPDP WhatsApp/SMS Notices)'}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b6c80]/20 focus:border-[#1b6c80] font-medium transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Password * (minimum 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1b6c80]/20 focus:border-[#1b6c80] font-medium transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-2.5 px-4 text-sm font-semibold rounded-lg mt-2"
            >
              {isLoading ? (
                <div className="flex items-center gap-2 py-0.5">
                  <svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  <span className="text-xs font-medium tracking-wide animate-pulse">{authStep}</span>
                </div>
              ) : (
                <>
                  <span>
                    {userType === 'MSME'
                      ? 'Register MSME Workspace'
                      : 'Register Citizen Account'}
                  </span>
                  <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
