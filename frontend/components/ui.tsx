"use client";

import { useState, type ReactNode } from "react";
import { AlertTriangle, Check, CheckCircle2, Circle, Copy, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { BountyStatus, Verdict } from "@/lib/contracts/Arbiter";
import type { TxState } from "@/lib/hooks/useArbiter";
import { shortAddress } from "@/lib/genlayer/client";

export function PageHeading({ eyebrow, title, intro, actions }: { eyebrow: string; title: string; intro?: string; actions?: ReactNode }) {
  return (
    <div className="page-heading">
      <div>
        <p className="page-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {intro && <p className="page-intro">{intro}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatusPill({ status }: { status: BountyStatus }) {
  const { t } = useI18n();
  const map = {
    open: { cls: "status-pill--info", label: t("Open", "Đang mở") },
    awarded: { cls: "", label: t("Awarded", "Đã trao thưởng") },
    closed: { cls: "status-pill--muted", label: t("Closed", "Đã đóng") },
  } as const;
  const m = map[status] ?? map.closed;
  return (
    <span className={`status-pill ${m.cls}`}>
      <i />
      {m.label}
    </span>
  );
}

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  const { t } = useI18n();
  return verdict === "accepted" ? (
    <span className="status-pill"><i />{t("Accepted", "Đạt")}</span>
  ) : (
    <span className="status-pill status-pill--danger"><i />{t("Rejected", "Không đạt")}</span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-orb" aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      <p>{body}</p>
      {action}
    </div>
  );
}

/** Deterministic gradient avatar from an address. */
export function Avatar({ address }: { address: string }) {
  let h = 0;
  for (let i = 2; i < address.length; i++) h = (h * 31 + address.charCodeAt(i)) % 360;
  const bg = `linear-gradient(135deg, hsl(${h} 70% 62%), hsl(${(h + 70) % 360} 65% 38%))`;
  return <span className="avatar" style={{ background: bg }} aria-hidden="true" />;
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard blocked */
        }
      }}
    >
      {done ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

export function formatPoints(value: number) {
  return `${value.toLocaleString("en-US")} PTS`;
}

/** Contract revert reasons arrive in English; translate the known ones. */
export function useErrorText() {
  const { t } = useI18n();
  return (message: string) => {
    const known: Record<string, string> = {
      USER_REJECTED: t("You cancelled the request in your wallet.", "Bạn đã huỷ yêu cầu trong ví."),
      NO_WALLET: t("No browser wallet found. Install MetaMask to continue.", "Không tìm thấy ví trình duyệt. Hãy cài MetaMask để tiếp tục."),
      "Bounty is not open": t("This bounty is no longer open.", "Bounty này không còn mở."),
      "Creators cannot submit to their own bounty": t("You can't submit to a bounty you posted.", "Bạn không thể nộp bài cho bounty của chính mình."),
      "Submit a single https:// URL": t("Submit a single https:// URL.", "Hãy nộp đúng một đường dẫn https://."),
      "No attempts left on this bounty": t("You've used all 3 attempts on this bounty.", "Bạn đã dùng hết 3 lượt nộp cho bounty này."),
      "Only the creator can close this bounty": t("Only the creator can close this bounty.", "Chỉ người tạo mới được đóng bounty này."),
      "Bounty not found": t("Bounty not found.", "Không tìm thấy bounty."),
      "Title is too short": t("The title is too short.", "Tiêu đề quá ngắn."),
      "Title is too long": t("The title is too long.", "Tiêu đề quá dài."),
      "Brief is too short": t("The brief is too short.", "Mô tả quá ngắn."),
      "Brief is too long": t("The brief is too long.", "Mô tả quá dài."),
      "Criteria is too short": t("The criteria are too short.", "Tiêu chí quá ngắn."),
      "Criteria is too long": t("The criteria are too long.", "Tiêu chí quá dài."),
      "Reward must be between 1 and 100": t("The reward must be between 1 and 100 points.", "Phần thưởng phải từ 1 đến 100 điểm."),
    };
    if (known[message]) return known[message];
    if (message.startsWith("Validators did not agree")) {
      return t(
        "Validators could not agree on a verdict. Nothing was recorded; you can try again.",
        "Các validator không thống nhất được kết quả. Chưa có gì được ghi lại; bạn có thể thử lại.",
      );
    }
    return t(`The transaction failed: ${message}`, `Giao dịch thất bại: ${message}`);
  };
}

export function TxStatus({ state, consensusLabel }: { state: TxState; consensusLabel?: string }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  if (state.status === "idle") return null;

  const hash = "hash" in state ? state.hash : undefined;
  const hashRow = hash ? (
    <div className="tx-hash tnum">
      <span>{t("Tx", "Giao dịch")} {shortAddress(hash, 10, 8)}</span>
      <CopyButton value={hash} label={t("Copy transaction hash", "Sao chép mã giao dịch")} />
    </div>
  ) : null;

  let body: ReactNode;
  if (state.status === "error") {
    body = <div className="tx-error" role="alert"><AlertTriangle /><span>{errorText(state.message)}</span></div>;
  } else if (state.status === "success") {
    body = <div className="tx-ok" role="status"><CheckCircle2 /><span>{t("Confirmed by GenLayer consensus.", "Đã được đồng thuận GenLayer xác nhận.")}</span></div>;
  } else {
    const order = ["checking", "wallet", "consensus"] as const;
    const labels = {
      checking: t("Checking the transaction", "Đang kiểm tra giao dịch"),
      wallet: t("Confirm in your wallet", "Xác nhận trong ví"),
      consensus: consensusLabel ?? t("Waiting for validators to agree", "Chờ các validator đồng thuận"),
    };
    const current = order.indexOf(state.phase as (typeof order)[number]);
    body = (
      <ul className="tx-steps" role="status" aria-live="polite">
        {order.map((p, i) => (
          <li key={p} className={i < current ? "done" : i === current ? "active" : ""}>
            {i < current ? <CheckCircle2 /> : i === current ? <Loader2 className="spin" /> : <Circle />}
            {labels[p]}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="token-field tx-panel">
      {body}
      {hashRow}
    </div>
  );
}
