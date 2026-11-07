"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ShieldAlert,
  Lock,
  Download,
  EyeOff,
  Loader2,
  Camera,
  Briefcase,
  Code,
  ExternalLink,
  Moon,
} from "lucide-react";

export default function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Profile State
  const [displayName, setDisplayName] = useState("");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [lutealLength, setLutealLength] = useState(14);

  // Security State
  const [appPin, setAppPin] = useState("");
  const [privateMode, setPrivateMode] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Load profile and current theme preference
  useEffect(() => {
    async function loadProfile() {
      // Check local storage for dark mode preference
      if (typeof window !== "undefined") {
        const theme = localStorage.getItem("theme");
        if (
          theme === "dark" ||
          (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches)
        ) {
          setIsDarkMode(true);
          document.documentElement.classList.add("dark");
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setDisplayName(data.display_name || "");
          setCycleLength(data.cycle_length || 28);
          setPeriodLength(data.period_length || 5);
          setLutealLength(data.luteal_phase_length || 14);
          setAppPin(data.app_lock_pin || "");
          setPrivateMode(data.private_mode_enabled || false);
        }
      }
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  // Handle Dark Mode Toggle
  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage("");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          cycle_length: cycleLength,
          period_length: periodLength,
          luteal_phase_length: lutealLength,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        setMessage("Error saving profile.");
      } else {
        setMessage("Profile & Averages saved successfully ✨");
        setTimeout(() => setMessage(""), 3000);
        router.refresh();
      }
    }
    setSaving(false);
  };

  const handleSetPin = async () => {
    if (appPin.length > 0 && appPin.length < 4) {
      setMessage("⚠️ PIN must be exactly 4 digits.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSaving(true);
    setMessage("");
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from("profiles")
        .update({ app_lock_pin: appPin || null })
        .eq("id", user.id);

      if (error) setMessage("Error saving PIN.");
      else {
        setMessage(appPin ? "PIN Lock enabled 🔒" : "PIN Lock disabled 🔓");
        setTimeout(() => setMessage(""), 3000);
      }
    }
    setSaving(false);
  };

  const togglePrivateMode = async () => {
    const newVal = !privateMode;
    setPrivateMode(newVal);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ private_mode_enabled: newVal })
        .eq("id", user.id);
    }
  };

  const handleExportData = async () => {
    setMessage("Preparing download...");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: logs } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("user_id", user.id);
    const { data: intimacy } = await supabase
      .from("intimacy_entries")
      .select("*")
      .eq("user_id", user.id);
    const { data: notes } = await supabase
      .from("husband_notes")
      .select("*")
      .eq("user_id", user.id);

    const backup = {
      export_date: new Date().toISOString(),
      daily_logs: logs,
      intimacy_entries: intimacy,
      husband_notes: notes,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `moonday_backup_${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage("Backup downloaded securely.");
    setTimeout(() => setMessage(""), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#d990a8]" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 max-w-[1200px] pb-12">
      <div className="mb-[30px]">
        <h2 className="text-[24px] font-bold text-ink mb-1">
          Settings & Privacy
        </h2>
        <p className="text-[13px] text-muted">
          Manage your profile, preferences, and strict data security.
        </p>

        {message && (
          <div className="mt-4 p-3 bg-[#fff0f3] border border-[#f4c2c2] text-[#a55f78] text-[13px] font-bold rounded-lg inline-block">
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* COLUMN 1: Profile & Averages */}
        <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[24px] shadow-sm flex flex-col h-full">
          <h3 className="text-[16px] font-bold text-ink mb-6">
            Profile & Averages
          </h3>

          <div className="space-y-5 flex-1">
            <div>
              <label className="block text-[12px] font-bold text-[#765f6b] mb-1.5">
                Display name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full p-3 border border-[#eadfe4] rounded-[12px] bg-slate-50 outline-none focus:border-[#d990a8] text-[13px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[12px] font-bold text-[#765f6b] mb-1.5">
                  Cycle length (days)
                </label>
                <input
                  type="number"
                  value={cycleLength}
                  onChange={(e) =>
                    setCycleLength(parseInt(e.target.value) || 28)
                  }
                  className="w-full p-3 border border-[#eadfe4] rounded-[12px] bg-slate-50 outline-none focus:border-[#d990a8] text-[13px]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-[#765f6b] mb-1.5">
                  Moonday length (days)
                </label>
                <input
                  type="number"
                  value={periodLength}
                  onChange={(e) =>
                    setPeriodLength(parseInt(e.target.value) || 5)
                  }
                  className="w-full p-3 border border-[#eadfe4] rounded-[12px] bg-slate-50 outline-none focus:border-[#d990a8] text-[13px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#765f6b] mb-1.5">
                Luteal Phase Length (days)
              </label>
              <p className="text-[11px] text-muted mb-2">
                Usually exactly 14 days. Controls ovulation predictions.
              </p>
              <input
                type="number"
                value={lutealLength}
                onChange={(e) =>
                  setLutealLength(parseInt(e.target.value) || 14)
                }
                className="w-full p-3 border border-[#eadfe4] rounded-[12px] bg-slate-50 outline-none focus:border-[#d990a8] text-[13px]"
              />
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-[#fbeaf0]">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="w-full py-3 bg-ink text-white font-bold text-[13px] rounded-[12px] hover:bg-black transition-all shadow-sm"
            >
              {saving ? "Saving..." : "Save Profile Changes"}
            </button>
          </div>
        </div>

        {/* COLUMN 2: Security & Backup */}
        <div className="space-y-6">
          {/* Security Card */}
          <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[24px] shadow-sm">
            <h3 className="text-[16px] font-bold text-[#a55f78] flex items-center gap-2 mb-6">
              <ShieldAlert className="w-5 h-5" /> Security & App Lock
            </h3>

            <div className="space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-[12px] font-bold text-[#765f6b] mb-2">
                  <Lock className="w-3.5 h-3.5" /> 4-Digit PIN Lock
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={appPin}
                    onChange={(e) =>
                      setAppPin(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="e.g. 1234 (Blank to disable)"
                    className="flex-1 p-3 border border-[#eadfe4] rounded-[12px] bg-slate-50 outline-none focus:border-[#d990a8] text-[13px] text-center tracking-widest font-mono"
                  />
                  <button
                    onClick={handleSetPin}
                    disabled={
                      saving || (appPin.length > 0 && appPin.length < 4)
                    }
                    className="px-6 bg-[#d990a8] text-white font-bold text-[13px] rounded-[12px] hover:brightness-95 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set PIN
                  </button>
                </div>
                <p className="text-[11px] text-muted mt-2">
                  If set, this PIN will be required to open MoonDay.
                </p>
              </div>

              {/* Private Mode Toggle */}
              <div className="p-4 border border-[#f4c2c2] bg-[#fff0f3] rounded-[16px] flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-[#841617] flex items-center gap-1.5">
                    <EyeOff className="w-4 h-4" /> Private Mode
                  </h4>
                  <p className="text-[11px] text-[#a55f78] mt-1">
                    Hides intimacy and husband notes
                  </p>
                </div>
                <button
                  onClick={togglePrivateMode}
                  className={`w-12 h-6 rounded-full transition-colors relative ${privateMode ? "bg-[#d990a8]" : "bg-[#eadfe4]"}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${privateMode ? "left-7" : "left-1"}`}
                  ></span>
                </button>
              </div>

              {/* NEW: Dark Mode Toggle */}
              <div className="p-4 border border-slate-200 bg-slate-50 rounded-[16px] flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Moon className="w-4 h-4 text-indigo-500" /> Dark Mode
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gentle on the eyes at night
                  </p>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isDarkMode ? "bg-indigo-500" : "bg-[#eadfe4]"}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? "left-7" : "left-1"}`}
                  ></span>
                </button>
              </div>
            </div>
          </div>

          {/* Backup Card */}
          <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[24px] shadow-sm">
            <h3 className="text-[16px] font-bold text-ink mb-3">
              Data & Backup
            </h3>
            <p className="text-[12px] text-muted mb-5 leading-relaxed">
              Your data is encrypted and completely private. You can download a
              raw JSON backup of your records at any time.
            </p>
            <button
              onClick={handleExportData}
              className="w-full py-3.5 border border-[#eadfe4] bg-slate-50 hover:bg-slate-100 text-ink font-bold text-[13px] rounded-[12px] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-muted" /> Export Raw JSON
            </button>
          </div>
        </div>

        {/* COLUMN 3: Developer Links */}
        <div className="bg-white border border-[#fbeaf0] rounded-[24px] p-[24px] shadow-sm">
          <h3 className="text-[16px] font-bold text-ink mb-3">
            Connect with Developer
          </h3>
          <p className="text-[12px] text-muted mb-5 leading-relaxed">
            Say hello or check out more projects by srharshitcode.
          </p>

          <div className="space-y-3">
            <a
              href="https://instagram.com/sr.harshitcode"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3.5 border border-[#eadfe4] bg-slate-50 hover:bg-[#fff0f3] hover:border-[#d990a8] hover:text-[#a55f78] text-[#66545f] rounded-[12px] transition-all group"
            >
              <div className="flex items-center gap-3 font-bold text-[13px]">
                <Camera className="w-4 h-4" /> Instagram
              </div>
              <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </a>

            <a
              href="https://linkedin.com/in/srharshitcode"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3.5 border border-[#eadfe4] bg-slate-50 hover:bg-[#eff6ff] hover:border-[#93c5fd] hover:text-[#1d4ed8] text-[#66545f] rounded-[12px] transition-all group"
            >
              <div className="flex items-center gap-3 font-bold text-[13px]">
                <Briefcase className="w-4 h-4" /> LinkedIn
              </div>
              <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </a>

            <a
              href="https://github.com/srharshitcode"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3.5 border border-[#eadfe4] bg-slate-50 hover:bg-gray-100 hover:border-gray-400 hover:text-black text-[#66545f] rounded-[12px] transition-all group"
            >
              <div className="flex items-center gap-3 font-bold text-[13px]">
                <Code className="w-4 h-4" /> GitHub
              </div>
              <ExternalLink className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
