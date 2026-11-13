"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen, LayoutGrid, LogOut, PenLine, Repeat, Trophy, UserRound } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { GENLAYER_CHAIN_NAME, GENLAYER_SYMBOL, getNativeBalance, shortAddress } from "@/lib/genlayer/client";
import { usePlayerPoints, isConfigured } from "@/lib/hooks/useArbiter";
import { Avatar, CopyButton, formatPoints, useErrorText } from "./ui";

function useNav() {
  const { t } = useI18n();
  return [
    { href: "/", label: t("Bounty board", "Bảng bounty"), icon: LayoutGrid },
    { href: "/post", label: t("Post a bounty", "Đăng bounty"), icon: PenLine },
    { href: "/activity", label: t("My activity", "Hoạt động của tôi"), icon: UserRound },
    { href: "/leaderboard", label: t("Leaderboard", "Bảng xếp hạng"), icon: Trophy },
    { href: "/how-it-works", label: t("How it works", "Cách hoạt động"), icon: BookOpen },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/bounty");
  return pathname.startsWith(href);
}

function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="segmented-control segmented-control--small lang" role="group" aria-label={t("Language", "Ngôn ngữ")}>
      {(["en", "vi"] as const).map((l) => (
        <button key={l} type="button" className={lang === l ? "is-selected" : ""} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function NetworkPill() {
  const { t } = useI18n();
  const { hasWallet, address, onGenLayer, switchNetwork } = useWallet();
  if (address && !onGenLayer) {
    return (
      <button type="button" className="status-pill status-pill--warn" onClick={() => switchNetwork().catch(() => {})}>
        <i />
        {t("Switch to GenLayer", "Chuyển sang GenLayer")}
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`status-pill${address ? "" : " status-pill--muted"}`}
      title={t("Add or switch the network in your wallet", "Thêm hoặc chuyển mạng trong ví")}
      onClick={() => hasWallet && switchNetwork().catch(() => {})}
    >
      <i />
      {GENLAYER_CHAIN_NAME}
    </button>
  );
}

function Account() {
  const { t } = useI18n();
  const errorText = useErrorText();
  const { address, isConnecting, isReady, connect, disconnect, switchAccount } = useWallet();
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const points = usePlayerPoints(address);
  const balance = useQuery({
    queryKey: ["balance", address],
    queryFn: () => getNativeBalance(address!),
    enabled: !!address,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!address) {
    return (
      <div className="account">
        <button
          type="button"
          className="ui-button ui-button--primary ui-button--small"
          disabled={!isReady || isConnecting}
          onClick={async () => {
            setErr(null);
            try {
              await connect();
            } catch (e: any) {
              setErr(e?.message === "NO_WALLET" ? "NO_WALLET" : e?.code === 4001 ? "USER_REJECTED" : e?.message ?? "");
              setTimeout(() => setErr(null), 5000);
            }
          }}
        >
          {isConnecting ? t("Connecting…", "Đang kết nối…") : t("Connect wallet", "Kết nối ví")}
        </button>
        {err && <div className="ui-card connect-error" role="alert">{errorText(err)}</div>}
      </div>
    );
  }

  const bal = balance.data != null ? Number(balance.data) / 1e18 : null;
  const balText = bal == null ? "—" : `${bal.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${GENLAYER_SYMBOL}`;

  return (
    <div className="account" ref={ref}>
      <button type="button" className="ui-button ui-button--small" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Avatar address={address} />
        <span className="addr-short tnum">{shortAddress(address)}</span>
      </button>
      {open && (
        <div className="ui-card account-popover" role="dialog" aria-label={t("Account", "Tài khoản")}>
          <div className="sub-who">
            <Avatar address={address} />
            <span className="addr tnum">{address}</span>
            <CopyButton value={address} label={t("Copy address", "Sao chép địa chỉ")} />
          </div>
          <div className="info-panel">
            <p><span>{t("Reputation", "Uy tín")}</span><b className="tnum">{isConfigured ? formatPoints(points.data ?? 0) : "—"}</b></p>
            <p><span>{t("Balance", "Số dư")}</span><b className="tnum">{balText}</b></p>
          </div>
          <div className="row">
            <button type="button" className="ui-button ui-button--small" onClick={() => switchAccount().catch(() => {})}>
              <Repeat size={14} /> {t("Switch", "Đổi ví")}
            </button>
            <button type="button" className="ui-button ui-button--small" onClick={() => { disconnect(); setOpen(false); }}>
              <LogOut size={14} /> {t("Disconnect", "Ngắt kết nối")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const nav = useNav();
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <header className="pages-header">
        <Link className="app-header__left pages-brand" href="/" aria-label={t("Arbiter home", "Trang chủ Arbiter")}>
          <img className="app-logo" src="/logo-mark.svg" alt="" />
          <span className="app-name">Arbiter</span>
        </Link>
        <div className="app-header__right">
          <LangSwitch />
          <NetworkPill />
          <Account />
        </div>
      </header>
      <div className="pages-layout">
        <aside className="pages-sidebar" aria-label={t("Workspace", "Không gian làm việc")}>
          <span className="pages-sidebar__label">{t("WORKSPACE", "KHÔNG GIAN")}</span>
          <nav className="app-nav" aria-label={t("App navigation", "Điều hướng")}>
            {nav.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
                  <Icon />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="pages-main">
          <div className="pages-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
