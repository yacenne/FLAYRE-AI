import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
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
    <html lang="en" className={inter.variable}>
      <head>
        <Script
          src="https://checkout.razorpay.com/v1/checkout.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}