import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Logo from "@/components/ui/Logo";
import {
  HiOutlineEnvelope,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

export default function AcceptInvite() {
  const { token } = useParams();
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch invitation details
  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const res = await api.get(`/invite/${token}`);
        setInvitation(res.data);
      } catch (err) {
        setError(
          err.message ||
            t("invite.notFound", "Invitation not found or expired."),
        );
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token, t]);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      await api.post(`/invite/${token}/accept`);
      setSuccess(true);
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err) {
      setError(
        err.message || t("invite.acceptFailed", "Failed to accept invitation."),
      );
    } finally {
      setAccepting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <HiOutlineCheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t("invite.accepted", "Invitation Accepted!")}
          </h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">
            {t(
              "invite.redirecting",
              "You've joined the organization. Redirecting to dashboard...",
            )}
          </p>
        </div>
      </div>
    );
  }

  // Error state (no invitation found)
  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <HiOutlineExclamationTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t("invite.invalid", "Invalid Invitation")}
          </h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">{error}</p>
          <Link
            to="/"
            className="mt-6 inline-block text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            {t("nav.goHome", "Go to Home")}
          </Link>
        </div>
      </div>
    );
  }

  const isExpired =
    invitation?.status !== "pending" ||
    new Date(invitation?.expires_at) < new Date();
  const orgName = invitation?.organizations?.name || "the organization";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo className="h-10 w-auto" />
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
              <HiOutlineEnvelope className="h-7 w-7 text-[var(--color-primary)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              {t("invite.title", "Team Invitation")}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              {t("invite.description", "You've been invited to join")}{" "}
              <strong>{orgName}</strong> {t("invite.asRole", "as")}{" "}
              <strong>{invitation?.role}</strong>.
            </p>
          </div>

          {isExpired ? (
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {t(
                "invite.expired",
                "This invitation has expired or is no longer valid.",
              )}
            </div>
          ) : !user ? (
            <div className="space-y-3">
              <p className="text-center text-sm text-[var(--color-text-secondary)]">
                {t(
                  "invite.signInFirst",
                  "Please sign in or create an account with the invited email to accept.",
                )}
              </p>
              <div className="flex gap-3">
                <Link
                  to={`/signin?redirect=/invite/${token}`}
                  className="flex-1 rounded-lg bg-[var(--color-primary)] py-2.5 text-center text-sm font-medium text-[var(--color-primary-text)] hover:opacity-90"
                >
                  {t("nav.signIn", "Sign In")}
                </Link>
                <Link
                  to={`/signup?redirect=/invite/${token}`}
                  className="flex-1 rounded-lg border border-[var(--color-border)] py-2.5 text-center text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)]"
                >
                  {t("nav.signUp", "Sign Up")}
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}
              <p className="text-center text-sm text-[var(--color-text-secondary)]">
                {t("invite.signedInAs", "Signed in as")}{" "}
                <strong>{user.email}</strong>
              </p>
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full cursor-pointer rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-medium text-[var(--color-primary-text)] hover:opacity-90 disabled:opacity-50"
              >
                {accepting
                  ? t("common.loading", "Loading...")
                  : t("invite.accept", "Accept Invitation")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
