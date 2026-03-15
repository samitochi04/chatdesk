import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

const CONSENT_KEY = "chatdesk_cookie_consent";

function getStoredConsent() {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeConsent(preferences) {
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({ ...preferences, ts: Date.now() }),
  );
}

export function getCookieConsent() {
  return getStoredConsent();
}

export default function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
  });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = { essential: true, analytics: true };
    storeConsent(consent);
    setVisible(false);
  };

  const handleRejectAll = () => {
    const consent = { essential: true, analytics: false };
    storeConsent(consent);
    setVisible(false);
  };

  const handleSavePreferences = () => {
    storeConsent({ ...preferences, essential: true });
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4">
      <div className="mx-auto max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-xl">🍪</span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {t("cookies.title")}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {t("cookies.description")}{" "}
              <a
                href="/privacy"
                className="text-[var(--color-primary)] hover:underline"
              >
                {t("footer.privacy")}
              </a>
              .
            </p>

            {showDetails && (
              <div className="mt-3 space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    className="accent-[var(--color-primary)]"
                  />
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {t("cookies.essential")}
                  </span>
                  <span className="text-[var(--color-text-tertiary)]">
                    ({t("cookies.alwaysOn")})
                  </span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences((p) => ({
                        ...p,
                        analytics: e.target.checked,
                      }))
                    }
                    className="accent-[var(--color-primary)]"
                  />
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {t("cookies.analytics")}
                  </span>
                </label>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                onClick={handleAcceptAll}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                {t("cookies.acceptAll")}
              </button>
              <button
                onClick={handleRejectAll}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
              >
                {t("cookies.rejectAll")}
              </button>
              {!showDetails ? (
                <button
                  onClick={() => setShowDetails(true)}
                  className="px-2 py-2 text-sm text-[var(--color-text-secondary)] underline transition-colors hover:text-[var(--color-text-primary)]"
                >
                  {t("cookies.customize")}
                </button>
              ) : (
                <button
                  onClick={handleSavePreferences}
                  className="px-2 py-2 text-sm font-medium text-[var(--color-primary)] underline transition-colors hover:text-[var(--color-primary-hover)]"
                >
                  {t("cookies.savePreferences")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
