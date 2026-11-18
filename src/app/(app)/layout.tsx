import React from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import AppLockWrapper from "@/components/AppLockWrapper";
import AppNavigationShell from "@/components/AppNavigationShell";
import { createClient } from "@/utils/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = "there";

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    displayName =
      profile?.display_name?.trim() ||
      user.user_metadata?.display_name ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "there";
  }

  return (
    <AppLockWrapper>
      <AppNavigationShell userName={displayName}>{children}</AppNavigationShell>

      {/* BEAUTIFUL ULTRA-MODERN COPYRIGHT BADGE (CO-CREATORS) */}
      
      <div className="fixed bottom-20 right-3 md:bottom-4 md:right-5 z-50 pointer-events-none select-none print:hidden scale-90 md:scale-100 origin-bottom-right">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 md:px-4 md:py-2 bg-white/75 backdrop-blur-xl border border-[#f4c2c2]/60 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-[10px] md:text-[11px] font-bold text-[#826f79]">
          <span className="flex items-center justify-center w-[18px] h-[18px] md:w-[22px] md:h-[22px] rounded-full bg-gradient-to-tr from-[#d990a8] to-[#f4c2c2] text-white text-[10px] md:text-[12px] leading-none shadow-sm">
            ©
          </span>
          <span className="tracking-wide flex items-center">
            Built by{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a55f78] to-[#d990a8] text-[11px] md:text-[12px] ml-1">
              srharshitcode
            </span>
            <span className="mx-1.5 opacity-50">&</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d990a8] to-[#a55f78] text-[11px] md:text-[12px] lowercase">
              porcupine
            </span>
          </span>
        </div>
      </div>

      {/* VERCEL TRACKING COMPONENTS */}

      <Analytics />
      <SpeedInsights />
    </AppLockWrapper>
  );
}
