import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://skillrise.in";

// Static routes
const staticRoutes: MetadataRoute.Sitemap = [
  {
    url: SITE_URL,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 1.0,
  },
  {
    url: `${SITE_URL}/#courses`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    url: `${SITE_URL}/#pricing`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.8,
  },
];

// Course slugs for individual course pages (when dynamic routes exist)
const COURSE_SLUGS = [
  "ai-prompt-engineering",
  "ai-agents-langchain",
  "workflow-automation",
  "chatgpt-business",
  "no-code-ai-apps",
  "data-analytics-excel-power-bi",
  "python-data-science",
  "sql-business-intelligence",
  "data-visualization",
  "business-analytics",
  "aws-cloud-practitioner",
  "azure-fundamentals",
  "google-cloud-engineer",
  "devops-docker-kubernetes",
  "linux-server-admin",
  "cybersecurity-fundamentals",
  "ethical-hacking",
  "network-security",
  "digital-forensics",
  "cloud-security",
  "full-stack-web-dev",
  "nextjs-nodejs",
  "mobile-app-flutter",
  "wordpress-freelancing",
  "ui-ux-figma",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const courseRoutes: MetadataRoute.Sitemap = COURSE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/courses/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...courseRoutes];
}
