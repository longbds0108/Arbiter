import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./defi.css";
import "./app.css";
import Providers from "./providers";
import Shell from "@/components/Shell";

const interTight = Inter_Tight({
  subsets: ["latin", "latin-ext", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arbiter — AI-judged bounties on GenLayer",
  description:
    "Post a bounty, submit a link to your work, and let an intelligent contract judge it. Validators on GenLayer agree on every verdict.",
  icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={interTight.variable} suppressHydrationWarning>
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
