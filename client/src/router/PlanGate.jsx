import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { HiOutlineArrowUpCircle } from "react-icons/hi2";

export default function PlanGate({ plan, children }) {
  const { organization, profile } = useAuth();
  const { t } = useTranslation();

  // super_admin bypasses all plan gates
  if (profile?.role === "super_admin") return children;

  const planOrder = { starter: 0, growth: 1, business: 2 };
  const orgPlan = organization?.plan || "starter";

  if ((planOrder[orgPlan] ?? 0) >= (planOrder[plan] ?? 0)) {
    return children;
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <HiOutlineArrowUpCircle className="h-16 w-16 text-[var(--color-primary)]" />
      <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Upgrade Required
      </h2>
      <p className="max-w-md text-[var(--color-text-secondary)]">
        This feature requires the{" "}
        <span className="font-semibold capitalize text-[var(--color-primary)]">
          {plan}
        </span>{" "}
        plan or higher. Contact your administrator to upgrade.
      </p>
    </div>
  );
}
