import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from '@/lib/trpc';
import { MaterialUIProvider } from '@/lib/mui-theme';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SecretShare - Secure Secret Sharing Platform",
  description: "Share secrets securely with time-limited, password-protected links",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <TRPCProvider>
          <MaterialUIProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </MaterialUIProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
