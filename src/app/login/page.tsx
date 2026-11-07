"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        setError("Check your email for the confirmation link.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#fff0f3] via-[#fff8fa] to-[#fafafc] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#fbeaf0] p-[40px] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-[60px] h-[60px] rounded-full bg-[#fff0f3] mb-4 shadow-sm border border-[#fbeaf0]">
            <span className="text-[28px]">🌙</span>
          </div>
          <h1 className="text-[32px] font-extrabold text-[#a55f78] tracking-tight mb-2">
            MoonDay
          </h1>
          <p className="text-[14px] text-[#826f79] font-medium">
            Your cycle. Your space. Your story.
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-[13px] font-bold text-[#765f6b] mb-2 pl-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-[#d990a8]" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 border border-[#eadfe4] rounded-[14px] bg-slate-50/50 outline-none focus:bg-white focus:border-[#d990a8] focus:ring-4 focus:ring-[#d990a8]/10 text-[14px] text-ink transition-all placeholder:text-[#b6a5ad]"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-[#765f6b] mb-2 pl-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-[#d990a8]" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 border border-[#eadfe4] rounded-[14px] bg-slate-50/50 outline-none focus:bg-white focus:border-[#d990a8] focus:ring-4 focus:ring-[#d990a8]/10 text-[14px] text-ink transition-all placeholder:text-[#b6a5ad]"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-[#fff0f3] border border-[#f4c2c2] rounded-[12px] text-[13px] font-bold text-[#a55f78] text-center animate-in fade-in zoom-in-95 duration-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-4 mt-2 bg-ink hover:bg-black text-white font-bold rounded-[14px] transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:shadow-md disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-[13px] font-bold text-[#826f79] hover:text-[#a55f78] transition-colors"
          >
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <span className="text-[#a55f78] underline decoration-[#f4c2c2] underline-offset-4">
                  Sign In
                </span>
              </>
            ) : (
              <>
                Need an account?{" "}
                <span className="text-[#a55f78] underline decoration-[#f4c2c2] underline-offset-4">
                  Sign Up
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
