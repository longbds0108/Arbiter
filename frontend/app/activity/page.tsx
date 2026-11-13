"use client";

import Link from "next/link";
import { Inbox, Send, Wallet } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GENLAYER_CHAIN_NAME } from "@/lib/genlayer/client";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useBounties, useHunterSubmissions, usePlayerPoints, isConfigured } from "@/lib/hooks/useArbiter";
import { EmptyState, PageHeading, VerdictPill, formatPoints } from "@/components/ui";
import BountyCard from "@/components/BountyCard";
import NotConfigured from "@/components/NotConfigured";

export default function ActivityPage() {
  const { t } = useI18n();
  const { address, connect } = useWallet();
  const bounties = useBounties();
  const subs = useHunterSubmissions(address);
  const points = usePlayerPoints(address);

  const mine = (bounties.data ?? []).filter((b) => address && b.creator.toLowerCase() === address.toLowerCase()).reverse();
  const titles = new Map((bounties.data ?? []).map((b) => [b.id, b.title]));
  const mySubs = [...(subs.data ?? [])].reverse();
  const wins = mySubs.filter((s) => s.verdict === "accepted").length;

  return (
    <>
      <PageHeading
        eyebrow={`Arbiter · ${GENLAYER_CHAIN_NAME}`}
        title={t("My activity", "Hoạt động của tôi")}
        intro={t("Bounties you posted and every verdict you received, read live from the contract.", "Các bounty bạn đã đăng và mọi kết quả chấm bạn nhận được, đọc trực tiếp từ hợp đồng.")}
      />
      {!isConfigured ? (
        <NotConfigured />
      ) : !address ? (
        <EmptyState
          icon={<Wallet size={18} />}
          title={t("Connect a wallet", "Hãy kết nối ví")}
          body={t("Your activity is tied to your address.", "Hoạt động của bạn gắn với địa chỉ ví.")}
          action={<button type="button" className="ui-button ui-button--primary ui-button--small" onClick={() => connect().catch(() => {})}>{t("Connect wallet", "Kết nối ví")}</button>}
        />
      ) : (
        <>
          <section className="metric-grid" aria-label={t("Your numbers", "Số liệu của bạn")}>
            <article className="ui-card metric-card"><span>{t("Reputation", "Uy tín")}</span><strong className="tnum">{formatPoints(points.data ?? 0)}</strong><small>{t("From accepted work", "Từ các bài đạt")}</small></article>
            <article className="ui-card metric-card"><span>{t("Bounties posted", "Bounty đã đăng")}</span><strong className="tnum">{mine.length}</strong><small>{t("As creator", "Với vai trò người tạo")}</small></article>
            <article className="ui-card metric-card"><span>{t("Submissions", "Bài đã nộp")}</span><strong className="tnum">{mySubs.length}</strong><small>{t("As hunter", "Với vai trò hunter")}</small></article>
            <article className="ui-card metric-card"><span>{t("Accepted", "Bài đạt")}</span><strong className="tnum">{wins}</strong><small>{t("Bounties won", "Bounty đã thắng")}</small></article>
          </section>

          <section className="ui-card section-card">
            <div className="section-heading"><div><p className="page-eyebrow">{t("Hunter", "Hunter")}</p><h2>{t("Your submissions", "Bài bạn đã nộp")}</h2></div></div>
            {mySubs.length === 0 ? (
              <EmptyState icon={<Send size={18} />} title={t("No submissions yet", "Chưa nộp bài nào")} body={t("Pick an open bounty and submit a link to your work.", "Chọn một bounty đang mở và nộp đường dẫn tới bài làm.")} action={<Link href="/" className="ui-button ui-button--small">{t("Browse bounties", "Xem bounty")}</Link>} />
            ) : (
              <div className="data-table">
                <div className="table-row table-head"><span>#</span><span>{t("Bounty", "Bounty")}</span><span>{t("Score", "Điểm")}</span><span>{t("Verdict", "Kết quả")}</span></div>
                {mySubs.map((s) => (
                  <div className="table-row" key={s.id}>
                    <span className="tnum">{s.bounty_id}</span>
                    <span className="asset-pair" style={{ display: "grid", gap: 4 }}>
                      <Link className="text-link" style={{ fontSize: ".79rem", color: "#eeeaf3" }} href={`/bounty/${s.bounty_id}`}>{titles.get(s.bounty_id) ?? `#${s.bounty_id}`}</Link>
                      <a className="text-link" href={s.url} target="_blank" rel="noreferrer noopener" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.url}</a>
                    </span>
                    <span className="tnum accent-value">{s.score} / 100</span>
                    <span><VerdictPill verdict={s.verdict} /></span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="ui-card section-card">
            <div className="section-heading"><div><p className="page-eyebrow">{t("Creator", "Người tạo")}</p><h2>{t("Bounties you posted", "Bounty bạn đã đăng")}</h2></div></div>
            {mine.length === 0 ? (
              <EmptyState icon={<Inbox size={18} />} title={t("You haven't posted a bounty", "Bạn chưa đăng bounty nào")} body={t("Describe the work and the criteria; the contract handles judging.", "Mô tả công việc và tiêu chí; hợp đồng sẽ lo phần chấm.")} action={<Link href="/post" className="ui-button ui-button--primary ui-button--small">{t("Post a bounty", "Đăng bounty")}</Link>} />
            ) : (
              <div className="vault-grid">{mine.map((b) => <BountyCard key={b.id} bounty={b} />)}</div>
            )}
          </section>
        </>
      )}
    </>
  );
}
