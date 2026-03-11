import { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPost, getAuthor, getRelatedPosts, categories } from "@/data/blog";

export default function BlogPost() {
  const { slug } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith("fr") ? "fr" : "en";

  const post = useMemo(() => getPost(slug, lang), [slug, lang]);
  const author = useMemo(() => (post ? getAuthor(post.author) : null), [post]);
  const related = useMemo(
    () => (post ? getRelatedPosts(slug, post.category, lang) : []),
    [slug, post, lang],
  );

  if (!post) return <Navigate to="/guides" replace />;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <Link
        to="/guides"
        className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        &larr; {t("blog.backToGuides")}
      </Link>

      {/* Header */}
      <div className="mt-6">
        <p className="text-xs font-medium uppercase text-[var(--color-primary)]">
          {(categories.find((c) => c.id === post.category) || {})[lang] ||
            post.category}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-3">
          {author && (
            <img
              src={author.avatar}
              alt={author.name}
              className="h-9 w-9 rounded-full"
            />
          )}
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              {t("blog.by")} {author?.name}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {new Date(post.date).toLocaleDateString(lang, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              &middot; {post.readTime} {t("blog.minRead")}
            </p>
          </div>
        </div>
      </div>

      {/* Cover image */}
      <div className="mt-8 overflow-hidden rounded-xl">
        <img
          src={post.coverImage}
          alt={post.title}
          className="aspect-video w-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="prose-chatdesk mt-10">
        {post.content.split("\n").map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          if (trimmed.startsWith("## "))
            return (
              <h2
                key={i}
                className="mb-3 mt-8 text-xl font-bold text-[var(--color-text-primary)]"
              >
                {trimmed.slice(3)}
              </h2>
            );
          if (trimmed.startsWith("### "))
            return (
              <h3
                key={i}
                className="mb-2 mt-6 text-lg font-semibold text-[var(--color-text-primary)]"
              >
                {trimmed.slice(4)}
              </h3>
            );
          if (trimmed === "---")
            return <hr key={i} className="my-8 border-[var(--color-border)]" />;
          if (trimmed.startsWith("- **"))
            return (
              <li
                key={i}
                className="ml-5 list-disc text-sm leading-relaxed text-[var(--color-text-secondary)]"
                dangerouslySetInnerHTML={{
                  __html: trimmed
                    .slice(2)
                    .replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong class="text-[var(--color-text-primary)]">$1</strong>',
                    ),
                }}
              />
            );
          if (/^\d+\.\s/.test(trimmed))
            return (
              <li
                key={i}
                className="ml-5 list-decimal text-sm leading-relaxed text-[var(--color-text-secondary)]"
                dangerouslySetInnerHTML={{
                  __html: trimmed
                    .replace(/^\d+\.\s/, "")
                    .replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong class="text-[var(--color-text-primary)]">$1</strong>',
                    ),
                }}
              />
            );
          return (
            <p
              key={i}
              className="mb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]"
              dangerouslySetInnerHTML={{
                __html: trimmed.replace(
                  /\*\*(.*?)\*\*/g,
                  '<strong class="text-[var(--color-text-primary)]">$1</strong>',
                ),
              }}
            />
          );
        })}
      </div>

      {/* Author card */}
      {author && (
        <div className="mt-12 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--color-card-shadow)]">
          <div className="flex items-center gap-4">
            <img
              src={author.avatar}
              alt={author.name}
              className="h-14 w-14 rounded-full"
            />
            <div>
              <p className="font-semibold text-[var(--color-text-primary)]">
                {author.name}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {author.bio}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Related posts */}
      {related.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {t("blog.relatedPosts")}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {related.map((rp) => (
              <Link
                key={rp.slug}
                to={`/guides/${rp.slug}`}
                className="group rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--color-card-shadow)] transition-shadow hover:shadow-md"
              >
                <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)]">
                  {rp.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                  {rp.excerpt}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
