import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AppLockWrapper from "@/components/AppLockWrapper";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLockWrapper>
      <div className="flex print:block">
        <div className="print:hidden">
          <Sidebar />
        </div>

        <main className="md:ml-[245px] w-full max-w-[1500px] print:ml-0">
          {/* 1. STICKY HEADER WRAPPER */}
          <div className="print:hidden sticky top-0 z-40 bg-[#fafafc] px-[14px] pt-[20px] pb-[15px] md:px-[38px] md:pt-[30px] border-b border-[#fbeaf0]">
            <Header />
          </div>

          {/* 2. PAGE CONTENT WRAPPER */}
          <div className="px-[14px] py-[20px] md:px-[38px] md:py-[30px] print:px-0 print:py-0">
            {children}
          </div>
        </main>
      </div>

      {/* BEAUTIFUL ULTRA-MODERN COPYRIGHT BADGE (CO-CREATORS) */}
      <div className="fixed bottom-3 right-3 md:bottom-4 md:right-5 z-50 pointer-events-none select-none print:hidden scale-90 md:scale-100 origin-bottom-right">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 md:px-4 md:py-2 bg-white/60 backdrop-blur-xl border border-white/60 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.06)] text-[10px] md:text-[11px] font-bold text-[#826f79]">
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
