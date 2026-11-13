"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getAccounts,
  getChainId,
  getProvider,
  isGenLayerChain,
  requestAccountPicker,
  requestAccounts,
  switchToGenLayer,
} from "./client";

// Remember an explicit disconnect so a refresh doesn't silently reconnect.
const DISCONNECT_FLAG = "arbiter.wallet-disconnected";

export interface WalletState {
  address: string | null;
  chainId: string | null;
  hasWallet: boolean;
  isConnecting: boolean;
  isReady: boolean;
  onGenLayer: boolean;
}

interface WalletContextValue extends WalletState {
  connect: () => Promise<string | null>;
  disconnect: () => void;
  switchAccount: () => Promise<void>;
  switchNetwork: () => Promise<void>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

function readFlag(): boolean {
  try {
    return localStorage.getItem(DISCONNECT_FLAG) === "true";
  } catch {
    return false;
  }
}

function writeFlag(on: boolean) {
  try {
    if (on) localStorage.setItem(DISCONNECT_FLAG, "true");
    else localStorage.removeItem(DISCONNECT_FLAG);
  } catch {
    /* ignore */
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    hasWallet: false,
    isConnecting: false,
    isReady: false,
    onGenLayer: false,
  });

  useEffect(() => {
    const provider = getProvider();
    if (!provider) {
      setState((s) => ({ ...s, isReady: true }));
      return;
    }

    (async () => {
      const chainId = await getChainId();
      const accounts = readFlag() ? [] : await getAccounts();
      setState({
        address: accounts[0] ?? null,
        chainId,
        hasWallet: true,
        isConnecting: false,
        isReady: true,
        onGenLayer: isGenLayerChain(chainId),
      });
    })();

    const onAccounts = (accounts: string[]) => {
      if (accounts.length > 0) writeFlag(false);
      setState((s) => ({ ...s, address: readFlag() ? null : accounts[0] ?? null }));
    };
    const onChain = (chainId: string) => {
      setState((s) => ({ ...s, chainId, onGenLayer: isGenLayerChain(chainId) }));
    };
    provider.on("accountsChanged", onAccounts);
    provider.on("chainChanged", onChain);
    return () => {
      provider.removeListener("accountsChanged", onAccounts);
      provider.removeListener("chainChanged", onChain);
    };
  }, []);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isConnecting: true }));
    try {
      const accounts = await requestAccounts();
      let chainId = await getChainId();
      if (!isGenLayerChain(chainId)) {
        await switchToGenLayer();
        chainId = await getChainId();
      }
      writeFlag(false);
      setState((s) => ({
        ...s,
        address: accounts[0] ?? null,
        chainId,
        isConnecting: false,
        onGenLayer: isGenLayerChain(chainId),
      }));
      return accounts[0] ?? null;
    } catch (err) {
      setState((s) => ({ ...s, isConnecting: false }));
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    writeFlag(true);
    setState((s) => ({ ...s, address: null }));
  }, []);

  const switchAccount = useCallback(async () => {
    const accounts = await requestAccountPicker();
    writeFlag(false);
    setState((s) => ({ ...s, address: accounts[0] ?? null }));
  }, []);

  const switchNetwork = useCallback(async () => {
    await switchToGenLayer();
    const chainId = await getChainId();
    setState((s) => ({ ...s, chainId, onGenLayer: isGenLayerChain(chainId) }));
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, switchAccount, switchNetwork }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
