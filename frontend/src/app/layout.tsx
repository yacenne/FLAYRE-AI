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
  openGraph: {
    title: "flayre.ai - AI-Powered Conversation Assistant",
    description: "Get smart response suggestions for any chat conversation",
    url: "https://flayreai.vercel.app",
    siteName: "flayre.ai",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "flayre.ai - AI-Powered Conversation Assistant",
    description: "Get smart response suggestions for any chat conversation",
  },
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
                  var saved = localStorage.getItem('flayre_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-[var(--clay-bg)] text-[var(--clay-text-primary)] min-h-screen font-sans transition-colors duration-200">
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