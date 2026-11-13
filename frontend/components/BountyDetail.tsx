"use client";

import { useState, type ReactNode } from "react";
import { Lock, Scale, Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GENLAYER_CHAIN_NAME, shortAddress } from "@/lib/genlayer/client";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useArbiter, useTx } from "@/lib/hooks/useArbiter";
import type { Bounty, Submission } from "@/lib/contracts/Arbiter";
import { Avatar, EmptyState, PageHeading, StatusPill, TxStatus, VerdictPill, formatPoints } from "./ui";

const MAX_ATTEMPTS = 3;
const PASS_SCORE = 60;

function SubmissionRow({ sub, me }: { sub: Submission; me: boolean }) {
  const { t } = useI18n();
  return (
    <article className="token-field">
      <div className="sub-top">
        <span className="sub-who">
          <Avatar address={sub.hunter} />
          <span className="tnum">{shortAddress(sub.hunter)}</span>
          {me && <span className="status-pill status-pill--muted">{t("You", "Bạn")}</span>}
        </span>
        <VerdictPill verdict={sub.verdict} />
      </div>
      <a href={sub.url} target="_blank" rel="noreferrer noopener">{sub.url}</a>
      {sub.reason && <p>{sub.reason}</p>}
      <div className={`health-meter${sub.score >= PASS_SCORE ? " pass" : ""}`}>
        <div>
          <span>{t("Score · pass mark 60", "Điểm · ngưỡng đạt 60")}</span>
          <b className="tnum">{sub.score} / 100</b>
        </div>
        <i role="img" aria-label={t(`Score ${sub.score} of 100`, `Điểm ${sub.score}/100`)}><span style={{ width: `${sub.score}%` }} /></i>
      </div>
    </article>
  );
}

function Lifecycle({ bounty, submissions }: { bounty: Bounty; submissions: Submission[] }) {
  const { t } = useI18n();
  const accepted = submissions.filter((s) => s.verdict === "accepted").length;
  return (
    <div className="info-panel">
      <span className="info-icon"><Scale size={16} /></span>
      <h3>{t("Bounty status", "Trạng thái bounty")}</h3>
      <p><span>{t("Status", "Trạng thái")}</span><StatusPill status={bounty.status} /></p>
      <p><span>{t("Reward", "Phần thưởng")}</span><b className="tnum">{formatPoints(bounty.reward)}</b></p>
      <p><span>{t("Verdicts recorded", "Kết quả đã ghi")}</span><b className="tnum">{submissions.length} · {accepted} {t("accepted", "đạt")}</b></p>
      <p><span>{t("Creator", "Người tạo")}</span><b className="tnum">{shortAddress(bounty.creator)}</b></p>
      <p><span>{t("Winner", "Người thắng")}</span><b className="tnum">{bounty.winner ? shortAddress(bounty.winner) : "—"}</b></p>
      <p><span>{t("Network", "Mạng")}</span><b>{GENLAYER_CHAIN_NAME}</b></p>
    </div>
  );
}

