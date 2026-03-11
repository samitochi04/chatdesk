import { useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { HiOutlineEnvelope, HiOutlineClock } from "react-icons/hi2";
import { FaXTwitter, FaLinkedinIn, FaFacebookF } from "react-icons/fa6";

export default function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/contact", form);
      toast.success(t("contact.success"));
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      toast.error(t("contact.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] sm:text-4xl">
          {t("contact.title")}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-[var(--color-text-secondary)]">
          {t("contact.subtitle")}
        </p>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-5">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-3">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
              >
                {t("contact.form.name")}
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={update("name")}
                placeholder={t("contact.form.namePlaceholder")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
              >
                {t("contact.form.email")}
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={update("email")}
                placeholder={t("contact.form.emailPlaceholder")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="subject"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              {t("contact.form.subject")}
            </label>
            <input
              id="subject"
              type="text"
              required
              value={form.subject}
              onChange={update("subject")}
              placeholder={t("contact.form.subjectPlaceholder")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              {t("contact.form.message")}
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={form.message}
              onChange={update("message")}
              placeholder={t("contact.form.messagePlaceholder")}
              className="w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {submitting ? t("common.loading") : t("contact.form.submit")}
          </button>
        </form>

        {/* Sidebar info */}
        <aside className="space-y-8 lg:col-span-2">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--color-card-shadow)]">
            <div className="flex items-start gap-3">
              <HiOutlineEnvelope className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {t("contact.form.email")}
                </p>
                <a
                  href="mailto:support@chatdesk.app"
                  className="text-sm text-[var(--color-primary)] hover:underline"
                >
                  {t("contact.info.email")}
                </a>
              </div>
            </div>
            <div className="mt-5 flex items-start gap-3">
              <HiOutlineClock className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t("contact.info.response")}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--color-card-shadow)]">
            <p className="mb-3 text-sm font-medium text-[var(--color-text-primary)]">
              Follow us
            </p>
            <div className="flex gap-3">
              <SocialLink href="#" label="Twitter">
                <FaXTwitter className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="#" label="LinkedIn">
                <FaLinkedinIn className="h-4 w-4" />
              </SocialLink>
              <SocialLink href="#" label="Facebook">
                <FaFacebookF className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SocialLink({ href, label, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
