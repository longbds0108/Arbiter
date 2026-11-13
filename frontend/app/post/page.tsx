"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { PenLine } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { GENLAYER_CHAIN_NAME } from "@/lib/genlayer/client";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useArbiter, useTx, isConfigured } from "@/lib/hooks/useArbiter";
import { PageHeading, TxStatus } from "@/components/ui";
import NotConfigured from "@/components/NotConfigured";

const LIMITS = { title: [4, 120], brief: [10, 1200], criteria: [10, 1200] } as const;

export default function PostPage() {
  const { t } = useI18n();
  const router = useRouter();
  const qc = useQueryClient();
  const { address, connect } = useWallet();
  const contract = useArbiter();
  const tx = useTx();

  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [criteria, setCriteria] = useState("");
  const [reward, setReward] = useState("20");
  const [touched, setTouched] = useState(false);

  const rewardNum = Number(reward);
  const len = (v: string) => v.trim().length;
  const errors = {
    title: len(title) < LIMITS.title[0] ? t("At least 4 characters.", "Ít nhất 4 ký tự.") : len(title) > LIMITS.title[1] ? t("At most 120 characters.", "Tối đa 120 ký tự.") : null,
    brief: len(brief) < LIMITS.brief[0] ? t("At least 10 characters.", "Ít nhất 10 ký tự.") : len(brief) > LIMITS.brief[1] ? t("At most 1,200 characters.", "Tối đa 1.200 ký tự.") : null,
    criteria: len(criteria) < LIMITS.criteria[0] ? t("At least 10 characters.", "Ít nhất 10 ký tự.") : len(criteria) > LIMITS.criteria[1] ? t("At most 1,200 characters.", "Tối đa 1.200 ký tự.") : null,
    reward: !Number.isInteger(rewardNum) || rewardNum < 1 || rewardNum > 100 ? t("A whole number from 1 to 100.", "Số nguyên từ 1 đến 100.") : null,
  };
  const valid = !Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) => touched && errors[k] && <p className="field-error">{errors[k]}</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || !contract) return;
    if (!address) {
      // The contract client is rebuilt with the account after connecting; post on the next click.
      await connect().catch(() => {});
      return;
    }
    const ok = await tx.run((onPhase) => contract.createBounty(title.trim(), brief.trim(), criteria.trim(), rewardNum, onPhase));
    if (ok) {
      const all = await contract.getBounties().catch(() => []);
      const created = [...all].reverse().find((b) => b.creator.toLowerCase() === address.toLowerCase() && b.title === title.trim());
      await qc.invalidateQueries({ queryKey: ["bounties"] });
      if (created) setTimeout(() => router.push(`/bounty/${created.id}`), 900);
    }
  };

  return (
    <>
      <PageHeading
        eyebrow={`Arbiter · ${GENLAYER_CHAIN_NAME}`}
        title={t("Post a bounty", "Đăng bounty")}
        intro={t(
          "Write criteria a stranger could check by reading one web page. The contract judges every submission against exactly what you write here.",
          "Viết tiêu chí mà người lạ có thể kiểm tra chỉ bằng cách đọc một trang web. Hợp đồng chấm mọi bài nộp đúng theo những gì bạn viết ở đây.",
        )}
      />

      {!isConfigured ? (
        <NotConfigured />
      ) : (
        <div className="workbench">
          <form className="ui-card form-card form-stack" onSubmit={submit} noValidate>
            <div className="section-heading" style={{ marginBottom: 10 }}>
              <div>
                <p className="page-eyebrow">{t("New bounty", "Bounty mới")}</p>
                <h2 style={{ marginTop: 8, fontSize: "1.35rem", fontWeight: 400, letterSpacing: "-.035em" }}>{t("Describe the work", "Mô tả công việc")}</h2>
              </div>
            </div>

            <div className="token-field">
              <div className="field-top"><label htmlFor="title">{t("Title", "Tiêu đề")}</label><span className="tnum">{len(title)} / 120</span></div>
              <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder={t("Write a beginner guide to GenLayer", "Viết hướng dẫn GenLayer cho người mới")} />
            </div>
            {show("title")}

            <div className="token-field">
              <div className="field-top"><label htmlFor="brief">{t("What you want produced", "Bạn cần sản phẩm gì")}</label><span className="tnum">{len(brief).toLocaleString("en-US")} / 1,200</span></div>
              <textarea id="brief" value={brief} onChange={(e) => setBrief(e.target.value)} maxLength={1200} placeholder={t("A public blog post that explains intelligent contracts to web2 developers.", "Một bài blog công khai giải thích intelligent contract cho lập trình viên web2.")} />
            </div>
            {show("brief")}

            <div className="token-field">
              <div className="field-top"><label htmlFor="criteria">{t("Acceptance criteria", "Tiêu chí nghiệm thu")}</label><span className="tnum">{len(criteria).toLocaleString("en-US")} / 1,200</span></div>
              <textarea id="criteria" value={criteria} onChange={(e) => setCriteria(e.target.value)} maxLength={1200} placeholder={t("At least 600 words. Explains the equivalence principle. Includes one code sample.", "Ít nhất 600 từ. Giải thích equivalence principle. Có ít nhất một đoạn code mẫu.")} />
            </div>
            {show("criteria")}

            <div className="token-field">
              <div className="field-top"><label htmlFor="reward">{t("Reward", "Phần thưởng")}</label><span>{t("1–100 reputation points", "1–100 điểm uy tín")}</span></div>
              <input id="reward" className="tnum" inputMode="numeric" value={reward} onChange={(e) => setReward(e.target.value.replace(/[^0-9]/g, ""))} style={{ fontSize: "1.65rem", letterSpacing: "-.04em" }} />
            </div>
            {show("reward")}

            <button type="submit" className="ui-button ui-button--primary ui-button--wide" disabled={tx.busy}>
              <PenLine size={15} />
              {address ? t("Post bounty", "Đăng bounty") : t("Connect wallet to post", "Kết nối ví để đăng")}
            </button>
            <p className="form-note">{t("A submission passes with an accepted verdict and a score of 60 or more.", "Bài nộp đạt khi được chấm “đạt” và có điểm từ 60 trở lên.")}</p>
            <TxStatus state={tx.state} consensusLabel={t("Waiting for validators to accept the transaction", "Chờ validator chấp nhận giao dịch")} />
          </form>

          <aside className="info-panel">
            <h3>{t("Preview", "Xem trước")}</h3>
            <p><span>{t("Title", "Tiêu đề")}</span><b>{title.trim() || "—"}</b></p>
            <p><span>{t("Reward", "Phần thưởng")}</span><b className="tnum">{errors.reward ? "—" : `${rewardNum} PTS`}</b></p>
            <p><span>{t("Attempts per hunter", "Lượt mỗi hunter")}</span><b className="tnum">3</b></p>
            <p><span>{t("Pass mark", "Ngưỡng đạt")}</span><b className="tnum">60 / 100</b></p>
            <p><span>{t("Judged by", "Người chấm")}</span><b>{t("GenLayer validators", "Validator GenLayer")}</b></p>
            <p>
              <span>{t("You can close it any time before someone wins.", "Bạn có thể đóng bất cứ lúc nào trước khi có người thắng.")}</span>
              <Link className="text-link" href="/how-it-works">{t("How judging works", "Cách chấm bài")}</Link>
            </p>
          </aside>
        </div>
      )}
    </>
  );
}
