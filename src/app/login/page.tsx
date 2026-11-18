"use client";

import React, { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  User,
  Wand2,
  KeyRound,
  CheckCircle2,
  Heart,
} from "lucide-react";

/**
 * Custom Geometric Crescent Moon & Star Vector Emblem
 */


const MoonDayCrest = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      width="40"
      height="40"
      rx="12"
      fill="#FFF0F3"
      stroke="#F4C2C2"
      strokeWidth="1.2"
    />
    <path
      d="M24.2 11.2C19.1 11.9 15.3 16.2 15.3 21.5C15.3 27.3 20.0 32.0 25.8 32.0C27.7 32.0 29.4 31.4 30.9 30.5C28.8 32.9 25.7 34.3 22.2 34.3C15.8 34.3 10.6 29.1 10.6 22.7C10.6 16.5 15.5 11.4 21.7 11.0C22.6 11.0 23.4 11.0 24.2 11.2Z"
      fill="#D990A8"
      stroke="#A55F78"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="27.2" cy="14.8" r="2.2" fill="#A55F78" />
  </svg>
);


const INNER_SEASONS = [
  {
    season: "Inner Winter",
    phase: "Menstrual Phase",
    desc: "Restorative warmth, iron-rich nourishment & deep intuition.",
  },

  {
    season: "Inner Spring",
    phase: "Follicular Phase",
    desc: "Rising estradiol, fresh creativity & renewed stamina.",
  },

  {
    season: "Inner Summer",
    phase: "Ovulatory Window",
    desc: "Peak radiance, expressive confidence & connection.",
  },

  {
    season: "Inner Autumn",
    phase: "Luteal Phase",
    desc: "Grounded nesting, boundaries & gentle self-compassion.",
  },

];

type AuthMode = "signin" | "signup" | "magic" | "reset";


