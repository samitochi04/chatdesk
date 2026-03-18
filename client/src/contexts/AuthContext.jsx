import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    try {
      const { data: prof, error: profError } = await supabase
        .from("profiles")
        .select("*, organizations!organization_id(*)")
        .eq("id", userId)
        .single();

      if (profError) {
        console.error("[AuthContext] Profile fetch error:", profError);
      }

      if (prof) {
        console.log("[AuthContext] Profile loaded:", {
          id: prof.id,
          role: prof.role,
          organization_id: prof.organization_id,
          hasOrg: !!prof.organizations,
          orgPlan: prof.organizations?.subscription_plan,
        });
        setProfile(prof);
        const org = prof.organizations;
        setOrganization(org ? { ...org, plan: org.subscription_plan } : null);
      } else {
        console.warn("[AuthContext] No profile found for user:", userId);
      }
    } catch (err) {
      console.error("[AuthContext] fetchProfile exception:", err);
      setProfile(null);
      setOrganization(null);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const sessionUser = session?.user ?? null;
      // Reject unconfirmed users
      if (sessionUser && !sessionUser.email_confirmed_at) {
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(sessionUser);
      if (sessionUser) {
        await fetchProfile(sessionUser.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      if (sessionUser && !sessionUser.email_confirmed_at) {
        supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setOrganization(null);
        setLoading(false);
        return;
      }
      setUser(sessionUser);
      if (sessionUser) {
        fetchProfile(sessionUser.id);
      } else {
        setProfile(null);
        setOrganization(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, organization, loading, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
