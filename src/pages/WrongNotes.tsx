import React, { useEffect, useState, useCallback } from 'react';
import { wrongNoteApi } from '../api';
import type { WrongNoteResponse } from '../types';
import { IconFileText, IconCheck, IconX, IconTrash } from '../components/Icons';
import { useToast } from '../components/Toast';
import './WrongNotes.css';

const OPTIONS = ['①', '②', '③', '④'];
type Tab = 'all' | 'favorites';

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <span style={{ fontSize: 18, color: filled ? '#f6ad55' : '#cbd5e0', cursor: 'pointer', lineHeight: 1 }}>
      {filled ? '★' : '☆'}
    </span>
  );
}

export default function WrongNotes() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('all');
  const [notes, setNotes] = useState<WrongNoteResponse[]>([]);
  const [favorites, setFavorites] = useState<WrongNoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [editingMemoId, setEditingMemoId] = useState<number | null>(null);
  const [memoText, setMemoText] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, favRes] = await Promise.all([
        wrongNoteApi.getMyNotes(),
        wrongNoteApi.getFavorites(),
      ]);
      setNotes(allRes.data);
      setFavorites(favRes.data);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : '오답노트를 불러오지 못했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleDelete = async (wrongNoteId: number) => {
    if (!window.confirm('이 오답노트를 삭제하시겠습니까?')) return;
    setDeletingId(wrongNoteId);
    try {
      await wrongNoteApi.deleteNote(wrongNoteId);
      setNotes(prev => prev.filter(n => n.wrongNoteId !== wrongNoteId));
      setFavorites(prev => prev.filter(n => n.wrongNoteId !== wrongNoteId));
      toast('오답노트가 삭제되었습니다', 'success');
    } catch {
      toast('삭제에 실패했습니다', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFavorite = async (wrongNoteId: number) => {
    setTogglingId(wrongNoteId);
    try {
      const res = await wrongNoteApi.toggleFavorite(wrongNoteId);
      const updated = res.data;
      const updater = (list: WrongNoteResponse[]) =>
        list.map(n => n.wrongNoteId === wrongNoteId ? updated : n);
      setNotes(updater);
      if (updated.isFavorite) {
        setFavorites(prev => prev.some(n => n.wrongNoteId === wrongNoteId)
          ? updater(prev)
          : [updated, ...prev]);
      } else {
        setFavorites(prev => prev.filter(n => n.wrongNoteId !== wrongNoteId));
      }
      toast(updated.isFavorite ? '즐겨찾기에 추가했습니다' : '즐겨찾기를 해제했습니다', 'info');
    } catch {
      toast('즐겨찾기 변경 실패', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveMemo = async (wrongNoteId: number) => {
    setSavingMemo(true);
    try {
      const res = await wrongNoteApi.updateMemo(wrongNoteId, { memo: memoText || null });
      const updated = res.data;
      const updater = (list: WrongNoteResponse[]) =>
        list.map(n => n.wrongNoteId === wrongNoteId ? updated : n);
      setNotes(updater);
      setFavorites(updater);
      setEditingMemoId(null);
      toast('메모가 저장되었습니다', 'success');
    } catch {
      toast('메모 저장 실패', 'error');
    } finally {
      setSavingMemo(false);
    }
  };

  const getOptionClass = (note: WrongNoteResponse, optionNum: number) => {
    if (optionNum === note.correctAnswer) return 'wn-option correct';
    if (optionNum === note.selectedAnswer) return 'wn-option wrong';
    return 'wn-option';
  };

  const optionTexts = (note: WrongNoteResponse) => [
    note.option1, note.option2, note.option3, note.option4,
  ];

  const displayNotes = tab === 'all' ? notes : favorites;

  return (
    <div className="wrong-notes-page">
      <div className="wn-hero">
        <div className="container">
          <h1 className="wn-hero-title">오답노트</h1>
          <p className="wn-hero-sub">틀린 문제를 다시 확인하고 취약점을 보완하세요</p>
        </div>
      </div>

      <div className="container wn-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={`btn ${tab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('all')}
          >
            전체 {!loading && <span style={{ marginLeft: 4, opacity: 0.8 }}>({notes.length})</span>}
          </button>
          <button
            className={`btn ${tab === 'favorites' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('favorites')}
          >
            ★ 즐겨찾기 {!loading && <span style={{ marginLeft: 4, opacity: 0.8 }}>({favorites.length})</span>}
          </button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : displayNotes.length === 0 ? (
          <div className="wn-empty">
            <div className="wn-empty-icon"><IconFileText size={40} /></div>
            <p className="wn-empty-title">{tab === 'favorites' ? '즐겨찾기한 오답이 없습니다' : '오답노트가 없습니다'}</p>
            <p className="wn-empty-sub">
              {tab === 'favorites'
                ? '오답노트의 별표를 눌러 즐겨찾기에 추가하세요'
                : '문제를 풀고 틀린 문제가 생기면 여기에 자동으로 추가됩니다'}
            </p>
          </div>
        ) : (
          <>
            <div className="wn-header-bar">
              <span className="wn-total">총 <strong>{displayNotes.length}</strong>개의 오답</span>
            </div>
            <div className="wn-list">
              {displayNotes.map((note, idx) => (
                <div key={note.wrongNoteId} className="wn-card">
                  <div className="wn-card-header">
                    <div className="wn-card-num-wrap">
                      <span className="wn-card-idx">Q{idx + 1}</span>
                      <div className="wn-answer-badges">
                        <span className="badge badge-wrong">
                          <IconX size={11} /> 내 답: {note.selectedAnswer}번
                        </span>
                        <span className="badge badge-correct">
                          <IconCheck size={11} /> 정답: {note.correctAnswer}번
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        style={{ background: 'none', border: 'none', padding: 4, cursor: togglingId === note.wrongNoteId ? 'not-allowed' : 'pointer' }}
                        onClick={() => handleToggleFavorite(note.wrongNoteId)}
                        disabled={togglingId === note.wrongNoteId}
                        aria-label="즐겨찾기"
                        title={note.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                      >
                        <StarIcon filled={note.isFavorite} />
                      </button>
                      <button
                        className="wn-delete-btn"
                        onClick={() => handleDelete(note.wrongNoteId)}
                        disabled={deletingId === note.wrongNoteId}
                        aria-label="삭제"
                      >
                        {deletingId === note.wrongNoteId
                          ? <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                          : <IconTrash size={16} />
                        }
                      </button>
                    </div>
                  </div>

                  <p className="wn-content">{note.content}</p>

                  <div className="wn-options">
                    {optionTexts(note).map((text, i) => (
                      <div key={i} className={getOptionClass(note, i + 1)}>
                        <span className="wn-option-num">{OPTIONS[i]}</span>
                        <span className="wn-option-text">{text}</span>
                        {i + 1 === note.correctAnswer && (
                          <span className="wn-option-tag correct-tag"><IconCheck size={11} /> 정답</span>
                        )}
                        {i + 1 === note.selectedAnswer && i + 1 !== note.correctAnswer && (
                          <span className="wn-option-tag wrong-tag"><IconX size={11} /> 내 답</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {note.explanation && (
                    <div className="wn-explanation">
                      <span className="wn-explanation-label">해설</span>
                      <p className="wn-explanation-text">{note.explanation}</p>
                    </div>
                  )}

                  <div className="wn-memo">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="wn-memo-label">메모</span>
                      {editingMemoId !== note.wrongNoteId && (
                        <button
                          style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--primary)', cursor: 'pointer' }}
                          onClick={() => { setEditingMemoId(note.wrongNoteId); setMemoText(note.memo || ''); }}
                        >
                          {note.memo ? '수정' : '+ 메모 추가'}
                        </button>
                      )}
                    </div>
                    {editingMemoId === note.wrongNoteId ? (
                      <div>
                        <textarea
                          className="form-input"
                          value={memoText}
                          onChange={e => setMemoText(e.target.value)}
                          rows={3}
                          placeholder="나만의 메모를 남겨보세요..."
                          style={{ fontSize: 13, marginBottom: 8, resize: 'vertical' }}
                        />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn btn-primary"
                            style={{ fontSize: 12, padding: '4px 12px' }}
                            onClick={() => handleSaveMemo(note.wrongNoteId)}
                            disabled={savingMemo}
                          >
                            {savingMemo ? '저장 중...' : '저장'}
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 12, padding: '4px 12px' }}
                            onClick={() => setEditingMemoId(null)}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : note.memo ? (
                      <p className="wn-memo-text">{note.memo}</p>
                    ) : (
                      <p style={{ fontSize: 13, color: 'var(--gray-400)', fontStyle: 'italic' }}>메모 없음</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
