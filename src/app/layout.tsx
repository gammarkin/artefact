import type { Metadata } from "next";
import { TRPCProvider } from "@/trpc/client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tasks",
  description: "Simple task manager built with Next.js, tRPC and in-memory storage",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Browser extensions (ColorZilla, Dark Reader, Grammarly...) add attributes to
  // <html> and <body> before React hydrates, which triggers a false hydration
  // warning. It only silences those two elements; their children are still checked.
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
