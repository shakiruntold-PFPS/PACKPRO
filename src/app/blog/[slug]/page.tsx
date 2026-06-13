import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

const WA_NUM = "919057627625";
const PHONE = "+91 9057627625";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  content: string;
  coverImage?: string | null;
  category?: string | null;
  tags: string[];
  status: string;
  seoTitle?: string | null;
  seoDesc?: string | null;
  ogImage?: string | null;
  publishedAt?: string | null;
  views: number;
  author?: { name: string; email: string; avatar?: string | null } | null;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const base = process.env.NEXTAUTH_URL || "https://packpro.site";
    const res = await fetch(`${base}/api/blog/${slug}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post Not Found | PACKPRO" };
  return {
    title: post.seoTitle || `${post.title} | PACKPRO Blog`,
    description: post.seoDesc || post.excerpt || undefined,
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDesc || post.excerpt || undefined,
      images: post.ogImage ? [post.ogImage] : post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post || post.status !== "PUBLISHED") notFound();

  return (
    <div style={{ background: "#070f1e", minHeight: "100vh", color: "#e8eef8", fontFamily: "system-ui, sans-serif" }}>

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.07)", background: "rgba(7,15,30,0.92)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, color: "#fff" }}>P</div>
            <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: 2, color: "#e8eef8" }}>PACKPRO</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Link href="/catalog" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px" }}>Catalog</Link>
            <Link href="/about" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px" }}>About</Link>
            <Link href="/blog" style={{ color: "#14c7c0", fontSize: 14, textDecoration: "none", padding: "6px 12px", fontWeight: 700 }}>Blog</Link>
            <Link href="/careers" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px" }}>Careers</Link>
            <Link href="/contact" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px" }}>Contact</Link>
            <a href={`https://wa.me/${WA_NUM}`} target="_blank" rel="noreferrer"
              style={{ background: "#0ea5a0", color: "#fff", fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>
              WhatsApp
            </a>
          </div>
        </div>
      </nav>

      {/* ARTICLE */}
      <article style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Back */}
        <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#5d7399", fontSize: 13, textDecoration: "none", marginBottom: 32 }}>
          ← Back to Blog
        </Link>

        {/* Category */}
        {post.category && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ display: "inline-block", background: "rgba(14,165,160,0.15)", border: "1px solid rgba(14,165,160,0.3)", color: "#14c7c0", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12, letterSpacing: 0.5, textTransform: "uppercase" }}>
              {post.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontSize: "clamp(26px, 5vw, 44px)", fontWeight: 900, color: "#e8eef8", lineHeight: 1.2, margin: "0 0 20px" }}>
          {post.title}
        </h1>

        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32, flexWrap: "wrap", fontSize: 13, color: "#5d7399" }}>
          {post.author?.name && (
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", fontWeight: 700 }}>
                {post.author.name[0]}
              </span>
              {post.author.name}
            </span>
          )}
          {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
          <span>{post.views} views</span>
        </div>

        {/* Cover Image */}
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={post.title}
            style={{ width: "100%", height: 400, objectFit: "cover", borderRadius: 16, marginBottom: 40, display: "block" }} />
        )}

        {/* Content */}
        <div
          style={{ fontSize: 16, lineHeight: 1.85, color: "#c4d1e8" }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 12, color: "#5d7399", marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Tags</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {post.tags.map(tag => (
                <span key={tag} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#93a5c4", fontSize: 12, padding: "4px 12px", borderRadius: 20 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Back CTA */}
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <Link href="/blog"
            style={{ color: "#14c7c0", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            ← More Articles
          </Link>
          <a href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent(`Hi, I read your article "${post.title}" and have a question.`)}`}
            target="_blank" rel="noreferrer"
            style={{ background: "#25d366", color: "#fff", fontWeight: 700, padding: "10px 20px", borderRadius: 8, textDecoration: "none", fontSize: 13 }}>
            💬 Ask us on WhatsApp
          </a>
        </div>
      </article>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "#e8eef8", marginBottom: 6 }}>PACKPRO Food Packaging Solutions</div>
          <div style={{ fontSize: 13, color: "#5d7399" }}>Dholidub, Narnaul-Behror Road, Alwar, Rajasthan</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#3d5070" }}>{PHONE} · sales@packpro.site</div>
          <div style={{ marginTop: 16, fontSize: 12, color: "#3d5070" }}>© {new Date().getFullYear()} PACKPRO · All rights reserved</div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP */}
      <a href={`https://wa.me/${WA_NUM}`} target="_blank" rel="noreferrer"
        style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(37,211,102,0.4)", zIndex: 999, textDecoration: "none", fontSize: 26 }}>
        💬
      </a>
    </div>
  );
}
