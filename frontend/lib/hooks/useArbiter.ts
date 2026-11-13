"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Arbiter, { ContractError, type TxPhase } from "../contracts/Arbiter";
import { CONTRACT_ADDRESS } from "../genlayer/client";
import { useWallet } from "../genlayer/WalletProvider";

export const isConfigured = /^0x[0-9a-fA-F]{40}$/.test(CONTRACT_ADDRESS);

export function useArbiter(): Arbiter | null {
  const { address } = useWallet();
  return useMemo(
    () => (isConfigured ? new Arbiter(CONTRACT_ADDRESS as `0x${string}`, address) : null),
    [address],
  );
}

const live = { refetchInterval: 15_000, staleTime: 4_000 } as const;

export function useBounties() {
  const c = useArbiter();
  return useQuery({ queryKey: ["bounties"], queryFn: () => c!.getBounties(), enabled: !!c, ...live });
}

export function useBounty(id: number) {
  const c = useArbiter();
  return useQuery({
    queryKey: ["bounty", id],
    queryFn: () => c!.getBounty(id),
    enabled: !!c && Number.isInteger(id) && id >= 0,
    retry: false,
    ...live,
  });
}

export function useSubmissions(id: number) {
  const c = useArbiter();
  return useQuery({
    queryKey: ["submissions", id],
    queryFn: () => c!.getSubmissions(id),
    enabled: !!c && Number.isInteger(id) && id >= 0,
    ...live,
  });
}

export function useHunterSubmissions(address: string | null) {
  const c = useArbiter();
  return useQuery({
    queryKey: ["hunterSubmissions", address],
    queryFn: () => c!.getHunterSubmissions(address!),
    enabled: !!c && !!address,
    ...live,
  });
}

export function useStats() {
  const c = useArbiter();
  return useQuery({ queryKey: ["stats"], queryFn: () => c!.getStats(), enabled: !!c, ...live });
}

export function useLeaderboard() {
  const c = useArbiter();
  return useQuery({ queryKey: ["leaderboard"], queryFn: () => c!.getLeaderboard(), enabled: !!c, ...live });
}

export function usePlayerPoints(address: string | null) {
  const c = useArbiter();
  return useQuery({
    queryKey: ["points", address],
    queryFn: () => c!.getPlayerPoints(address!),
    enabled: !!c && !!address,
    ...live,
  });
}

export type TxState =
  | { status: "idle" }
  | { status: "pending"; phase: TxPhase; hash?: string }
  | { status: "success"; hash: string }
  | { status: "error"; message: string; hash?: string };

/** Runs one contract write and tracks its phases for <TxStatus>. */
export function useTx() {
  const qc = useQueryClient();
  const [state, setState] = useState<TxState>({ status: "idle" });

  const run = useCallback(
    async (fn: (onPhase: (p: TxPhase, hash?: string) => void) => Promise<{ hash: string }>) => {
      let lastHash: string | undefined;
      try {
        const { hash } = await fn((phase, hash) => {
          if (hash) lastHash = hash;
          setState({ status: "pending", phase, hash: hash ?? lastHash });
        });
        setState({ status: "success", hash });
        await qc.invalidateQueries();
        return true;
      } catch (err: any) {
        const message =
          err instanceof ContractError
            ? err.message
            : err?.code === 4001 || /reject|denied/i.test(err?.message ?? "")
              ? "USER_REJECTED"
              : err?.shortMessage || err?.message || "Unknown error";
        setState({ status: "error", message, hash: err?.hash ?? lastHash });
        await qc.invalidateQueries();
        return false;
      }
    },
    [qc],
  );

  const reset = useCallback(() => setState({ status: "idle" }), []);
  return { state, run, reset, busy: state.status === "pending" };
}
