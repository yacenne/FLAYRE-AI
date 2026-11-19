import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/Toast";

const fontSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "flayre.ai - AI-Powered Conversation Assistant",
  description: "Never know what to say? flayre.ai analyzes your chat conversations and suggests smart, contextual responses. Works with WhatsApp, Instagram, Discord and more.",
  keywords: ["AI", "conversation assistant", "chat helper", "response suggestions", "WhatsApp", "Instagram", "Discord"],
  authors: [{ name: "flayre.ai" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fontSans.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Purge any stale dark mode flag so UI is always crisp white
                  localStorage.removeItem('flayre_theme');
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-white text-slate-900 min-h-screen font-sans">
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
