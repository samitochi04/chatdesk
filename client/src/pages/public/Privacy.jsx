import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";

export default function Privacy() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <SEO
        title="Privacy Policy — ChatDesk"
        description="Learn how ChatDesk collects, uses, and protects your personal data."
        path="/privacy"
      />
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
        {t("privacy.title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
        {t("privacy.lastUpdated")}
      </p>

      <div className="mt-8 space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            1. {t("privacy.sections.intro.title")}
          </h2>
          <p>{t("privacy.sections.intro.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            2. {t("privacy.sections.dataCollected.title")}
          </h2>
          <p>{t("privacy.sections.dataCollected.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            3. {t("privacy.sections.usage.title")}
          </h2>
          <p>{t("privacy.sections.usage.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            4. {t("privacy.sections.cookies.title")}
          </h2>
          <p>{t("privacy.sections.cookies.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            5. {t("privacy.sections.sharing.title")}
          </h2>
          <p>{t("privacy.sections.sharing.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            6. {t("privacy.sections.security.title")}
          </h2>
          <p>{t("privacy.sections.security.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            7. {t("privacy.sections.rights.title")}
          </h2>
          <p>{t("privacy.sections.rights.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            8. {t("privacy.sections.contact.title")}
          </h2>
          <p>{t("privacy.sections.contact.body")}</p>
        </section>
      </div>
    </div>
  );
}
