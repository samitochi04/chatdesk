import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import SEO from "@/components/SEO";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineCpuChip,
  HiOutlineUserGroup,
  HiOutlineFunnel,
  HiOutlineMegaphone,
  HiOutlineChartBarSquare,
  HiOutlineQrCode,
  HiOutlineCog6Tooth,
  HiOutlineArrowTrendingUp,
  HiOutlineChevronDown,
  HiOutlineCheckCircle,
  HiOutlineStar,
} from "react-icons/hi2";

const featureIcons = {
  whatsapp: HiOutlineChatBubbleLeftRight,
  aiReply: HiOutlineCpuChip,
  crm: HiOutlineUserGroup,
  pipeline: HiOutlineFunnel,
  broadcast: HiOutlineMegaphone,
  analysis: HiOutlineChartBarSquare,
};

const stepIcons = [
  HiOutlineQrCode,
  HiOutlineCog6Tooth,
  HiOutlineArrowTrendingUp,
];

const testimonials = [
  {
    name: "Adama K.",
    role: "CEO, QuickShop Lagos",
    quote:
      "ChatDesk transformed how we handle customer inquiries. Response time went from hours to seconds.",
  },
  {
    name: "Fatima B.",
    role: "Founder, Dakar Fashion",
    quote:
      "The AI auto-reply feature alone saved us 20 hours per week. Our customers love the instant responses.",
  },
  {
    name: "Samuel O.",
    role: "Sales Manager, Accra Electronics",
    quote:
      "The sales pipeline gives us full visibility into our deals. We closed 40% more sales in the first month.",
  },
];

export default function Home() {
  const { t, i18n } = useTranslation();

  const faqItems = t("home.faq.items", { returnObjects: true }) || [];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "ChatDesk",
        url: "https://chatdesk.org",
        logo: "https://chatdesk.org/logo-light.svg",
        description:
          "WhatsApp CRM platform for African businesses — manage conversations, automate replies with AI, track sales pipelines.",
        sameAs: [],
      },
      ...(faqItems.length
        ? [
            {
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <div>
      <SEO
        title="ChatDesk — WhatsApp CRM for African Businesses"
        description="Manage WhatsApp conversations, automate replies with AI, track sales pipelines, and broadcast campaigns — all from one dashboard."
        path="/"
      />
      <Helmet>
        <html lang={i18n.language || "en"} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <HeroSection t={t} />
      <TrustedBySection t={t} />
      <FeaturesSection t={t} />
      <HowItWorksSection t={t} />
      <PricingSection t={t} />
      <TestimonialsSection t={t} />
      <FaqSection t={t} />
      <CtaBanner t={t} />
    </div>
  );
}

/* ─── Hero ─── */
function HeroSection({ t }) {
  return (
    <section className="relative overflow-hidden bg-[var(--color-bg)] px-4 py-20 sm:py-28 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[var(--color-primary-light)] via-transparent to-transparent opacity-50" />
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] sm:text-5xl lg:text-6xl">
          {t("home.hero.title")}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-text-secondary)]">
          {t("home.hero.subtitle")}
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/signup"
            className="rounded-lg bg-[var(--color-primary)] px-8 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            {t("home.hero.cta")}
          </Link>
          <a
            href="#features"
            className="rounded-lg border border-[var(--color-border)] px-8 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            {t("home.hero.secondaryCta")}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── Trusted By ─── */
const countries = [
  { flag: "🇳🇬", name: "Nigeria" },
  { flag: "🇬🇭", name: "Ghana" },
  { flag: "🇸🇳", name: "Senegal" },
  { flag: "🇰🇪", name: "Kenya" },
  { flag: "🇨🇲", name: "Cameroon" },
  { flag: "🇨🇮", name: "Côte d'Ivoire" },
  { flag: "🇿🇦", name: "South Africa" },
  { flag: "🇷🇼", name: "Rwanda" },
];

