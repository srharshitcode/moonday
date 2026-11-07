"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Lock } from "lucide-react";

export default function AppLockWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [correctPin, setCorrectPin] = useState<string | null>(null);
  const [pinInput, setPinInput] = useState("");
  const [error, setError] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function checkLock() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("app_lock_pin")
          .eq("id", user.id)
          .single();
        if (data?.app_lock_pin) {
          setCorrectPin(data.app_lock_pin);

          // Check if already unlocked in this session
          if (sessionStorage.getItem("moonday_unlocked") !== "true") {
            setIsLocked(true);
          }
        }
      }
      setLoading(false);
    }
    checkLock();
  }, []);
const handlePinSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Convert database value to string for safe comparison
  if (pinInput === String(correctPin)) {
    setIsLocked(false);
    sessionStorage.setItem("moonday_unlocked", "true");
  } else {
    setError(true);
    setPinInput("");
    setTimeout(() => setError(false), 2000);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted text-[13px]">
        Checking security...
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#fff8fa] flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-[#fbeaf0] max-w-[320px] w-full text-center">
          <div className="w-[50px] h-[50px] bg-[#fff0f3] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-[#a55f78]" />
          </div>
          <h2 className="text-[20px] font-bold text-ink mb-1">App Locked</h2>
          <p className="text-[12px] text-muted mb-6">
            Enter your 4-digit PIN to access MoonDay.
          </p>

          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              className={`w-full text-center tracking-[1em] text-[24px] font-bold p-3 border rounded-[12px] outline-none mb-4 transition-all ${
                error
                  ? "border-red-500 bg-red-50"
                  : "border-[#eadfe4] bg-slate-50 focus:border-[#d990a8]"
              }`}
              autoFocus
            />
            <button
              type="submit"
              disabled={pinInput.length !== 4}
              className="w-full py-3 bg-[#a55f78] text-white font-bold text-[13px] rounded-[11px] disabled:opacity-50 hover:bg-[#8f5268] transition-all"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
