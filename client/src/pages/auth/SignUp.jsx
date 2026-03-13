import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import SEO from "@/components/SEO";
import Logo from "@/components/ui/Logo";
import { HiOutlineEnvelope } from "react-icons/hi2";

export default function SignUp() {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("auth.signUp.passwordMismatch", "Passwords do not match."));
      return;
    }

    if (password.length < 6) {
      setError(
        t(
          "auth.signUp.passwordTooShort",
          "Password must be at least 6 characters.",
        ),
      );
      return;
    }

    setSubmitting(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <SEO
          title="Sign Up — ChatDesk"
          description="Create your free ChatDesk account to start managing WhatsApp conversations with AI-powered automation."
          path="/signup"
        />
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
            <HiOutlineEnvelope className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t("auth.signUp.checkEmail")}
          </h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">{email}</p>
          <Link
            to="/signin"
            className="mt-6 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            {t("auth.signUp.signInLink")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <SEO
        title="Sign Up — ChatDesk"
        description="Create your free ChatDesk account to start managing WhatsApp conversations with AI-powered automation."
        path="/signup"
      />
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo className="h-10 w-auto" />
        </div>
        <h1 className="text-center text-2xl font-bold text-[var(--color-text-primary)]">
          {t("auth.signUp.title")}
        </h1>
        <p className="mt-1 text-center text-[var(--color-text-secondary)]">
          {t("auth.signUp.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              {t("auth.signUp.fullName")}
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              {t("auth.signUp.email")}
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              {t("auth.signUp.password")}
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              {t("auth.signUp.confirmPassword")}
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t("common.loading") : t("auth.signUp.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
          {t("auth.signUp.hasAccount")}{" "}
          <Link
            to="/signin"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            {t("auth.signUp.signInLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
