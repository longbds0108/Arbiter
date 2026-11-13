"use client";

import { Rocket } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { EmptyState } from "./ui";

/** Shown wherever live data is needed but no contract address is configured. */
export default function NotConfigured() {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={<Rocket size={18} />}
      title={t("Contract not deployed yet", "Hợp đồng chưa được triển khai")}
      body={t(
        "Deploy contracts/arbiter.py with `genlayer deploy`, then put the address in frontend/.env as NEXT_PUBLIC_CONTRACT_ADDRESS and restart the app.",
        "Triển khai contracts/arbiter.py bằng `genlayer deploy`, rồi điền địa chỉ vào frontend/.env ở biến NEXT_PUBLIC_CONTRACT_ADDRESS và khởi động lại ứng dụng.",
      )}
    />
  );
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <EmptyState
      icon={<Rocket size={18} />}
      title={t("Couldn't reach the contract", "Không kết nối được hợp đồng")}
      body={t(
        "The GenLayer RPC didn't answer, or the address in NEXT_PUBLIC_CONTRACT_ADDRESS isn't an Arbiter contract on this network.",
        "RPC GenLayer không phản hồi, hoặc địa chỉ trong NEXT_PUBLIC_CONTRACT_ADDRESS không phải hợp đồng Arbiter trên mạng này.",
      )}
      action={
        <button type="button" className="ui-button ui-button--small" onClick={onRetry}>
          {t("Try again", "Thử lại")}
        </button>
      }
    />
  );
}
