import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <SEO
        title="Terms of Service — ChatDesk"
        description="Read the terms and conditions governing your use of the ChatDesk platform."
        path="/terms"
      />
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
        {t("terms.title")}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
        {t("terms.lastUpdated")}
      </p>

      <div className="mt-8 space-y-8 text-[var(--color-text-secondary)] leading-relaxed">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            1. {t("terms.sections.acceptance.title")}
          </h2>
          <p>{t("terms.sections.acceptance.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            2. {t("terms.sections.services.title")}
          </h2>
          <p>{t("terms.sections.services.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            3. {t("terms.sections.accounts.title")}
          </h2>
          <p>{t("terms.sections.accounts.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            4. {t("terms.sections.acceptable.title")}
          </h2>
          <p>{t("terms.sections.acceptable.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            5. {t("terms.sections.payment.title")}
          </h2>
          <p>{t("terms.sections.payment.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            6. {t("terms.sections.ip.title")}
          </h2>
          <p>{t("terms.sections.ip.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            7. {t("terms.sections.termination.title")}
          </h2>
          <p>{t("terms.sections.termination.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            8. {t("terms.sections.liability.title")}
          </h2>
          <p>{t("terms.sections.liability.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            9. {t("terms.sections.changes.title")}
          </h2>
          <p>{t("terms.sections.changes.body")}</p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            10. {t("terms.sections.contact.title")}
          </h2>
          <p>{t("terms.sections.contact.body")}</p>
        </section>
      </div>
    </div>
  );
}
