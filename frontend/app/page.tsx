"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Inbox } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GENLAYER_CHAIN_NAME } from "@/lib/genlayer/client";
import { useBounties, useStats, isConfigured } from "@/lib/hooks/useArbiter";
import type { BountyStatus } from "@/lib/contracts/Arbiter";
import { EmptyState, PageHeading } from "@/components/ui";
import BountyCard from "@/components/BountyCard";
import NotConfigured, { LoadError } from "@/components/NotConfigured";

type Filter = "all" | BountyStatus;

export default function BoardPage() {
  const { t } = useI18n();
  const bounties = useBounties();
  const stats = useStats();
  const [filter, setFilter] = useState<Filter>("all");

  const list = useMemo(() => {
    const all = [...(bounties.data ?? [])].reverse(); // newest first
    return filter === "all" ? all : all.filter((b) => b.status === filter);
  }, [bounties.data, filter]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("All", "Tất cả") },
    { id: "open", label: t("Open", "Đang mở") },
    { id: "awarded", label: t("Awarded", "Đã trao") },
    { id: "closed", label: t("Closed", "Đã đóng") },
  ];

  const s = stats.data;
  const metrics = [
    { label: t("Bounties posted", "Bounty đã đăng"), value: s?.bounties, sub: t("All time", "Từ trước đến nay") },
    { label: t("Open now", "Đang mở"), value: s?.open, sub: t("Accepting submissions", "Đang nhận bài nộp") },
    { label: t("Submissions judged", "Bài đã chấm"), value: s?.submissions, sub: t("Each one read on-chain", "Mỗi bài được đọc on-chain") },
    { label: t("Points awarded", "Điểm đã trao"), value: s?.points_awarded, sub: t("Reputation, in PTS", "Uy tín, tính bằng PTS"), unit: " PTS" },
  ];

  return (
    <>
      <PageHeading
        eyebrow={`Arbiter · ${GENLAYER_CHAIN_NAME}`}
        title={t("Bounty board", "Bảng bounty")}
        intro={t(
          "Post work you need done with clear acceptance criteria. Hunters submit a link; the contract reads it and validators agree on the verdict.",
          "Đăng việc bạn cần làm kèm tiêu chí nghiệm thu rõ ràng. Hunter nộp đường dẫn; hợp đồng tự đọc và các validator đồng thuận về kết quả.",
        )}
        actions={<Link href="/post" className="ui-button ui-button--primary">{t("Post a bounty", "Đăng bounty")} <span aria-hidden="true">↗</span></Link>}
      />

      {!isConfigured ? (
        <NotConfigured />
      ) : (
        <>
          <section className="metric-grid" aria-label={t("Board overview", "Tổng quan")}>
            {metrics.map((m) => (
              <article key={m.label} className="ui-card metric-card">
                <span>{m.label}</span>
                {m.value == null ? <div className="skeleton" style={{ height: 30, width: "60%" }} /> : <strong className="tnum">{m.value.toLocaleString("en-US")}{m.unit ?? ""}</strong>}
                <small>{m.sub}</small>
              </article>
            ))}
          </section>

          <section className="ui-card section-card">
            <div className="section-heading">
              <div>
                <p className="page-eyebrow">{t("Bounties", "Bounty")}</p>
                <h2>{t("All bounties", "Tất cả bounty")}</h2>
              </div>
              <div className="segmented-control" role="group" aria-label={t("Filter by status", "Lọc theo trạng thái")}>
                {filters.map((f) => (
                  <button key={f.id} type="button" className={filter === f.id ? "is-selected" : ""} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {bounties.isError ? (
              <LoadError onRetry={() => bounties.refetch()} />
            ) : bounties.isLoading ? (
              <div className="vault-grid">{[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 250 }} />)}</div>
            ) : list.length === 0 ? (
              <EmptyState
                icon={<Inbox size={18} />}
                title={filter === "all" ? t("No bounties yet", "Chưa có bounty nào") : t("Nothing in this view", "Không có bounty nào ở mục này")}
                body={
                  filter === "all"
                    ? t("The contract is live but nobody has posted a bounty. Be the first.", "Hợp đồng đã chạy nhưng chưa ai đăng bounty. Hãy là người đầu tiên.")
                    : t("Try another filter.", "Hãy thử bộ lọc khác.")
                }
                action={filter === "all" ? <Link href="/post" className="ui-button ui-button--primary ui-button--small">{t("Post a bounty", "Đăng bounty")}</Link> : undefined}
              />
            ) : (
              <div className="vault-grid">{list.map((b) => <BountyCard key={b.id} bounty={b} />)}</div>
            )}
          </section>
        </>
      )}
    </>
  );
}
