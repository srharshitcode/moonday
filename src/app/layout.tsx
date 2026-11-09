
import type { Metadata, Viewport } from "next";
import "./globals.css";

// 1. Viewport settings (Controls scaling and theme color on mobile)
export const viewport: Viewport = {
  themeColor: "#a55f78",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // CRITICAL: Prevents the app from zooming in on iOS inputs
};


export const metadata: Metadata = {
  title: "MoonDay Your Cycle, Your Space",
  description: "Complete Menstrual Cycle, Period, and Daily Wellness Tracking",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MoonDay",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased bg-background">{children}</body>
    </html>
  );
}
