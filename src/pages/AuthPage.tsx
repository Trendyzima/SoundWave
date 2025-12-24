import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../lib/auth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Music2, Mail, Lock, User, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const { isAuthenticated, login, setLoading } = useAuthStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'verify'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    otp: '',
  });
  
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      const user = await authService.signInWithPassword(formData.email, formData.password);
      login(authService.mapUser(user));
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setIsSubmitting(false);
      setLoading(false);
    }
  };
  
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      await authService.sendOtp(formData.email);
      setMode('verify');
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
      setIsSubmitting(false);
    }
  };
  
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    setLoading(true);
    
    try {
      const user = await authService.verifyOtpAndSetPassword(
        formData.email,
        formData.otp,
        formData.password,
        formData.username
      );
      login(authService.mapUser(user));
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
      setIsSubmitting(false);
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&h=1200&fit=crop"
          alt="Background"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-dark opacity-80" />
      </div>
      
      <div className="relative w-full max-w-md">
        <div className="glass-card p-8 rounded-2xl border border-white/10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4">
              <Music2 className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold gradient-text mb-2">SoundWave</h1>
            <p className="text-muted-foreground text-center">
              {mode === 'login' && 'Welcome back! Sign in to continue'}
              {mode === 'signup' && 'Create your account to start streaming'}
              {mode === 'verify' && 'Enter the OTP sent to your email'}
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}
          
          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-primary rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}
          
          {/* Signup Form - Step 1: Email */}
          {mode === 'signup' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Choose a username"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-primary rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}
          
          {/* Verify OTP Form - Step 2 */}
          {mode === 'verify' && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  OTP Code
                  <span className="text-xs text-muted-foreground ml-2">
                    (Check your email: {formData.email})
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.otp}
                  onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="Create a password"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-primary rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating account...' : 'Complete Registration'}
              </button>
            </form>
          )}
          
          {/* Toggle between login/signup */}
          {mode !== 'verify' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {mode === 'login' ? (
                  <>
                    Don't have an account? <span className="text-primary font-semibold">Sign Up</span>
                  </>
                ) : (
                  <>
                    Already have an account? <span className="text-primary font-semibold">Sign In</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
