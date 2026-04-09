import type { Metadata } from "next";
import { Geist_Mono, Inter, Nunito } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { AppHeader } from "@/components/app-header";
import { AppFooter } from "@/components/app-footer";
import { getSiteUrl } from "@/lib/site-url";
import { Providers } from "./providers";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { GoogleTagManager } from "@next/third-parties/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "Turn daily routines into calm, positive moments — morning and evening flows kids can follow.";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "StarrySteps",
    template: "%s · StarrySteps",
  },
  description: siteDescription,
  applicationName: "StarrySteps",
  keywords: [
    "kids routines",
    "morning routine",
    "bedtime routine",
    "children",
    "family app",
    "StarrySteps",
  ],
  authors: [{ name: "StarrySteps", url: "https://www.starrysteps.com" }],
  creator: "StarrySteps",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "StarrySteps",
    title: "StarrySteps",
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: "StarrySteps",
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${nunito.variable} ${geistMono.variable} h-full antialiased`}
    >
      <GoogleTagManager gtmId="GTM-W2JN8HMV" />
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <ClerkProvider>
          <Providers>
            <AppHeader />
            <main className="relative flex min-h-0 flex-1 flex-col">{children}</main>
            <AppFooter />
          </Providers>
        </ClerkProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
