"use client";

import { useI18n } from "@/lib/i18n";
import { GENLAYER_CHAIN_NAME } from "@/lib/genlayer/client";
import { PageHeading } from "@/components/ui";

export default function HowPage() {
  const { t } = useI18n();
  const steps = [
    {
      title: t("A creator posts", "Người tạo đăng bài"),
      body: t("Title, what they want produced, acceptance criteria and a reward of 1–100 reputation points. Stored in the contract.", "Tiêu đề, sản phẩm cần làm, tiêu chí nghiệm thu và phần thưởng 1–100 điểm uy tín. Lưu trong hợp đồng."),
    },
    {
      title: t("A hunter submits a link", "Hunter nộp đường dẫn"),
      body: t("Any public https:// page: a blog post, a repo, a thread. Three attempts per hunter per bounty.", "Bất kỳ trang https:// công khai: bài blog, repo, thread. Mỗi hunter có 3 lượt cho mỗi bounty."),
    },
    {
      title: t("The contract judges", "Hợp đồng chấm bài"),
      body: t("The leader validator renders the page, an LLM scores it 0–100 against the criteria and returns accepted or rejected with a reason.", "Validator dẫn đầu tải trang, LLM chấm 0–100 theo tiêu chí và trả về đạt hoặc không đạt kèm lý do."),
    },
    {
      title: t("Validators agree", "Validator đồng thuận"),
      body: t("Other validators redo the judgement. Under the comparative equivalence principle the verdict must match and scores may differ by 15 at most.", "Các validator khác chấm lại. Theo equivalence principle dạng so sánh, kết quả phải trùng và điểm chênh tối đa 15."),
    },
  ];

  return (
    <>
      <PageHeading
        eyebrow={`Arbiter · ${GENLAYER_CHAIN_NAME}`}
        title={t("How it works", "Cách hoạt động")}
        intro={t(
          "Arbiter is an intelligent contract on GenLayer. It can read the web and reason with an LLM, so judging work is part of the transaction instead of a person's job.",
          "Arbiter là một intelligent contract trên GenLayer. Nó đọc được web và suy luận bằng LLM, nên việc chấm bài nằm ngay trong giao dịch thay vì là việc của một người.",
        )}
      />
      <section className="how-grid">
        {steps.map((s, i) => (
          <article key={s.title} className="ui-card">
            <span className="page-eyebrow tnum">0{i + 1}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
          </article>
        ))}
      </section>

      <section className="workbench" style={{ marginTop: 22 }}>
        <div className="ui-card section-card" style={{ marginTop: 0 }}>
          <div className="section-heading"><h2>{t("Passing rule", "Quy tắc đạt")}</h2></div>
          <p className="prose">
            {t(
              "A submission wins when the agreed verdict is “accepted” and the score is 60 or more. The bounty closes immediately and the reward goes to the hunter's reputation. Rejected submissions stay on record with their reason, so everyone can see why.",
              "Bài nộp thắng khi kết quả đồng thuận là “đạt” và điểm từ 60 trở lên. Bounty đóng ngay và phần thưởng cộng vào uy tín của hunter. Bài không đạt vẫn được lưu kèm lý do để mọi người thấy vì sao.",
            )}
          </p>
        </div>
        <div className="info-panel">
          <h3>{t("Prompt-injection guard", "Chống prompt injection")}</h3>
          <p style={{ display: "block", lineHeight: 1.6 }}>
            {t(
              "The page text is fenced as data and the judge is told to ignore instructions inside it. Validators judge independently, so one manipulated run cannot pass alone.",
              "Nội dung trang được rào lại như dữ liệu và bộ chấm được yêu cầu bỏ qua mọi chỉ dẫn bên trong. Các validator chấm độc lập, nên một lần chạy bị thao túng không thể tự qua được.",
            )}
          </p>
        </div>
      </section>
    </>
  );
}
