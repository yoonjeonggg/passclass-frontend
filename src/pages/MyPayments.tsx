import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { paymentApi } from "../api";
import type { PaymentResponse } from "../types";
import { useToast } from "../components/Toast";

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  PENDING:   { text: "대기 중",  color: "#e0a000" },
  COMPLETED: { text: "결제 완료", color: "#38a169" },
  FAILED:    { text: "결제 실패", color: "#e53e3e" },
  CANCELLED: { text: "취소됨",   color: "#718096" },
};

export default function MyPayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<PaymentResponse | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const fetchPayments = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await paymentApi.getMyPayments(p, 10);
      setPayments(res.data.content);
      setTotalPages(res.data.totalPages);
    } catch (err: any) {
      toast(err.message || "결제 내역을 불러오지 못했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(page); }, [page, fetchPayments]);

  const openCancelModal = (payment: PaymentResponse) => {
    setCancelTarget(payment);
    setCancelReason("");
    setShowCancelModal(true);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    if (!cancelReason.trim()) { toast("취소 사유를 입력해주세요.", "error"); return; }
    setCancellingId(cancelTarget.paymentId);
    try {
      await paymentApi.cancel(cancelTarget.paymentId, { reason: cancelReason.trim() });
      toast("결제가 취소되었습니다.", "success");
      setShowCancelModal(false);
      fetchPayments(page);
    } catch (err: any) {
      toast(err.message || "결제 취소 실패", "error");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div style={{ minHeight: "60vh" }}>
      <div style={{ background: "linear-gradient(135deg, var(--primary) 0%, #6c2bd9 100%)", padding: "48px 0 32px", marginBottom: 32 }}>
        <div className="container">
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 8 }}>결제 내역</h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15 }}>강의 결제 내역을 확인하고 관리하세요</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 760, paddingBottom: 60 }}>
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : payments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--gray-400)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
            <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>결제 내역이 없습니다</p>
            <p style={{ fontSize: 14, marginBottom: 24 }}>강의를 결제하면 여기에 내역이 표시됩니다.</p>
            <Link to="/lectures" className="btn btn-primary">강의 둘러보기</Link>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {payments.map((p) => {
                const status = STATUS_LABEL[p.status] || { text: p.status, color: "#718096" };
                return (
                  <div
                    key={p.paymentId}
                    style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span
                            style={{ fontSize: 12, fontWeight: 600, color: status.color, background: `${status.color}18`, padding: "2px 8px", borderRadius: 99 }}
                          >
                            {status.text}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--gray-400)" }}>
                            {new Date(p.createdAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                          </span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "var(--gray-900)", marginBottom: 4 }}>
                          {p.lectureTitle}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--gray-400)" }}>주문번호: {p.orderId}</div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)", marginBottom: 8 }}>
                          {p.amount.toLocaleString()}원
                        </div>
                        {p.status === "COMPLETED" && (
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 12, padding: "4px 12px", color: "#e53e3e", borderColor: "#e53e3e" }}
                            onClick={() => openCancelModal(p)}
                            disabled={cancellingId === p.paymentId}
                          >
                            결제 취소
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "6px 16px" }}
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  이전
                </button>
                <span style={{ padding: "6px 12px", fontSize: 14, color: "var(--gray-500)" }}>
                  {page + 1} / {totalPages}
                </span>
                <button
                  className="btn btn-ghost"
                  style={{ padding: "6px 16px" }}
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && cancelTarget && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowCancelModal(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", maxWidth: 400, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>결제 취소</h2>
            <p style={{ fontSize: 14, color: "var(--gray-500)", marginBottom: 16 }}>
              <strong>{cancelTarget.lectureTitle}</strong> ({cancelTarget.amount.toLocaleString()}원)의 결제를 취소합니다.
            </p>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: "block" }}>취소 사유</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="취소 사유를 입력해주세요"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1, background: "#e53e3e", borderColor: "#e53e3e" }}
                onClick={handleCancel}
                disabled={!!cancellingId}
              >
                {cancellingId ? "처리 중..." : "취소 확인"}
              </button>
              <button
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => setShowCancelModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
