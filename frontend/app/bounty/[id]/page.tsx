"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileSearch } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useBounty, useSubmissions, isConfigured } from "@/lib/hooks/useArbiter";
import { EmptyState } from "@/components/ui";
import BountyDetail from "@/components/BountyDetail";
import NotConfigured from "@/components/NotConfigured";

export default function BountyPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { address } = useWallet();
  const bounty = useBounty(id);
  const subs = useSubmissions(id);

  const back = (
    <Link href="/" className="text-link">
      <ArrowLeft size={15} /> {t("All bounties", "Tất cả bounty")}
    </Link>
  );

  if (!isConfigured) return <NotConfigured />;
  if (bounty.isLoading) return <div className="skeleton" style={{ height: 420 }} />;
  if (bounty.isError || !bounty.data) {
    return (
      <EmptyState
        icon={<FileSearch size={18} />}
        title={t("Bounty not found", "Không tìm thấy bounty")}
        body={t(`There is no bounty #${params.id} on this contract.`, `Không có bounty #${params.id} trên hợp đồng này.`)}
        action={back}
      />
    );
  }

  return <BountyDetail bounty={bounty.data} submissions={subs.data ?? []} me={address} back={back} />;
}

