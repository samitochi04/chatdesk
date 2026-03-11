import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/ui/Logo";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/dashboard/settings` },
    );

    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    toast.success(t("auth.forgotPassword.success"));
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo className="h-10 w-auto" />
        </div>
        <h1 className="text-center text-2xl font-bold text-[var(--color-text-primary)]">
          {t("auth.forgotPassword.title")}
        </h1>
        <p className="mt-1 text-center text-[var(--color-text-secondary)]">
          {t("auth.forgotPassword.subtitle")}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              {t("auth.forgotPassword.email")}
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t("common.loading") : t("auth.forgotPassword.submit")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm">
          <Link
            to="/signin"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            {t("auth.forgotPassword.backToSignIn")}
          </Link>
        </p>
      </div>
    </div>
  );
}
