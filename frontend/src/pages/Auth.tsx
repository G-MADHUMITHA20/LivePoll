import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { request } from '../api/client';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.success && res.token) {
        const userRes = await request('/auth/me', { headers: { 'Authorization': `Bearer ${res.token}` } });
        login(res.token, userRes.user);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-4 bg-gray-50">
      <div className="card w-full max-w-md my-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h2>
          <p className="text-gray-500 mt-2 text-sm">Sign in to manage your polls</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2 animate-fade-in-up">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">Email address</label>
            <input 
              id="email" type="email" required 
              value={email} onChange={e => setEmail(e.target.value)} 
              className="input-field" 
              placeholder="you@example.com" 
              disabled={loading} 
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="password">Password</label>
            <input 
              id="password" type="password" required 
              value={password} onChange={e => setPassword(e.target.value)} 
              className="input-field" 
              placeholder="••••••••" 
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center py-2.5 mt-2">
            {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : 'Sign In'}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-600 mt-6 pt-6 border-t border-gray-100">
          Don't have an account? <Link to="/signup" className="text-primary-600 font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    
    setLoading(true);
    try {
      const res = await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      if (res.success) {
        // Auto-login or redirect to login. We'll redirect to login for simplicity and security.
        navigate('/login', { state: { message: "Account created! Please log in." }});
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-4 bg-gray-50">
      <div className="card w-full max-w-md my-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Account</h2>
          <p className="text-gray-500 mt-2 text-sm">Start making live polls in seconds</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-center gap-2 animate-fade-in-up">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="name">Full Name</label>
            <input 
              id="name" type="text" required 
              value={name} onChange={e => setName(e.target.value)} 
              className="input-field" 
              placeholder="John Doe" 
              disabled={loading} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">Email address</label>
            <input 
              id="email" type="email" required 
              value={email} onChange={e => setEmail(e.target.value)} 
              className="input-field" 
              placeholder="you@example.com" 
              disabled={loading} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="password">Password</label>
            <input 
              id="password" type="password" required minLength={6} 
              value={password} onChange={e => setPassword(e.target.value)} 
              className="input-field" 
              placeholder="••••••••" 
              disabled={loading} 
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="confirm_password">Confirm Password</label>
            <input 
              id="confirm_password" type="password" required minLength={6} 
              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} 
              className="input-field" 
              placeholder="••••••••" 
              disabled={loading} 
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex justify-center items-center py-2.5 mt-2">
            {loading ? <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> : 'Create Account'}
          </button>
        </form>
        
        <p className="text-center text-sm text-gray-600 mt-6 pt-6 border-t border-gray-100">
          Already have an account? <Link to="/login" className="text-primary-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
};
