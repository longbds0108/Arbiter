"use client";

import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export const GENLAYER_CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID || "61999");
export const GENLAYER_CHAIN_ID_HEX = `0x${GENLAYER_CHAIN_ID.toString(16).toUpperCase()}`;
export const GENLAYER_CHAIN_NAME = process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME || "GenLayer Studio";
export const GENLAYER_SYMBOL = process.env.NEXT_PUBLIC_GENLAYER_SYMBOL || "GEN";
export const GENLAYER_RPC_URL = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api";
export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export const GENLAYER_NETWORK = {
  chainId: GENLAYER_CHAIN_ID_HEX,
  chainName: GENLAYER_CHAIN_NAME,
  nativeCurrency: { name: GENLAYER_SYMBOL, symbol: GENLAYER_SYMBOL, decimals: 18 },
  rpcUrls: [GENLAYER_RPC_URL],
  blockExplorerUrls: [],
};

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export function getProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return window.ethereum ?? null;
}

export async function getAccounts(): Promise<string[]> {
  const provider = getProvider();
  if (!provider) return [];
  try {
    return await provider.request({ method: "eth_accounts" });
  } catch {
    return [];
  }
}

export async function getChainId(): Promise<string | null> {
  const provider = getProvider();
  if (!provider) return null;
  try {
    return await provider.request({ method: "eth_chainId" });
  } catch {
    return null;
  }
}

export function isGenLayerChain(chainId: string | null): boolean {
  return !!chainId && parseInt(chainId, 16) === GENLAYER_CHAIN_ID;
}

/** Switch MetaMask to the GenLayer network, adding it first if MetaMask doesn't know it. */
export async function switchToGenLayer(): Promise<void> {
  const provider = getProvider();
  if (!provider) throw new Error("NO_WALLET");
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: GENLAYER_CHAIN_ID_HEX }] });
  } catch (err: any) {
    if (err?.code === 4902) {
      await provider.request({ method: "wallet_addEthereumChain", params: [GENLAYER_NETWORK] });
      return;
    }
    throw err;
  }
}

export async function requestAccounts(): Promise<string[]> {
  const provider = getProvider();
  if (!provider) throw new Error("NO_WALLET");
  return provider.request({ method: "eth_requestAccounts" });
}

export async function requestAccountPicker(): Promise<string[]> {
  const provider = getProvider();
  if (!provider) throw new Error("NO_WALLET");
  await provider.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
  return provider.request({ method: "eth_accounts" });
}

export async function getNativeBalance(address: string): Promise<bigint | null> {
  try {
    const res = await fetch(GENLAYER_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
    });
    const json = await res.json();
    return typeof json?.result === "string" ? BigInt(json.result) : null;
  } catch {
    return null;
  }
}

/**
 * GenLayer client. With an account, genlayer-js signs writes through
 * window.ethereum (MetaMask); without one it can still read.
 */
export function createGenLayerClient(account?: string | null) {
  const config: any = { chain: studionet, endpoint: GENLAYER_RPC_URL };
  if (account) config.account = account as `0x${string}`;
  return createClient(config);
}

export function shortAddress(address?: string | null, head = 6, tail = 4): string {
  if (!address) return "";
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}
