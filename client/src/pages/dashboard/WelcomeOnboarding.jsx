import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  HiOutlineBuildingOffice2,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

export default function WelcomeOnboarding() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    businessName: "",
    phone: "",
    businessType: "",
    country: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post("/auth/onboarding", form);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const firstName = profile?.full_name?.split(" ")[0] || "";

  if (submitted) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <HiOutlineCheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t("onboarding.thankYou", "Thank you!")}
          </h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            {t(
              "onboarding.submittedMessage",
              "We've received your information. Our team will set up your organization and contact you shortly.",
            )}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
            <HiOutlineBuildingOffice2 className="h-8 w-8 text-[var(--color-primary)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t("onboarding.welcome", "Welcome to ChatDesk")}
            {firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            {t(
              "onboarding.setupMessage",
              "Your account is being set up. Please share your business details so we can configure everything for you.",
            )}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
        >
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="businessName"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              {t("onboarding.businessName", "Business Name")} *
            </label>
            <input
              id="businessName"
              name="businessName"
              type="text"
              required
              value={form.businessName}
              onChange={handleChange}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              {t("onboarding.phone", "Phone Number")}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="businessType"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              {t("onboarding.businessType", "Type of Business")}
            </label>
            <select
              id="businessType"
              name="businessType"
              value={form.businessType}
              onChange={handleChange}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              <option value="">
                {t("onboarding.selectType", "Select type...")}
              </option>
              <option value="retail">
                {t("onboarding.types.retail", "Retail / E-commerce")}
              </option>
              <option value="services">
                {t("onboarding.types.services", "Services")}
              </option>
              <option value="food">
                {t("onboarding.types.food", "Food & Restaurant")}
              </option>
              <option value="health">
                {t("onboarding.types.health", "Health & Wellness")}
              </option>
              <option value="education">
                {t("onboarding.types.education", "Education")}
              </option>
              <option value="real_estate">
                {t("onboarding.types.realEstate", "Real Estate")}
              </option>
              <option value="logistics">
                {t("onboarding.types.logistics", "Logistics & Delivery")}
              </option>
              <option value="other">
                {t("onboarding.types.other", "Other")}
              </option>
            </select>
          </div>

          <div>
            <label
              htmlFor="country"
              className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]"
            >
              {t("onboarding.country", "Country")}
            </label>
            <input
              id="country"
              name="country"
              type="text"
              value={form.country}
              onChange={handleChange}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? t("common.loading")
              : t("onboarding.submit", "Submit Information")}
          </button>
        </form>
      </div>
    </div>
  );
}
