import { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { hasSupabaseConfig, supabase } from "@/lib/supabase";

export default function Index() {
  const [dest, setDest] = useState<string | null>(null);

  const resolveDestination = async (hasSession: boolean) => {
    if (!hasSession) {
      setDest("/welcome");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDest("/welcome");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      setDest("/welcome");
      return;
    }

    const onboardingComplete = profile?.onboarding_complete ?? false;
    setDest(onboardingComplete ? "/(app)/(tabs)" : "/onboarding/editorial");
  };

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      resolveDestination(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      resolveDestination(!!session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!hasSupabaseConfig) return null;
  if (!dest) return null;
  return <Redirect href={dest as any} />;
}
