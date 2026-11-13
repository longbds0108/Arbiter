"use client";

import Link from "next/link";
import { Award, Scale } from "lucide-react";
import type { Bounty } from "@/lib/contracts/Arbiter";
import { useI18n } from "@/lib/i18n";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { shortAddress } from "@/lib/genlayer/client";
import { StatusPill, formatPoints } from "./ui";

export default function BountyCard({ bounty }: { bounty: Bounty }) {
  const { t } = useI18n();
  const { address } = useWallet();
  const mine = !!address && address.toLowerCase() === bounty.creator.toLowerCase();

  return (
    <Link href={`/bounty/${bounty.id}`} className="ui-card vault-card">
      <div className="vault-card__top">
        <span className="page-eyebrow">
          {t("Bounty", "Bounty")} #{bounty.id}
          {mine ? ` · ${t("Yours", "Của bạn")}` : ""}
        </span>
        <StatusPill status={bounty.status} />
      </div>
      <h3>{bounty.title}</h3>
      <p className="vault-card__copy">{t("Judged on-chain by GenLayer validators", "Được validator GenLayer chấm on-chain")}</p>
      <div className="vault-card__stats">
        <span>{t("Reward", "Phần thưởng")}<b className="tnum">{formatPoints(bounty.reward)}</b></span>
        <span>{t("Submissions", "Bài nộp")}<b className="tnum">{bounty.submission_count}</b></span>
        <span>{t("Creator", "Người tạo")}<b className="tnum">{shortAddress(bounty.creator)}</b></span>
      </div>
      <p className="vault-card__foot">
        {bounty.status === "awarded" ? (
          <><Award />{t(`Won by ${shortAddress(bounty.winner)}`, `${shortAddress(bounty.winner)} đã thắng`)}</>
        ) : bounty.status === "closed" ? (
          <><Scale />{t("Closed by the creator without a winner", "Người tạo đã đóng, không có người thắng")}</>
        ) : (
          <><Scale />{t("First accepted submission wins", "Bài đạt đầu tiên sẽ thắng")}</>
        )}
      </p>
    </Link>
  );
}
