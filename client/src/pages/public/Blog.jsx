import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPosts, getAuthor, categories } from "@/data/blog";
import SEO from "@/components/SEO";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

export default function Blog() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("fr") ? "fr" : "en";
  const allPosts = useMemo(() => getPosts(lang), [lang]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let result = allPosts;
    if (activeCategory !== "all") {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q),
      );
    }
    return result;
  }, [allPosts, activeCategory, search]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <SEO
        title="Guides & Tips — ChatDesk"
        description="Learn how to grow your business with WhatsApp CRM. Tips on automation, customer engagement, and sales pipeline management."
        path="/guides"
      />
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
          {t("blog.title")}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[var(--color-text-secondary)]">
          {t("blog.subtitle")}
        </p>
      </div>

      {/* Filters */}
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <CategoryPill
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
          >
            {t("blog.categories.all")}
          </CategoryPill>
          {categories.map((cat) => (
            <CategoryPill
              key={cat.id}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat[lang] || cat.en}
            </CategoryPill>
          ))}
        </div>
        <div className="relative">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("common.search")}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-4 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => {
            const author = getAuthor(post.author);
            return (
              <Link
                key={post.slug}
                to={`/guides/${post.slug}`}
                className="group overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--color-card-shadow)] transition-shadow hover:shadow-md"
              >
                <div className="aspect-video overflow-hidden bg-[var(--color-bg-secondary)]">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <p className="text-xs font-medium uppercase text-[var(--color-primary)]">
                    {(categories.find((c) => c.id === post.category) || {})[
                      lang
                    ] || post.category}
                  </p>
                  <h3 className="mt-2 line-clamp-2 text-lg font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    {author && (
                      <img
                        src={author.avatar}
                        alt={author.name}
                        className="h-7 w-7 rounded-full"
                      />
                    )}
                    <div className="text-xs text-[var(--color-text-tertiary)]">
                      {author?.name} &middot; {post.readTime}{" "}
                      {t("blog.minRead")}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-16 text-center text-[var(--color-text-secondary)]">
          {t("common.noResults")}
        </p>
      )}
    </div>
  );
}

function CategoryPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-[var(--color-primary)] text-white"
          : "bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-active)]"
      }`}
    >
      {children}
    </button>
  );
}
