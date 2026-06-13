export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, created, requireAuth } from "@/lib/api";
import { sanitizeText } from "@/lib/sanitize";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isAdmin = searchParams.get("admin") === "true";

  if (isAdmin) {
    const { user, response } = await requireAuth(req);
    if (response) return response;
    void user;
    const posts = await db.blogPost.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, email: true } } },
    });
    return ok(posts);
  }

  const category = searchParams.get("category");
  const tag = searchParams.get("tag");
  const search = searchParams.get("search");

  const where: Record<string, unknown> = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (tag) where.tags = { has: tag };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
    ];
  }

  const posts = await db.blogPost.findMany({
    where,
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: {
      id: true, slug: true, title: true, excerpt: true, coverImage: true,
      category: true, tags: true, publishedAt: true, views: true, createdAt: true,
      author: { select: { name: true } },
    },
  });
  return ok(posts);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth(req);
  if (response) return response;

  const body = await req.json().catch(() => ({}));
  const {
    title, slug, excerpt, content, coverImage, category,
    tags, status, seoTitle, seoDesc, ogImage,
  } = body;

  if (!title || !content) return err("title and content are required");

  const finalSlug = sanitizeText(slug || slugify(title));
  const finalStatus = status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  const post = await db.blogPost.create({
    data: {
      title: sanitizeText(title),
      slug: finalSlug,
      excerpt: excerpt ? sanitizeText(excerpt) : null,
      content: sanitizeText(content),
      coverImage: coverImage ? sanitizeText(coverImage) : null,
      category: category ? sanitizeText(category) : null,
      tags: Array.isArray(tags) ? tags.map(sanitizeText) : [],
      status: finalStatus,
      seoTitle: seoTitle ? sanitizeText(seoTitle) : null,
      seoDesc: seoDesc ? sanitizeText(seoDesc) : null,
      ogImage: ogImage ? sanitizeText(ogImage) : null,
      authorId: user.id,
      publishedAt: finalStatus === "PUBLISHED" ? new Date() : null,
    },
  });

  return created(post);
}
