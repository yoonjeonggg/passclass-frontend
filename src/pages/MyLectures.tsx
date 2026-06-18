import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentApi } from '../api';
import type { EnrollmentResponse } from '../types';
import { useToast } from '../components/Toast';
import { IconBook, IconArrowRight, IconPlay, IconCheck } from '../components/Icons';
import './MyLectures.css';

type Tab = 'active' | 'completed';

export default function MyLectures() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('active');
  const [enrollments, setEnrollments] = useState<EnrollmentResponse[]>([]);
  const [completed, setCompleted] = useState<EnrollmentResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      enrollmentApi.getMyEnrollments(),
      enrollmentApi.getMyCompletedEnrollments(),
    ])
      .then(([activeRes, completedRes]) => {
        setEnrollments(activeRes.data.content);
        setCompleted(completedRes.data.content);
      })
      .catch(() => toast('수강 목록을 불러올 수 없습니다.', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCancel = async (lectureId: number, title: string) => {
    if (!confirm(`"${title}" 수강을 취소하시겠습니까?`)) return;
    try {
      await enrollmentApi.cancel(lectureId);
      toast('수강이 취소되었습니다.', 'info');
      fetchAll();
    } catch (err: any) {
      toast(err.message || '수강 취소 실패', 'error');
    }
  };

  const list = tab === 'active' ? enrollments : completed;

  return (
    <div className="my-lectures-page">
      <div className="my-lectures-hero">
        <div className="container">
          <h1 className="my-hero-title">내 수강 목록</h1>
          <p className="my-hero-sub">수강 중인 강의를 확인하고 계속 학습하세요</p>
        </div>
      </div>

      <div className="container my-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          <button
            className={`btn ${tab === 'active' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('active')}
          >
            수강 중 {!loading && <span style={{ marginLeft: 4, opacity: 0.8 }}>({enrollments.length})</span>}
          </button>
          <button
            className={`btn ${tab === 'completed' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('completed')}
          >
            수강 완료 {!loading && <span style={{ marginLeft: 4, opacity: 0.8 }}>({completed.length})</span>}
          </button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : list.length > 0 ? (
          <>
            <div className="my-count">{list.length}개 강의</div>
            <div className="enrollment-list">
              {list.map((e, i) => (
                <div
                  key={e.enrollmentId}
                  className="enrollment-card fade-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="ec-thumb">
                    <span>{e.lectureTitle.slice(0, 2)}</span>
                  </div>
                  <div className="ec-info">
                    <h3 className="ec-title">{e.lectureTitle}</h3>
                    <div className="ec-date">
                      수강 시작 · {new Date(e.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                    <div className="ec-status">
                      {tab === 'completed' ? (
                        <>
                          <span className="ec-status-dot" style={{ background: 'var(--success, #38a169)' }} />
                          <span style={{ color: 'var(--success, #38a169)' }}>수강 완료</span>
                        </>
                      ) : (
                        <>
                          <span className="ec-status-dot" />
                          수강 중
                        </>
                      )}
                    </div>
                  </div>
                  <div className="ec-actions">
                    <Link to={`/lectures/${e.lectureId}`} className="btn btn-primary ec-btn">
                      {tab === 'completed' ? <><IconCheck size={13} /> 다시 보기</> : <><IconPlay size={13} /> 학습하기</>}
                    </Link>
                    {tab === 'active' && (
                      <button
                        className="ec-cancel"
                        onClick={() => handleCancel(e.lectureId, e.lectureTitle)}
                      >
                        수강 취소
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="my-empty">
            <div className="my-empty-icon"><IconBook size={32} /></div>
            <h2>{tab === 'active' ? '수강 중인 강의가 없습니다' : '완료한 강의가 없습니다'}</h2>
            <p>{tab === 'active' ? '원하는 강의를 찾아 수강 신청해보세요' : '강의를 완료하면 여기에 표시됩니다'}</p>
            {tab === 'active' && (
              <Link to="/lectures" className="btn btn-primary" style={{ marginTop: 8 }}>
                강의 둘러보기 <IconArrowRight size={15} />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
