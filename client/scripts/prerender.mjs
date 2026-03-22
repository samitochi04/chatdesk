/**
 * Post-build prerender script.
 *
 * For each public route it creates a copy of dist/index.html with the correct
 * <title>, <meta description>, <link canonical>, Open-Graph and Twitter tags
 * already baked into the static HTML. This lets Google (and other crawlers)
 * see the right metadata without executing JavaScript.
 *
 * Run automatically via: npm run build
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist");
const SITE_URL = "https://chatdesk.org";

const template = readFileSync(join(distDir, "index.html"), "utf-8");

// ─── Static public routes ────────────────────────────────────────────────────
const routes = [
  {
    path: "/contact",
    title: "Contact Us - ChatDesk",
    description:
      "Get in touch with the ChatDesk team. We help African businesses succeed with WhatsApp CRM.",
  },
  {
    path: "/guides",
    title: "Guides & Tips - ChatDesk",
    description:
      "Learn how to grow your business with WhatsApp CRM. Tips on automation, customer engagement, and sales pipeline management.",
  },
  {
    path: "/privacy",
    title: "Privacy Policy - ChatDesk",
    description:
      "Learn how ChatDesk collects, uses, and protects your personal data.",
  },
  {
    path: "/terms",
    title: "Terms of Service - ChatDesk",
    description:
      "Read the terms and conditions governing your use of the ChatDesk platform.",
  },
  {
    path: "/signin",
    title: "Sign In - ChatDesk",
    description:
      "Sign in to your ChatDesk dashboard to manage WhatsApp conversations and grow your business.",
  },
  {
    path: "/signup",
    title: "Sign Up - ChatDesk",
    description:
      "Create your free ChatDesk account and start managing WhatsApp conversations with AI-powered tools.",
  },
];

// ─── Blog posts (auto-discovered from source) ───────────────────────────────
function extractField(content, field) {
  // double-quoted
  let m = content.match(new RegExp(`${field}:[\\s\\n]*"([^"]*?)"`));
  if (m) return m[1];
  // single-quoted
  m = content.match(new RegExp(`${field}:[\\s\\n]*'([^']*?)'`));
  if (m) return m[1];
  return null;
}

function scanBlogPosts(lang) {
  const dir = join(__dirname, "..", "src", "data", "blog", "posts", lang);
  try {
    return readdirSync(dir)
      .filter((f) => f.endsWith(".js") || f.endsWith(".mjs"))
      .map((f) => {
        const content = readFileSync(join(dir, f), "utf-8");
        const slug = extractField(content, "slug");
        const title = extractField(content, "title");
        const excerpt = extractField(content, "excerpt");
        return slug && title ? { slug, title, excerpt: excerpt || "" } : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

const seen = new Set(routes.map((r) => r.path));

for (const lang of ["en", "fr"]) {
  for (const post of scanBlogPosts(lang)) {
    const p = `/guides/${post.slug}`;
    if (seen.has(p)) continue;
    seen.add(p);
    routes.push({
      path: p,
      title: `${post.title} — ChatDesk`,
      description: post.excerpt,
    });
  }
}

// ─── HTML helpers ────────────────────────────────────────────────────────────
function esc(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceTag(html, regex, replacement) {
  return regex.test(html) ? html.replace(regex, replacement) : html;
}

function generateHtml(base, route) {
  const url = `${SITE_URL}${route.path}`;
  const t = esc(route.title);
  const d = esc(route.description);
  let html = base;

  html = replaceTag(html, /<title>[^<]*<\/title>/, `<title>${t}</title>`);

  // Canonical — insert if absent
  if (/<link\s[^>]*rel="canonical"/.test(html)) {
    html = replaceTag(
      html,
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
      `<link rel="canonical" href="${url}" />`,
    );
  } else {
    html = html.replace(
      "</head>",
      `<link rel="canonical" href="${url}" />\n</head>`,
    );
  }

  // Meta description
  html = replaceTag(
    html,
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="description" content="${d}" />`,
  );

  // Open Graph
  html = replaceTag(
    html,
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:title" content="${t}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:description" content="${d}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
    `<meta property="og:url" content="${url}" />`,
  );

  // Twitter
  html = replaceTag(
    html,
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:title" content="${t}" />`,
  );
  html = replaceTag(
    html,
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
    `<meta name="twitter:description" content="${d}" />`,
  );

  return html;
}

// ─── Write prerendered files ─────────────────────────────────────────────────
console.log("Prerendering public routes…\n");

for (const route of routes) {
  const html = generateHtml(template, route);
  const outDir = join(distDir, route.path);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "index.html"), html);
  console.log(`  ✓ ${route.path}`);
}

// Homepage — add canonical to the root index.html
let homepageHtml = template;
if (/<link\s[^>]*rel="canonical"/.test(homepageHtml)) {
  homepageHtml = homepageHtml.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
    `<link rel="canonical" href="${SITE_URL}/" />`,
  );
} else {
  homepageHtml = homepageHtml.replace(
    "</head>",
    `<link rel="canonical" href="${SITE_URL}/" />\n</head>`,
  );
}
writeFileSync(join(distDir, "index.html"), homepageHtml);
console.log("  ✓ / (homepage)");

console.log(`\n Prerendered ${routes.length + 1} pages.\n`);
