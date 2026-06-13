import Link from "next/link";

export const metadata = {
  title: "Blog & Insights | PACKPRO Food Packaging",
  description: "Industry insights, packaging trends, and company updates from PACKPRO — India's leading food packaging manufacturer.",
};

const PHONE = "+91 9057627625";
const WA_NUM = "919057627625";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  category?: string | null;
  tags: string[];
  publishedAt?: string | null;
  views: number;
  author?: { name: string } | null;
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const base = process.env.NEXTAUTH_URL || "https://packpro.site";
    const res = await fetch(`${base}/api/blog`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  } catch {
    return [];
  }
}

function formatDate(d: string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function BlogPage() {
  const posts = await getPosts();

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
            <Link href="/catalog" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>Catalog</Link>
            <Link href="/about" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>About</Link>
            <Link href="/services" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>Services</Link>
            <Link href="/blog" style={{ color: "#14c7c0", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8, fontWeight: 700 }}>Blog</Link>
            <Link href="/careers" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>Careers</Link>
            <Link href="/contact" style={{ color: "#93a5c4", fontSize: 14, textDecoration: "none", padding: "6px 12px", borderRadius: 8 }}>Contact</Link>
            <a href={`https://wa.me/${WA_NUM}`} target="_blank" rel="noreferrer"
              style={{ background: "#0ea5a0", color: "#fff", fontSize: 13, fontWeight: 700, padding: "8px 16px", borderRadius: 8, textDecoration: "none" }}>
              WhatsApp
            </a>
            <Link href="/login" style={{ color: "#5d7399", fontSize: 12, textDecoration: "none", padding: "6px 10px" }}>Login</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px 60px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(14,165,160,0.12)", border: "1px solid rgba(14,165,160,0.3)", borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700, color: "#14c7c0", letterSpacing: 1, marginBottom: 20 }}>
          INSIGHTS & UPDATES
        </div>
        <h1 style={{ fontSize: "clamp(32px, 6vw, 60px)", fontWeight: 900, lineHeight: 1.1, margin: "0 0 20px", letterSpacing: -1 }}>
          <span style={{ background: "linear-gradient(135deg,#e8eef8,#93a5c4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            The PACKPRO
          </span>
          {" "}
          <span style={{ background: "linear-gradient(135deg,#14c7c0,#0ea5a0)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Blog
          </span>
        </h1>
        <p style={{ fontSize: 18, color: "#93a5c4", maxWidth: 600, margin: "0 auto", lineHeight: 1.7 }}>
          Packaging industry trends, company news, and expert tips for food businesses across India.
        </p>
      </section>

      {/* POSTS GRID */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#5d7399" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#93a5c4", marginBottom: 8 }}>No posts yet</div>
            <div style={{ fontSize: 14 }}>Check back soon for industry insights and company updates.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {posts.map((post) => (
              <article key={post.id} style={{ background: "rgba(15,30,56,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", transition: "border-color 0.2s" }}>
                {/* Cover */}
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: 200, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: 200, background: "linear-gradient(135deg,rgba(14,165,160,0.2),rgba(27,79,138,0.3))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                    📦
                  </div>
                )}
                <div style={{ padding: "20px 24px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {post.category && (
                    <span style={{ display: "inline-block", background: "rgba(14,165,160,0.15)", border: "1px solid rgba(14,165,160,0.3)", color: "#14c7c0", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12, letterSpacing: 0.5, marginBottom: 12, alignSelf: "flex-start", textTransform: "uppercase" }}>
                      {post.category}
                    </span>
                  )}
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#e8eef8", margin: "0 0 10px", lineHeight: 1.4 }}>
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p style={{ fontSize: 13, color: "#93a5c4", lineHeight: 1.7, margin: "0 0 16px", flex: 1 }}>
                      {post.excerpt.length > 150 ? post.excerpt.slice(0, 150) + "…" : post.excerpt}
                    </p>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ fontSize: 12, color: "#5d7399" }}>
                      {post.author?.name && <span>{post.author.name} · </span>}
                      {formatDate(post.publishedAt)}
                    </div>
                    <Link href={`/blog/${post.slug}`} style={{ color: "#14c7c0", fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                      Read more →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

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
      <a href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent("Hi, I'd like to enquire about packaging products.")}`}
        target="_blank" rel="noreferrer"
        style={{ position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%", background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 24px rgba(37,211,102,0.4)", zIndex: 999, textDecoration: "none", fontSize: 26 }}>
        💬
      </a>
    </div>
  );
}
