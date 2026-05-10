import { useEffect, useState } from "react";
import { Redirect } from "expo-router";

import { hasSupabaseConfig, supabase } from "@/lib/supabase";
import { clearLegacyDailyFlags } from "@/src/hooks/useDailyFlag";

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
      .select("onboarding_complete, timezone")
      .eq("id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      setDest("/welcome");
      return;
    }

    // Fire-and-forget: keep profiles.timezone in sync with the device.
    // The streak engine reads this to decide what "today" means for the
    // user; mismatched TZ shifts day boundaries.
    const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (deviceTz && profile?.timezone !== deviceTz) {
      void supabase
        .from("profiles")
        .update({ timezone: deviceTz })
        .eq("id", user.id);
    }

    const onboardingComplete = profile?.onboarding_complete ?? false;
    setDest(onboardingComplete ? "/(app)/(tabs)" : "/onboarding/editorial");
  };

  useEffect(() => {
    if (!hasSupabaseConfig) {
      return;
    }

    // One-shot cleanup: legacy `dailyFlag:<name>:<ymd>` keys (unscoped
    // by user_id) bleed through to fresh accounts on the same device.
    // Sweep them now; the new scoped keys are inert to this filter.
    void clearLegacyDailyFlags();

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
