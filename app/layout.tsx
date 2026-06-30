import type { Metadata, Viewport } from "next";
import { Inter, Syne } from "next/font/google";
import "./globals.css";

// ─── Fonts ────────────────────────────────────────────────────────────────────
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

// ─── Site constants ───────────────────────────────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skillrise.in";
const SITE_NAME = "SkillRise Academy";
const SITE_DESCRIPTION =
  "India's #1 AI-powered Learning Platform. Master AI, Data, Cloud, Cybersecurity, Development, and more — with job-ready courses, certificates, and career coaching.";

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Learn Skills That Get You Hired`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "online learning India",
    "AI courses",
    "data analytics course",
    "cloud computing certification",
    "cybersecurity training",
    "full stack development",
    "digital marketing course",
    "SkillRise",
    "LMS India",
    "career bootcamp",
  ],
  authors: [{ name: "SkillRise Academy", url: SITE_URL }],
  creator: "SkillRise Academy",
  publisher: "SkillRise Academy",
  category: "Education",

  // ─── OpenGraph ──────────────────────────────────────────────────────────────
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Learn Skills That Get You Hired`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "SkillRise Academy — India's best AI-powered Learning Platform",
      },
    ],
  },

  // ─── Twitter / X Cards ──────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Learn Skills That Get You Hired`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
    creator: "@SkillRiseIn",
    site: "@SkillRiseIn",
  },

  // ─── Canonical + Robots ─────────────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ─── App icons ───────────────────────────────────────────────────────────────
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },

  // ─── Verification ────────────────────────────────────────────────────────────
  // Add when Search Console is configured:
  // verification: { google: "GOOGLE_VERIFICATION_CODE" },
};

// ─── Viewport ─────────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5A623",
};

// ─── JSON-LD Structured Data ──────────────────────────────────────────────────
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  logo: `${SITE_URL}/og-image.png`,
  sameAs: [
    "https://twitter.com/SkillRiseIn",
    "https://www.linkedin.com/company/skillrise-academy",
  ],
  offers: {
    "@type": "Offer",
    priceCurrency: "INR",
    price: "0",
    description: "Free plan — access 3 complete courses, no credit card required.",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "SkillRise Course Catalog",
    itemListElement: [
      {
        "@type": "Course",
        name: "AI Prompt Engineering Masterclass",
        description: "Master AI prompting techniques for real-world automation and business productivity.",
        provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      },
      {
        "@type": "Course",
        name: "Data Analytics with Excel & Power BI",
        description: "Go from beginner to job-ready data analyst with Excel, Power Query, and Power BI.",
        provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      },
    ],
  },
};

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${syne.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
