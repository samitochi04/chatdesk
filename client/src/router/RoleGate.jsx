import { useAuth } from "@/contexts/AuthContext";

export default function RoleGate({ roles, children }) {
  const { profile } = useAuth();
  const userRole = profile?.role;

  if (!userRole || !roles.includes(userRole)) {
    return null;
  }

  return children;
}
