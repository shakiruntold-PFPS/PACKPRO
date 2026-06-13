export const runtime = "nodejs";
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const BASE_URL = process.env.NEXTAUTH_URL || "https://packpro.site";

const STATIC_PAGES = [
  { loc: "/", changefreq: "daily", priority: "1.0" },
  { loc: "/about", changefreq: "monthly", priority: "0.8" },
  { loc: "/services", changefreq: "monthly", priority: "0.8" },
  { loc: "/catalog", changefreq: "weekly", priority: "0.9" },
  { loc: "/contact", changefreq: "monthly", priority: "0.7" },
  { loc: "/blog", changefreq: "daily", priority: "0.8" },
  { loc: "/careers", changefreq: "weekly", priority: "0.7" },
];

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [posts, products, careers] = await Promise.all([
    db.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
    }),
    db.product.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      select: { code: true, updatedAt: true },
    }),
    db.career.findMany({
      where: { status: "OPEN" },
      select: { id: true, createdAt: true },
    }),
  ]);

  const urls: string[] = [];

  // Static pages
  for (const page of STATIC_PAGES) {
    urls.push(`  <url>
    <loc>${escapeXml(BASE_URL + page.loc)}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // Blog posts
  for (const post of posts) {
    urls.push(`  <url>
    <loc>${escapeXml(`${BASE_URL}/blog/${post.slug}`)}</loc>
    <lastmod>${post.updatedAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  // Products
  for (const product of products) {
    urls.push(`  <url>
    <loc>${escapeXml(`${BASE_URL}/catalog/${product.code}`)}</loc>
    <lastmod>${product.updatedAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`);
  }

  // Careers
  for (const career of careers) {
    urls.push(`  <url>
    <loc>${escapeXml(`${BASE_URL}/careers/${career.id}`)}</loc>
    <lastmod>${career.createdAt.toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
