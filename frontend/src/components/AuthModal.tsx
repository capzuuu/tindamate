import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  ShoppingBag,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';
import type { User, LoginCredentials, RegisterCredentials } from '../types';
import { loginUser, registerUser } from '../api';

interface AuthModalProps {
  isOpen: boolean;
  onAuthSuccess: (user: User) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onAuthSuccess,
  showToast
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [loginForm, setLoginForm] = useState<LoginCredentials>({
    username: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState<RegisterCredentials>({
    full_name: '',
    username: '',
    password: '',
    email: '',
    role: 'owner'
  });

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await loginUser(loginForm);
      showToast(`Welcome back, ${response.user.full_name}!`, 'success');
      onAuthSuccess(response.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect username or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const response = await registerUser(registerForm);
      showToast(`Account created for ${response.user.full_name}!`, 'success');
      onAuthSuccess(response.user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setLoginForm({
      username: 'alingnena',
      password: 'password123'
    });
    setMode('login');
    setErrorMsg(null);
  };

  return (
    <div className="modal-overlay-neo" style={{ zIndex: 3000 }}>
      <div
        className="modal-box-neo"
        style={{
          maxWidth: '460px',
          padding: '1.75rem',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-secondary)',
              border: '2.5px solid var(--border-outline)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <ShoppingBag size={28} color="var(--border-outline)" />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
            Tinda<span style={{ color: 'var(--color-secondary)' }}>Mate</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            {mode === 'login'
              ? 'Sign in with your store credentials to continue'
              : 'Create a new Store Owner or Cashier account'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-secondary)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--border-outline)',
            gap: '0.25rem'
          }}
        >
          <button
            type="button"
            className={`btn-neo btn-neo-sm ${mode === 'login' ? 'btn-neo-primary' : 'btn-neo-surface'}`}
            style={{ border: 'none', boxShadow: mode === 'login' ? 'var(--shadow-sm)' : 'none' }}
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
          >
            <Lock size={14} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            className={`btn-neo btn-neo-sm ${mode === 'register' ? 'btn-neo-primary' : 'btn-neo-surface'}`}
            style={{ border: 'none', boxShadow: mode === 'register' ? 'var(--shadow-sm)' : 'none' }}
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
          >
            <UserIcon size={14} />
            <span>Register</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#fee2e2',
              color: '#991b1b',
              border: '2px solid var(--border-outline)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.55rem 0.75rem',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Username</label>
              <input
                type="text"
                required
                className="input-neo"
                placeholder="e.g. alingnena"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                autoFocus
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-neo"
                  placeholder="Enter your password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-hint)'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-neo btn-neo-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1.05rem',
                marginTop: '0.25rem',
                justifyContent: 'center'
              }}
            >
              <span>{isLoading ? 'Signing In...' : 'Sign In to Store'}</span>
              <ArrowRight size={16} />
            </button>

            {/* Quick Demo Fill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                paddingTop: '0.5rem',
                borderTop: '1px dashed var(--border-subtle)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)'
              }}
            >
              <Sparkles size={14} color="#d97706" />
              <span>Testing out?</span>
              <button
                type="button"
                onClick={fillDemoAccount}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontWeight: 800,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Use Demo Owner Account
              </button>
            </div>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Full Name *</label>
              <input
                type="text"
                required
                className="input-neo"
                placeholder="e.g. Maria Clara Santos"
                value={registerForm.full_name}
                onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Username *</label>
                <input
                  type="text"
                  required
                  className="input-neo"
                  placeholder="e.g. maria_clara"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Role</label>
                <select
                  className="input-neo"
                  value={registerForm.role}
                  onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}
                >
                  <option value="owner">Store Owner</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  className="input-neo"
                  placeholder="At least 4 characters"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-hint)'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700 }}>Email Address (Optional)</label>
              <input
                type="email"
                className="input-neo"
                placeholder="store@gmail.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-neo btn-neo-accent"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1.05rem',
                marginTop: '0.25rem',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={16} />
              <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
