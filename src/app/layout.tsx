import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/ds/toast";
import { Shell } from "@/ds/shell/Shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jb-mono", display: "swap" });
export const metadata: Metadata = { title: { default: "TWINS", template: "%s · TWINS" }, description: "Private trading-intelligence platform for NSE: research, decisions, risk and paper execution. Live trading is disabled." };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("twins-theme")==="light")document.documentElement.classList.add("light")}catch(e){}` }} /></head>
      <body className="bg-bg font-sans text-fg antialiased"><ToastProvider><Shell>{children}</Shell></ToastProvider></body>
    </html>
  );
}
