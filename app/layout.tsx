import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BRAND } from "@/lib/brand";
import { THEME_STORAGE } from "@/lib/chat";
import "katex/dist/katex.min.css";
import "streamdown/styles.css";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfcfe" },
    { media: "(prefers-color-scheme: dark)", color: "#13141c" },
  ],
};

// Set `.dark` before paint (shadcn + Streamdown use the class): a saved choice from the
// theme toggle wins, otherwise follow the OS preference.
const themeScript = `(() => {
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const saved = () => { try { return localStorage.getItem("${THEME_STORAGE}"); } catch { return null; } };
  const apply = () => {
    const theme = saved();
    document.documentElement.classList.toggle("dark", theme ? theme === "dark" : mq.matches);
  };
  apply();
  mq.addEventListener("change", apply);
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-dvh overflow-hidden">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
