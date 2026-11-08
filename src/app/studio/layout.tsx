import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { StudioShell } from "./StudioShell";
import "./studio.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap", weight: ["500", "600", "700", "800"] });
export const metadata: Metadata = { title: "TWINS Signal Studio (prototype)" };

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div className={`st ${jakarta.variable}`}><StudioShell>{children}</StudioShell></div>;
}
