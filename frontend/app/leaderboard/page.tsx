"use client";

import { Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GENLAYER_CHAIN_NAME, shortAddress } from "@/lib/genlayer/client";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useLeaderboard, isConfigured } from "@/lib/hooks/useArbiter";
import { Avatar, EmptyState, PageHeading, formatPoints } from "@/components/ui";
import NotConfigured, { LoadError } from "@/components/NotConfigured";

export default function LeaderboardPage() {
  const { t } = useI18n();
  const { address } = useWallet();
  const board = useLeaderboard();
  const rows = board.data ?? [];
  const total = rows.reduce((n, r) => n + r.points, 0);

  return (
    <>
      <PageHeading
        eyebrow={`Arbiter · ${GENLAYER_CHAIN_NAME}`}
        title={t("Leaderboard", "Bảng xếp hạng")}
        intro={t("Hunters ranked by reputation earned from accepted work. Points only come from verdicts the validators agreed on.", "Hunter xếp hạng theo điểm uy tín từ các bài đạt. Điểm chỉ đến từ kết quả mà các validator đã đồng thuận.")}
      />
      {!isConfigured ? (
        <NotConfigured />
      ) : board.isError ? (
        <LoadError onRetry={() => board.refetch()} />
      ) : board.isLoading ? (
        <div className="skeleton" style={{ height: 320 }} />
      ) : rows.length === 0 ? (
        <EmptyState icon={<Trophy size={18} />} title={t("No points awarded yet", "Chưa có điểm nào được trao")} body={t("The first accepted submission puts its hunter on the board.", "Bài đạt đầu tiên sẽ đưa hunter lên bảng.")} />
      ) : (
        <section className="ui-card section-card" style={{ marginTop: 0 }}>
          <div className="data-table">
            <div className="table-row table-head">
              <span>#</span>
              <span>{t("Hunter", "Hunter")}</span>
              <span>{t("Share", "Tỷ trọng")}</span>
              <span>{t("Reputation", "Uy tín")}</span>
            </div>
            {rows.map((r, i) => {
              const you = !!address && address.toLowerCase() === r.address.toLowerCase();
              return (
                <div className="table-row" key={r.address}>
                  <span className="tnum">{i + 1}</span>
                  <span className="asset-pair">
                    <Avatar address={r.address} />
                    <b className="tnum" style={{ fontWeight: 500 }}>{shortAddress(r.address, 10, 8)}</b>
                    {you && <span className="status-pill status-pill--info"><i />{t("You", "Bạn")}</span>}
                  </span>
                  <span className="tnum">{total ? `${((r.points / total) * 100).toFixed(1)}%` : "—"}</span>
                  <span className="tnum accent-value">{formatPoints(r.points)}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