export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);


  const supabase = createClient();
  const router = useRouter();


  const passwordStrength =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : password.length < 10
          ? 2
          : 3;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    try {
      if (mode === "signup") {
        const cleanName = displayName.trim() || email.split("@")[0];
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: cleanName,
              display_name: cleanName,
            },
          },
        });
        if (error) throw error;


        if (data.user && data.session) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            display_name: cleanName,
            cycle_length: 28,
            period_length: 5,
            luteal_phase_length: 14,
            updated_at: new Date().toISOString(),
          });
          router.push("/");
          router.refresh();
          return;
        }

        setFeedback({
          type: "success",
          text: "Welcome to MoonDay! Please check your inbox to confirm your sanctuary account.",
        });

      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        router.push("/");
        router.refresh();
      } else if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },

        });
        if (error) throw error;
        setFeedback({
          type: "success",
          text: "Instant sign-in link sent! Check your email inbox to enter your space.",
        });

      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        );

        if (error) throw error;
        setFeedback({
          type: "success",
          text: "Password recovery instructions have been sent to your email.",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err?.message || "Unable to complete request. Please try again.",
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F8] text-ink flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-[1060px] bg-white border border-line rounded-[32px] shadow-[0_20px_60px_-20px_rgba(165,95,120,0.16)] overflow-hidden grid grid-cols-1 lg:grid-cols-12 animate-in fade-in duration-300">
       
        {/* LEFT 6 COLUMNS: EDITORIAL SANCTUARY STORYTELLING */}

        <div className="lg:col-span-6 bg-[#fff8fa] border-b lg:border-b-0 lg:border-r border-[#f4c2c2]/60 p-7 sm:p-10 md:p-12 flex flex-col justify-between">
          <div>

            {/* Brand Header */}

            <div className="flex items-center justify-between gap-3 mb-8">
              <div className="flex items-center gap-3">
                <MoonDayCrest className="w-10 h-10 shrink-0" />
                <div>
                  <span className="text-[22px] font-extrabold tracking-tight text-[#a55f78] block leading-none">
                    MoonDay
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted block mt-1">
                    Private Cycle & Literary Sanctuary
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#f4c2c2] text-[10.5px] font-bold text-[#a55f78]">
                <Heart className="w-3 h-3 fill-[#d990a8] text-[#d990a8]" />
                <span>For Women & Girls</span>
              </span>
            </div>

            {/* Literary Headline */}

            <div className="mb-8">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#a55f78] mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-[#d990a8]" />
                <span>Honor Your Four Inner Seasons</span>
              </div>
              <h1
                style={{
                  fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
                }}
                className="text-[28px] sm:text-[34px] font-bold text-ink tracking-tight leading-[1.2] mb-3"
              >
                Your body moves in rhythms, not straight lines.
              </h1>
              <p className="text-[13.5px] text-muted leading-relaxed">
                A calm, private space to track your menstrual cycle, understand
                your hormonal waves, and pen your deepest reflections on luxury
                stationery.
              </p>
            </div>

            {/* 4 Inner Seasons Editorial Grid */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
              {INNER_SEASONS.map((item) => (
                <div
                  key={item.season}
                  className="p-3.5 rounded-2xl bg-white border border-line/90 shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#a55f78]">
                      {item.season}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#d990a8]" />
                  </div>
                  <div className="text-[13px] font-extrabold text-ink mb-0.5">
                    {item.phase}
                  </div>
                  <p className="text-[11.5px] text-muted leading-snug">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Strict Privacy Footnote */}

          <div className="p-4 rounded-2xl bg-white border border-[#f4c2c2]/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#fff0f3] border border-[#f4c2c2] flex items-center justify-center text-[#a55f78] shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[12px] font-extrabold text-ink">
                Uncompromising Privacy & Encryption
              </div>
              <p className="text-[11.5px] text-muted leading-relaxed mt-0.5">
                Protected by 4-digit PIN lock, instant{" "}
                <span className="font-bold text-ink">Ctrl+Shift+X</span> screen
                blur, and offline-first sync. Your intimate health records are
                yours alone.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT 6 COLUMNS: AUTHENTICATION & ACCOUNT STUDIO */}

        <div className="lg:col-span-6 p-7 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-[400px] mx-auto w-full">

            {/* Primary Segmented Switcher (Sign In vs Create Account) */}
            
            <div className="grid grid-cols-2 p-1 bg-[#fcf9fa] border border-line rounded-2xl mb-7">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setFeedback(null);
                }}
                className={`py-2.5 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer ${
                  mode === "signin" || mode === "magic" || mode === "reset"
                    ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2] shadow-2xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setFeedback(null);
                }}
                className={`py-2.5 rounded-xl text-[13px] font-extrabold transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-[#fff0f3] text-[#a55f78] border border-[#f4c2c2] shadow-2xs"
                    : "text-muted hover:text-ink"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Mode Heading */}

            <div className="mb-6">
              <h2
                style={{
                  fontFamily: "'Georgia', 'Cambria', 'Times New Roman', serif",
                }}
                className="text-[24px] sm:text-[26px] font-bold text-ink tracking-tight"
              >
                {mode === "signup"
                  ? "Begin your sanctuary"
                  : mode === "magic"
                    ? "Passwordless magic link"
                    : mode === "reset"
                      ? "Restore your access"
                      : "Welcome back, beautiful"}
              </h2>
              <p className="text-[12.5px] text-muted mt-1">
                {mode === "signup"
                  ? "Create your private cycle & journaling account in seconds."
                  : mode === "magic"
                    ? "We will send a one-click sign-in link straight to your inbox."
                    : mode === "reset"
                      ? "Enter your email to receive a secure password reset link."
                      : "Enter your credentials to open your personal space."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">

              {/* Preferred Name (Only in Sign Up mode) */}

              {mode === "signup" && (
                <div>
                  <label className="block text-[12px] font-bold text-ink mb-1.5">
                    What should we call you?
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-[#d990a8]" />
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your first name or nickname"
                      className="w-full pl-10 pr-4 py-3 border border-line rounded-xl bg-[#fcf9fa] outline-none focus:bg-white focus:border-[#d990a8] text-[13.5px] text-ink transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}

              <div>
                <label className="block text-[12px] font-bold text-ink mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-[#d990a8]" />
                  </div>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-line rounded-xl bg-[#fcf9fa] outline-none focus:bg-white focus:border-[#d990a8] text-[13.5px] text-ink transition-all"
                  />
                </div>
              </div>

              {/* Password Input (Hidden in Magic Link / Reset modes) */}

              {(mode === "signin" || mode === "signup") && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[12px] font-bold text-ink">
                      Password
                    </label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode("reset");
                          setFeedback(null);
                        }}
                        className="text-[11.5px] font-bold text-[#a55f78] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}

                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-[#d990a8]" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      autoComplete={
                        mode === "signup" ? "new-password" : "current-password"
                      }
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === "signup" ? "At least 6 characters" : "••••••••"
                      }
                      className="w-full pl-10 pr-11 py-3 border border-line rounded-xl bg-[#fcf9fa] outline-none focus:bg-white focus:border-[#d990a8] text-[13.5px] text-ink transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-ink cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>


                  {/* Subtle Password Strength Bar on Sign Up */}


                  {mode === "signup" && password.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 flex gap-1 h-1.5">
                        {[1, 2, 3].map((step) => (
                          <div
                            key={step}
                            className={`flex-1 rounded-full transition-all ${
                              passwordStrength >= step
                                ? "bg-[#a55f78]"
                                : "bg-line"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10.5px] font-bold text-muted">
                        {passwordStrength === 1
                          ? "Weak"
                          : passwordStrength === 2
                            ? "Good"
                            : "Strong"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Status Feedback Banner */}


              {feedback && (
                <div
                  className={`p-3.5 rounded-xl border text-[12.5px] font-bold flex items-start gap-2.5 animate-in fade-in duration-200 ${
                    feedback.type === "success"
                      ? "bg-[#fff0f3] border-[#f4c2c2] text-[#a55f78]"
                      : "bg-[#fff0f3] border-[#f4c2c2] text-[#841617]"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#a55f78]" />
                  <span>{feedback.text}</span>
                </div>
              )}


              {/* Primary Submit Button */}


              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-[#d990a8] hover:brightness-95 text-white font-extrabold text-[13.5px] rounded-xl transition-all shadow-[0_8px_22px_-6px_rgba(217,144,168,0.7)] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>
                      {mode === "signup"
                        ? "Create My Sanctuary"
                        : mode === "magic"
                          ? "Send Magic Sign-In Link"
                          : mode === "reset"
                            ? "Send Recovery Link"
                            : "Enter My Space"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Alternative Sign-In Methods */}


            <div className="mt-6 pt-5 border-t border-line flex flex-wrap items-center justify-between gap-2 text-[12px]">
              {mode !== "magic" ? (
                <button
                  type="button"
                  onClick={() => {
                    setMode("magic");
                    setFeedback(null);
                  }}
                  className="inline-flex items-center gap-1.5 font-bold text-muted hover:text-[#a55f78] transition-colors cursor-pointer"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#d990a8]" />
                  <span>Sign in with Magic Link instead</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setFeedback(null);
                  }}
                  className="inline-flex items-center gap-1.5 font-bold text-muted hover:text-[#a55f78] transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#d990a8]" />
                  <span>Use password instead</span>
                </button>
              )}



              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signup" ? "signin" : "signup");
                  setFeedback(null);
                }}
                className="font-extrabold text-[#a55f78] hover:underline cursor-pointer"
              >
                {mode === "signup" ? "Sign In →" : "New here? Join →"}

              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
