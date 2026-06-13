export const runtime = "nodejs";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, err, requireAuth } from "@/lib/api";
import { sanitizeText } from "@/lib/sanitize";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { name: true, email: true, avatar: true } } },
  });
  if (!post) return err("Post not found", 404);

  // Increment views
  await db.blogPost.update({ where: { slug }, data: { views: { increment: 1 } } });

  return ok({ ...post, views: post.views + 1 });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  void user;

  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } });
  if (!post) return err("Post not found", 404);

  const body = await req.json().catch(() => ({}));
  const {
    title, slug: newSlug, excerpt, content, coverImage, category,
    tags, status, seoTitle, seoDesc, ogImage,
  } = body;

  const finalStatus = status === "PUBLISHED" ? "PUBLISHED" : status === "DRAFT" ? "DRAFT" : post.status;
  const setPublishedAt = finalStatus === "PUBLISHED" && !post.publishedAt ? new Date() : post.publishedAt;

  const updated = await db.blogPost.update({
    where: { slug },
    data: {
      ...(title && { title: sanitizeText(title) }),
      ...(newSlug && { slug: sanitizeText(newSlug) }),
      ...(excerpt !== undefined && { excerpt: excerpt ? sanitizeText(excerpt) : null }),
      ...(content && { content: sanitizeText(content) }),
      ...(coverImage !== undefined && { coverImage: coverImage ? sanitizeText(coverImage) : null }),
      ...(category !== undefined && { category: category ? sanitizeText(category) : null }),
      ...(tags !== undefined && { tags: Array.isArray(tags) ? tags.map(sanitizeText) : [] }),
      ...(status !== undefined && { status: finalStatus }),
      publishedAt: setPublishedAt,
      ...(seoTitle !== undefined && { seoTitle: seoTitle ? sanitizeText(seoTitle) : null }),
      ...(seoDesc !== undefined && { seoDesc: seoDesc ? sanitizeText(seoDesc) : null }),
      ...(ogImage !== undefined && { ogImage: ogImage ? sanitizeText(ogImage) : null }),
    },
  });

  return ok(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { user, response } = await requireAuth(req);
  if (response) return response;
  void user;

  const { slug } = await params;
  const post = await db.blogPost.findUnique({ where: { slug } });
  if (!post) return err("Post not found", 404);

  await db.blogPost.delete({ where: { slug } });
  return ok({ message: "Post deleted" });
}
