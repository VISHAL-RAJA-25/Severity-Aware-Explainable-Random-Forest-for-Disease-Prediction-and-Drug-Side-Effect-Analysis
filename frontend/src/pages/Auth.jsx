import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, KeyRound, Activity } from 'lucide-react';

export default function Auth({ type, onAuth }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Mock Authentication Logic
    setTimeout(() => {
      setLoading(false);
      if (type === 'forgot') {
        setMessage('Password reset link sent to your email!');
      } else {
        if (onAuth) onAuth({ email, name: name || 'User' });
        navigate('/app');
      }
    }, 1000);
  };

  const handleGoogleLogin = () => {
    if (onAuth) onAuth({ email: 'user@gmail.com', name: 'Google User' });
    navigate('/app');
  };

  const isLogin = type === 'login';
  const isSignup = type === 'signup';
  const isForgot = type === 'forgot';

  return (
    <div style={containerStyle} className="animate-fade-in">
      <div className="card" style={cardStyle}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-light)', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            {isForgot ? <KeyRound color="var(--primary)" size={32} /> : <User color="var(--primary)" size={32} />}
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>
            {isLogin && 'Welcome Back'}
            {isSignup && 'Create Account'}
            {isForgot && 'Reset Password'}
          </h1>
          <p className="text-muted" style={{ marginTop: '0.5rem' }}>
            {isLogin && 'Sign in to access your MedAi Dashboard'}
            {isSignup && 'Join us to get AI medical predictions'}
            {isForgot && 'Enter your email to receive a reset link'}
          </p>
        </div>

        {message && (
          <div style={{ padding: '1rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: '8px', marginBottom: '1rem' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={inputWrapper}>
                <User size={20} color="var(--text-muted)" style={inputIcon} />
                <input 
                  type="text" 
                  className="form-control" 
                  style={{ paddingLeft: '2.5rem' }} 
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={inputWrapper}>
              <Mail size={20} color="var(--text-muted)" style={inputIcon} />
              <input 
                type="email" 
                className="form-control" 
                style={{ paddingLeft: '2.5rem' }} 
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </div>
          </div>

          {!isForgot && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                Password
                {isLogin && (
                  <Link to="/forgot-password" style={{ fontSize: '0.875rem', color: 'var(--primary)', textDecoration: 'none' }}>
                    Forgot?
                  </Link>
                )}
              </label>
              <div style={inputWrapper}>
                <Lock size={20} color="var(--text-muted)" style={inputIcon} />
                <input 
                  type="password" 
                  className="form-control" 
                  style={{ paddingLeft: '2.5rem' }} 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : (
              <>
                {isLogin && 'Sign In'}
                {isSignup && 'Create Account'}
                {isForgot && 'Send Reset Link'}
              </>
            )}
          </button>
        </form>

        {!isForgot && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
              <span style={{ padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
            </div>

            <button type="button" onClick={handleGoogleLogin} className="btn btn-outline" style={{ width: '100%' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: '0.5rem' }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Sign in with Google
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          {isLogin && (
            <p>Don't have an account? <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Sign up</Link></p>
          )}
          {isSignup && (
            <p>Already have an account? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link></p>
          )}
          {isForgot && (
            <p>Remember your password? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Back to login</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '80vh'
};

const cardStyle = {
  width: '100%',
  maxWidth: '400px',
  padding: '2.5rem'
};

const inputWrapper = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center'
};

const inputIcon = {
  position: 'absolute',
  left: '0.75rem'
};