function TrustedBySection({ t }) {
  return (
    <section className="border-y border-[var(--color-border)] bg-[var(--color-bg-secondary)] py-10">
      <div className="mx-auto max-w-5xl px-4 text-center">
        <p className="mb-8 text-sm font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {t("home.trustedBy.title")}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-10">
          {countries.map((c) => (
            <div key={c.name} className="flex flex-col items-center gap-1.5">
              <span className="text-4xl">{c.flag}</span>
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features ─── */
function FeaturesSection({ t }) {
  const keys = [
    "whatsapp",
    "aiReply",
    "crm",
    "pipeline",
    "broadcast",
    "analysis",
  ];
  return (
    <section id="features" className="bg-[var(--color-bg)] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
            {t("home.features.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--color-text-secondary)]">
            {t("home.features.subtitle")}
          </p>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {keys.map((key) => {
            const Icon = featureIcons[key];
            return (
              <div
                key={key}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--color-card-shadow)] transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary-light)]">
                  <Icon className="h-6 w-6 text-[var(--color-primary)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {t(`home.features.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {t(`home.features.${key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorksSection({ t }) {
  const steps = ["step1", "step2", "step3"];
  return (
    <section className="bg-[var(--color-bg-secondary)] px-4 py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
          {t("home.howItWorks.title")}
        </h2>
        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = stepIcons[i];
            return (
              <div key={step} className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-light)]">
                  <Icon className="h-8 w-8 text-[var(--color-primary)]" />
                </div>
                <div className="mb-2 text-sm font-bold uppercase text-[var(--color-primary)]">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {t(`home.howItWorks.${step}.title`)}
                </h3>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  {t(`home.howItWorks.${step}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Pricing ─── */
function PricingSection({ t }) {
  const plans = ["starter", "growth", "business"];
  return (
    <section id="pricing" className="bg-[var(--color-bg)] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
            {t("home.pricing.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[var(--color-text-secondary)]">
            {t("home.pricing.subtitle")}
          </p>
        </div>
        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const isPopular = plan === "growth";
            return (
              <div
                key={plan}
                className={`relative rounded-xl border p-8 ${
                  isPopular
                    ? "border-[var(--color-primary)] shadow-lg ring-1 ring-[var(--color-primary)]"
                    : "border-[var(--color-border)] shadow-[var(--color-card-shadow)]"
                } bg-[var(--color-surface)]`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary)] px-4 py-1 text-xs font-semibold text-white">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {t(`home.pricing.${plan}.name`)}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {t(`home.pricing.${plan}.description`)}
                </p>
                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-[var(--color-text-primary)]">
                    {t(`home.pricing.${plan}.price`)}
                  </span>
                  <span className="text-[var(--color-text-secondary)]">
                    {t("common.perMonth")}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {(
                    t(`home.pricing.${plan}.features`, {
                      returnObjects: true,
                    }) || []
                  ).map((feat, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
                    >
                      <HiOutlineCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`mt-8 block w-full rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    isPopular
                      ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                      : "border border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                  }`}
                >
                  {t("home.pricing.cta")}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
function TestimonialsSection({ t }) {
  return (
    <section className="bg-[var(--color-bg-secondary)] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
          {t("home.testimonials.title")}
        </h2>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--color-card-shadow)]"
            >
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <HiOutlineStar
                    key={i}
                    className="h-4 w-4 fill-[var(--color-warning)] text-[var(--color-warning)]"
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-4 border-t border-[var(--color-border)] pt-4">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {item.name}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {item.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ ─── */
function FaqSection({ t }) {
  const items = t("home.faq.items", { returnObjects: true }) || [];
  return (
    <section className="bg-[var(--color-bg)] px-4 py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
          {t("home.faq.title")}
        </h2>
        <div className="mt-10 space-y-3">
          {items.map((item, i) => (
            <FaqItem key={i} question={item.question} answer={item.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-[var(--color-text-primary)]"
      >
        {question}
        <HiOutlineChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--color-border)] px-5 py-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {answer}
        </div>
      )}
    </div>
  );
}

/* ─── CTA Banner ─── */
function CtaBanner({ t }) {
  return (
    <section className="bg-[var(--color-primary)] px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          {t("home.ctaBanner.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
          {t("home.ctaBanner.subtitle")}
        </p>
        <Link
          to="/signup"
          className="mt-8 inline-block rounded-lg bg-white px-8 py-3 text-sm font-semibold text-[var(--color-primary)] shadow-md transition-colors hover:bg-gray-100"
        >
          {t("home.ctaBanner.cta")}
        </Link>
      </div>
    </section>
  );
}
