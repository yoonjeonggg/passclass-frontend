import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi, fileApi } from '../api';
import { useToast } from '../components/Toast';
import { isAdmin, isTeacher, normalizeUserRole, getProfileRoleRawString } from '../utils/roles';
import './Profile.css';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ nickname: user?.nickname || '', profileImage: user?.profileImage || '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [showPwForm, setShowPwForm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  if (!user) return null;

  const roleNorm = normalizeUserRole(user);
  const roleRaw = getProfileRoleRawString(user);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setUploading(true);

    try {
      const res = await fileApi.upload(file);
      setForm(p => ({ ...p, profileImage: res.data.fileUrl }));
      toast('이미지가 업로드되었습니다.', 'success');
    } catch (err: any) {
      toast(err.message || '업로드 실패', 'error');
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userApi.patchMyProfile({ nickname: form.nickname, profileImage: form.profileImage || undefined });
      await refreshUser();
      toast('프로필이 수정되었습니다.', 'success');
      setEditing(false);
      setPreviewUrl(null);
    } catch (err: any) {
      toast(err.message || '수정 실패', 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentImage = previewUrl || (editing ? form.profileImage : user.profileImage);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast('새 비밀번호가 일치하지 않습니다.', 'error');
      return;
    }
    setPwSaving(true);
    try {
      await userApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast('비밀번호가 변경되었습니다.', 'success');
      setShowPwForm(false);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast(err.message || '비밀번호 변경 실패', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('정말 탈퇴하시겠습니까? 모든 데이터가 삭제되며 복구할 수 없습니다.')) return;
    setDeletingAccount(true);
    try {
      await userApi.deleteAccount();
      await logout();
      toast('회원 탈퇴가 완료되었습니다.', 'info');
      navigate('/');
    } catch (err: any) {
      toast(err.message || '탈퇴 처리 중 오류가 발생했습니다.', 'error');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="container">
        <div className="page-header">
          <h1>내 프로필</h1>
        </div>

        {(isTeacher(user) || isAdmin(user)) && (
          <div className="profile-staff-banner fade-up">
            <p className="profile-staff-banner-title">운영 도구</p>
            <p className="profile-staff-banner-desc">
              강의·챕터·문제·모의고사는 전용 페이지에서 관리합니다.
            </p>
            <div className="profile-staff-banner-actions">
              {isTeacher(user) && (
                <Link to="/teacher" className="btn btn-primary">강사 스튜디오</Link>
              )}
              {isAdmin(user) && (
                <Link to="/admin" className="btn btn-outline">관리자</Link>
              )}
            </div>
          </div>
        )}

        {!roleNorm && (
          <div className="profile-role-hint fade-up" role="status">
            {!roleRaw && (
              <p>
                프로필 응답에 <code>userRole</code>이 없습니다. 서버에서 예: <code>TEACHER</code>를 내려주면
                강사 스튜디오 메뉴와 <Link to="/teacher">/teacher</Link> 접근이 활성화됩니다.
              </p>
            )}
            {roleRaw && (
              <p>
                역할 값을 인식하지 못했습니다: <code>{roleRaw}</code>.
                가능하면 <code>ADMIN</code>, <code>TEACHER</code>, <code>STUDENT</code> 중 하나로 맞춰 주세요.
              </p>
            )}
          </div>
        )}

        <div className="profile-card fade-up">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">
              {currentImage
                ? <img src={currentImage} alt="" />
                : <span>{user.nickname[0]}</span>
              }
            </div>
            {editing && (
              <div className="avatar-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  style={{ display: 'none' }}
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  className="btn btn-ghost avatar-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? '업로드 중...' : '📷 사진 변경'}
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <form className="profile-form" onSubmit={handleSave}>
              <div className="form-group">
                <label>닉네임</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.nickname}
                  onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
                  required
                />
              </div>
              <div className="profile-form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEditing(false);
                    setPreviewUrl(null);
                    setForm({ nickname: user.nickname, profileImage: user.profileImage || '' });
                  }}
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="profile-field">
                <span className="profile-label">닉네임</span>
                <span className="profile-value">{user.nickname}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">이메일</span>
                <span className="profile-value">{user.email}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">계정 ID</span>
                <span className="profile-value">#{user.id}</span>
              </div>
              <div className="profile-field">
                <span className="profile-label">역할</span>
                <span className="profile-value">
                  {roleNorm ?? (roleRaw ? `미인식 (${roleRaw})` : '없음')}
                </span>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setForm({ nickname: user.nickname, profileImage: user.profileImage || '' });
                  setEditing(true);
                }}
              >
                ✏️ 프로필 수정
              </button>
            </div>
          )}
        </div>

        <div className="profile-card fade-up" style={{ marginTop: 24 }}>
          <div className="profile-info">
            <div className="profile-field">
              <span className="profile-label" style={{ fontWeight: 700, fontSize: 16 }}>보안 설정</span>
            </div>
            {!showPwForm ? (
              <button
                className="btn btn-outline"
                onClick={() => setShowPwForm(true)}
              >
                🔒 비밀번호 변경
              </button>
            ) : (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 360 }}>
                <div className="form-group">
                  <label>현재 비밀번호</label>
                  <input
                    type="password"
                    className="form-input"
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>새 비밀번호</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="영문+숫자 8자 이상"
                    value={pwForm.newPassword}
                    onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>새 비밀번호 확인</label>
                  <input
                    type="password"
                    className="form-input"
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="submit" className="btn btn-primary" disabled={pwSaving}>
                    {pwSaving ? '변경 중...' : '변경하기'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowPwForm(false); setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>
                    취소
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="profile-card fade-up" style={{ marginTop: 24 }}>
          <div className="profile-info">
            <div className="profile-field">
              <span className="profile-label" style={{ fontWeight: 700, fontSize: 16, color: 'var(--danger, #e53e3e)' }}>위험 구역</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 12 }}>
              계정을 탈퇴하면 모든 데이터(수강 내역, 오답노트, 리뷰 등)가 영구 삭제되며 복구할 수 없습니다.
            </p>
            <button
              className="btn"
              style={{ background: 'transparent', border: '1px solid var(--danger, #e53e3e)', color: 'var(--danger, #e53e3e)' }}
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
            >
              {deletingAccount ? '처리 중...' : '회원 탈퇴'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