function SubmitPanel({ bounty, submissions }: { bounty: Bounty; submissions: Submission[] }) {
  const { t } = useI18n();
  const { address, connect } = useWallet();
  const contract = useArbiter();
  const tx = useTx();
  const closeTx = useTx();
  const [url, setUrl] = useState("");
  const [touched, setTouched] = useState(false);

  const isCreator = !!address && address.toLowerCase() === bounty.creator.toLowerCase();
  const used = address ? submissions.filter((s) => s.hunter.toLowerCase() === address.toLowerCase()).length : 0;
  const left = MAX_ATTEMPTS - used;
  const urlError = !/^https:\/\/\S+$/.test(url.trim()) ? t("Enter a single https:// link.", "Nhập đúng một đường dẫn https://.") : null;

  let body: ReactNode;
  if (bounty.status !== "open") {
    body = (
      <p className="page-intro" style={{ marginTop: 0 }}>
        {bounty.status === "awarded"
          ? t(`${shortAddress(bounty.winner)} won ${bounty.reward} PTS with an accepted submission.`, `${shortAddress(bounty.winner)} đã nhận ${bounty.reward} PTS với bài nộp đạt.`)
          : t("The creator closed this bounty before anyone won.", "Người tạo đã đóng bounty này trước khi có người thắng.")}
      </p>
    );
  } else if (!address) {
    body = (
      <div className="form-stack">
        <p className="page-intro" style={{ marginTop: 0 }}>{t("Connect a wallet to submit a link to your work.", "Kết nối ví để nộp đường dẫn tới bài làm của bạn.")}</p>
        <button type="button" className="ui-button ui-button--primary ui-button--wide" onClick={() => connect().catch(() => {})}>{t("Connect wallet", "Kết nối ví")}</button>
      </div>
    );
  } else if (isCreator) {
    body = (
      <div className="form-stack">
        <p className="page-intro" style={{ marginTop: 0 }}>
          {t("You can't submit to your own bounty. Closing it stops new submissions; nobody receives the reward.", "Bạn không thể nộp bài cho bounty của mình. Đóng bounty sẽ ngừng nhận bài; không ai nhận thưởng.")}
        </p>
        <button type="button" className="ui-button ui-button--wide" disabled={closeTx.busy || !contract} onClick={() => contract && closeTx.run((onPhase) => contract.closeBounty(bounty.id, onPhase))}>
          <Lock size={15} /> {t("Close bounty", "Đóng bounty")}
        </button>
        <TxStatus state={closeTx.state} />
      </div>
    );
  } else {
    body = (
      <form
        className="form-stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (urlError || !contract || left <= 0) return;
          tx.run((onPhase) => contract.submitWork(bounty.id, url.trim(), onPhase)).then((ok) => ok && setUrl(""));
        }}
      >
        <div className="token-field">
          <div className="field-top">
            <label htmlFor="url">{t("Link to your work", "Đường dẫn tới bài làm")}</label>
            <span className="tnum">{t(`${left} of ${MAX_ATTEMPTS} attempts left`, `Còn ${left}/${MAX_ATTEMPTS} lượt`)}</span>
          </div>
          <input id="url" type="url" inputMode="url" placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} disabled={tx.busy} />
        </div>
        {touched && urlError && <p className="field-error">{urlError}</p>}
        <button type="submit" className="ui-button ui-button--primary ui-button--wide" disabled={tx.busy || left <= 0}>
          {t("Submit for judging", "Nộp để chấm")}
        </button>
        <p className="form-note">{t("The page must be public. Judging takes a few minutes.", "Trang phải công khai. Việc chấm mất vài phút.")}</p>
        <TxStatus state={tx.state} consensusLabel={t("Validators are reading your page and judging it", "Các validator đang đọc trang và chấm bài")} />
      </form>
    );
  }

  return (
    <section className="ui-card side-card">
      <div className="section-heading" style={{ marginBottom: 18 }}>
        <h2>
          {bounty.status !== "open"
            ? t("Submissions are closed", "Đã ngừng nhận bài")
            : isCreator
              ? t("Manage your bounty", "Quản lý bounty")
              : t("Submit your work", "Nộp bài")}
        </h2>
      </div>
      {body}
    </section>
  );
}

export default function BountyDetail({ bounty, submissions, me, back }: { bounty: Bounty; submissions: Submission[]; me: string | null; back: ReactNode }) {
  const { t } = useI18n();
  const ordered = [...submissions].reverse();

  return (
    <>
      <div style={{ marginBottom: 18 }}>{back}</div>
      <PageHeading eyebrow={`${t("Bounty", "Bounty")} #${bounty.id} · ${GENLAYER_CHAIN_NAME}`} title={bounty.title} />

      <div className="workbench">
        <div className="stack">
          <section className="ui-card section-card">
            <div className="section-heading"><h2>{t("What the creator wants", "Người tạo cần gì")}</h2></div>
            <p className="prose">{bounty.brief}</p>
            <div className="token-field" style={{ marginTop: 18 }}>
              <div className="field-top"><label>{t("Acceptance criteria", "Tiêu chí nghiệm thu")}</label></div>
              <p className="prose">{bounty.criteria}</p>
            </div>
          </section>

          <section className="ui-card section-card">
            <div className="section-heading">
              <h2>{t("Verdicts", "Kết quả chấm")}</h2>
              <span className="status-pill status-pill--muted tnum"><i />{submissions.length}</span>
            </div>
            {ordered.length === 0 ? (
              <EmptyState
                icon={<Trophy size={18} />}
                title={t("No submissions yet", "Chưa có bài nộp")}
                body={t("Every submission and its verdict will appear here, straight from the contract.", "Mọi bài nộp và kết quả chấm sẽ hiện ở đây, lấy trực tiếp từ hợp đồng.")}
              />
            ) : (
              <div className="sub-list">
                {ordered.map((s) => <SubmissionRow key={s.id} sub={s} me={!!me && me.toLowerCase() === s.hunter.toLowerCase()} />)}
              </div>
            )}
          </section>
        </div>

        <div className="stack">
          <SubmitPanel bounty={bounty} submissions={submissions} />
          <Lifecycle bounty={bounty} submissions={submissions} />
        </div>
      </div>
    </>
  );
}
