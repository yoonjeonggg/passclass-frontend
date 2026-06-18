import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api';
import { useToast } from '../components/Toast';
import './Auth.css';

type ResetStep = 'idle' | 'send' | 'confirm';

export default function Login() {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const [resetStep, setResetStep] = useState<ResetStep>('idle');
  const [resetForm, setResetForm] = useState({ email: '', code: '', newPassword: '', confirmPassword: '' });
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast('로그인 성공!', 'success');
      navigate('/');
    } catch (err: any) {
      toast(err.message || '로그인 실패', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    try {
      await authApi.sendPasswordReset({ email: resetForm.email });
      toast('비밀번호 재설정 코드가 이메일로 발송되었습니다.', 'success');
      setResetStep('confirm');
    } catch (err: any) {
      toast(err.message || '이메일 발송 실패', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetForm.newPassword !== resetForm.confirmPassword) {
      toast('새 비밀번호가 일치하지 않습니다.', 'error');
      return;
    }
    setResetLoading(true);
    try {
      await authApi.confirmPasswordReset({
        email: resetForm.email,
        code: resetForm.code,
        newPassword: resetForm.newPassword,
      });
      toast('비밀번호가 재설정되었습니다. 새 비밀번호로 로그인하세요.', 'success');
      setResetStep('idle');
      setResetForm({ email: '', code: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast(err.message || '비밀번호 재설정 실패', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  if (resetStep !== 'idle') {
    return (
      <div className="auth-page">
        <div className="auth-card fade-up">
          <div className="auth-header">
            <Link to="/" className="auth-logo">🎓 PassClass</Link>
            <h1>비밀번호 찾기</h1>
            <p>{resetStep === 'send' ? '가입한 이메일을 입력하세요' : '이메일로 받은 인증 코드를 입력하세요'}</p>
          </div>

          {resetStep === 'send' && (
            <form onSubmit={handleSendResetCode} className="auth-form">
              <div className="form-group">
                <label>이메일</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="email@example.com"
                  value={resetForm.email}
                  onChange={e => setResetForm(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary auth-submit" disabled={resetLoading}>
                {resetLoading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : '인증 코드 발송'}
              </button>
            </form>
          )}

          {resetStep === 'confirm' && (
            <form onSubmit={handleConfirmReset} className="auth-form">
              <div className="form-group">
                <label>인증 코드</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="이메일로 받은 6자리 코드"
                  value={resetForm.code}
                  onChange={e => setResetForm(p => ({ ...p, code: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>새 비밀번호</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="영문+숫자 8자 이상"
                  value={resetForm.newPassword}
                  onChange={e => setResetForm(p => ({ ...p, newPassword: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>새 비밀번호 확인</label>
                <input
                  type="password"
                  className="form-input"
                  value={resetForm.confirmPassword}
                  onChange={e => setResetForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary auth-submit" disabled={resetLoading}>
                {resetLoading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : '비밀번호 재설정'}
              </button>
            </form>
          )}

          <p className="auth-switch">
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 14 }}
              onClick={() => { setResetStep('idle'); setResetForm({ email: '', code: '', newPassword: '', confirmPassword: '' }); }}
            >
              로그인으로 돌아가기
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        <div className="auth-header">
          <Link to="/" className="auth-logo">🎓 PassClass</Link>
          <h1>로그인</h1>
          <p>계속하려면 로그인하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              className="form-input"
              placeholder="email@example.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner" style={{width:20,height:20,borderWidth:2}} /> : '로그인'}
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <p className="auth-switch" style={{ margin: 0 }}>
            아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
          </p>
          <button
            type="button"
            style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontSize: 13 }}
            onClick={() => setResetStep('send')}
          >
            비밀번호 찾기
          </button>
        </div>
      </div>
    </div>
  );
}
