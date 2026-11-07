import type { Metadata } from "next";
import { Geist_Mono, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/motion/Toast";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jb = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jb-mono", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "TWINS — Trading Intelligence Platform",
  description: "Personal trading intelligence system: Telegram intake, market feeds, decision auditing, and snapshot telemetry.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${jb.variable}`} suppressHydrationWarning>
      <head>
        {/* Applies the saved (or system) theme before first paint so there is no flash. */}
        <script dangerouslySetInnerHTML={{ __html: `try{var q=new URLSearchParams(location.search).get("theme");var t=q||localStorage.getItem("twins-theme");var d=t?t==="dark":true;if(d)document.documentElement.classList.add("dark")}catch(e){}` }} />
      </head>
      <body className="bg-canvas text-slate-900 font-sans">
        <ToastProvider><AppShell>{children}</AppShell></ToastProvider>
      </body>
    </html>
  );
}
