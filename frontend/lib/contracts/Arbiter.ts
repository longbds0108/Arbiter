import { createGenLayerClient } from "../genlayer/client";
import { estimateWriteFeePreset, feePresetToTransactionFees } from "../genlayer/fees";

export type BountyStatus = "open" | "awarded" | "closed";
export type Verdict = "accepted" | "rejected";

export interface Bounty {
  id: number;
  creator: string;
  title: string;
  brief: string;
  criteria: string;
  reward: number;
  status: BountyStatus;
  winner: string;
  submission_count: number;
}

export interface Submission {
  id: number;
  bounty_id: number;
  hunter: string;
  url: string;
  verdict: Verdict;
  score: number;
  reason: string;
}

export interface Stats {
  bounties: number;
  open: number;
  awarded: number;
  submissions: number;
  points_awarded: number;
}

export interface LeaderboardEntry {
  address: string;
  points: number;
}

/** Phases a write goes through, shown to the user one by one. */
export type TxPhase = "checking" | "wallet" | "consensus" | "confirmed";

export interface TxResult {
  hash: string;
  receipt: any;
}

/** Thrown when the transaction landed but the contract reverted or validators disagreed. */
export class ContractError extends Error {
  hash?: string;
  constructor(message: string, hash?: string) {
    super(message);
    this.name = "ContractError";
    this.hash = hash;
  }
}

/** genlayer-js decodes contract dicts as Map and ints as bigint; turn them into plain JSON. */
export function toPlain(value: unknown): any {
  if (value instanceof Map) {
    const out: Record<string, unknown> = {};
    value.forEach((v, k) => {
      out[String(k)] = toPlain(v);
    });
    return out;
  }
  if (Array.isArray(value)) return value.map(toPlain);
  if (typeof value === "bigint") return Number(value);
  if (value && typeof value === "object" && value.constructor === Object) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toPlain(v)]));
  }
  return value;
}

function receiptFailure(receipt: any): string | null {
  const leader = receipt?.consensus_data?.leader_receipt?.[0];
  if (receipt?.txExecutionResultName === "FINISHED_WITH_ERROR" || leader?.execution_result === "ERROR") {
    const raw = String(leader?.error ?? leader?.result ?? "");
    const match = raw.match(/UserError[^'"]*['"]([^'"]+)['"]/) ?? raw.match(/['"]([^'"]{4,200})['"]/);
    return match?.[1] ?? (raw ? raw.slice(0, 200) : "Contract reverted");
  }
  const result = receipt?.resultName;
  if (result && ["NO_MAJORITY", "MAJORITY_DISAGREE", "DETERMINISTIC_VIOLATION"].includes(result)) {
    return `Validators did not agree (${result})`;
  }
  return null;
}

export default class Arbiter {
  private client: any;

  constructor(private address: `0x${string}`, account?: string | null) {
    this.client = createGenLayerClient(account);
  }

  private async read(functionName: string, args: unknown[] = []) {
    const raw = await this.client.readContract({ address: this.address, functionName, args });
    return toPlain(raw);
  }

  getBounties = async (): Promise<Bounty[]> => this.read("get_bounties");
  getBounty = async (id: number): Promise<Bounty> => this.read("get_bounty", [id]);
  getSubmissions = async (id: number): Promise<Submission[]> => this.read("get_submissions", [id]);
  getHunterSubmissions = async (addr: string): Promise<Submission[]> => this.read("get_hunter_submissions", [addr]);
  getStats = async (): Promise<Stats> => this.read("get_stats");
  getPlayerPoints = async (addr: string): Promise<number> => Number(await this.read("get_player_points", [addr]));

  getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
    const points: Record<string, number> = await this.read("get_points");
    return Object.entries(points)
      .map(([address, pts]) => ({ address, points: Number(pts) }))
      .sort((a, b) => b.points - a.points);
  };

  private async write(functionName: string, args: unknown[], onPhase: (p: TxPhase, hash?: string) => void): Promise<TxResult> {
    onPhase("checking");
    const request = { address: this.address, functionName, args };
    let fees: unknown;
    try {
      fees = feePresetToTransactionFees(await estimateWriteFeePreset(this.client, request));
    } catch {
      fees = undefined; // estimation is optional; the node falls back to defaults
    }

    onPhase("wallet");
    const hash: string = await this.client.writeContract({ ...request, value: 0n, ...(fees ? { fees } : {}) });

    onPhase("consensus", hash);
    const receipt = await this.client.waitForTransactionReceipt({
      hash,
      status: "ACCEPTED",
      retries: 60,
      interval: 5000,
    });

    const failure = receiptFailure(receipt);
    if (failure) throw new ContractError(failure, hash);
    onPhase("confirmed", hash);
    return { hash, receipt };
  }

  createBounty(title: string, brief: string, criteria: string, reward: number, onPhase: (p: TxPhase, hash?: string) => void) {
    return this.write("create_bounty", [title, brief, criteria, reward], onPhase);
  }

  submitWork(bountyId: number, url: string, onPhase: (p: TxPhase, hash?: string) => void) {
    return this.write("submit_work", [bountyId, url], onPhase);
  }

  closeBounty(bountyId: number, onPhase: (p: TxPhase, hash?: string) => void) {
    return this.write("close_bounty", [bountyId], onPhase);
  }
}
