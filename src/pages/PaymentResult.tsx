import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { paymentApi } from "../api";

type ResultState = "loading" | "success" | "fail";

export default function PaymentResult() {
  const navigate = useNavigate();
  const [state, setState] = useState<ResultState>("loading");
  const [message, setMessage] = useState("");
  const [lectureTitle, setLectureTitle] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultCode = params.get("resultCode");
    const tid = params.get("tid");
    const orderId = params.get("orderId");
    const txAmt = params.get("txAmt") || params.get("amount");

    if (!resultCode) {
      setState("fail");
      setMessage("결제 정보가 올바르지 않습니다.");
      return;
    }

    if (resultCode !== "0000") {
      setState("fail");
      setMessage(params.get("resultMsg") || "결제가 취소되었습니다.");
      return;
    }

    if (!tid || !orderId || !txAmt) {
      setState("fail");
      setMessage("결제 결과 데이터가 누락되었습니다.");
      return;
    }

    paymentApi
      .confirm({ orderId, tid, amount: Number(txAmt) })
      .then((res) => {
        setLectureTitle(res.data.lectureTitle);
        setState("success");
      })
      .catch((err: any) => {
        setState("fail");
        setMessage(err.message || "결제 승인에 실패했습니다.");
      });
  }, []);

  if (state === "loading") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "var(--gray-500)" }}>결제 승인 중...</p>
        </div>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--gray-900)" }}>결제 완료!</h1>
          <p style={{ color: "var(--gray-500)", marginBottom: 8 }}>
            <strong style={{ color: "var(--gray-800)" }}>{lectureTitle}</strong> 강의 수강이 시작되었습니다.
          </p>
          <p style={{ fontSize: 13, color: "var(--gray-400)", marginBottom: 32 }}>결제 내역은 마이페이지에서 확인할 수 있습니다.</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link to="/my-lectures" className="btn btn-primary">내 수강 목록 보기</Link>
            <Link to="/my-payments" className="btn btn-ghost">결제 내역 보기</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center", maxWidth: 420, padding: "0 24px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>😢</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "var(--gray-900)" }}>결제 실패</h1>
        <p style={{ color: "var(--gray-500)", marginBottom: 32 }}>{message}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>다시 시도</button>
          <Link to="/" className="btn btn-ghost">홈으로</Link>
        </div>
      </div>
    </div>
  );
}
