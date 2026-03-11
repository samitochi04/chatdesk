import { useTranslation } from "react-i18next";

export default function SignUp() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {t("auth.signUp.title")}
        </h1>
        <p className="mt-1 text-[var(--color-text-secondary)]">
          {t("auth.signUp.subtitle")}
        </p>
      </div>
    </div>
  );
}
