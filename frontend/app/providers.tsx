"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n";
import { WalletProvider } from "@/lib/genlayer/WalletProvider";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: true, retry: 1 } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <WalletProvider>{children}</WalletProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
