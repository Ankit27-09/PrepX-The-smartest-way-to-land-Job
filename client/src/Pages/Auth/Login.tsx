"use client";
import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { Eye, EyeOff, Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { Spotlight } from "@/components/ui/spotlight-new";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { login, googleLogin } from "@/store/auth/authSlice";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const redirectTo = (location.state as { from?: string })?.from || "/courses";

  if (user) return <Navigate to={redirectTo} replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await dispatch(login({ email, password })).unwrap();
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError(null);
      setLoading(true);
      try {
        await dispatch(googleLogin(tokenResponse.access_token)).unwrap();
        navigate(redirectTo);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google sign-in failed. Please try again."),
  });

  return (
    <div className="flex min-h-screen bg-black">
      {/* Left Side — Form */}
      <div className="relative flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        {/* Subtle grid bg */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="mb-10 inline-flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Prep<span className="text-cyan-400">X</span>
            </span>
          </Link>

          {/* Heading */}
          <h1 className="mb-2 text-3xl font-bold text-white">Welcome back!</h1>
          <p className="mb-8 text-sm text-zinc-400">
            Login to PrepX to continue to your dashboard.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Social Login */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all hover:border-white/20 hover:bg-white/10"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
            <button
              type="button"
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-white/5 bg-white/2 px-4 py-3 text-sm font-medium text-zinc-600"
            >
              <svg className="h-5 w-5 fill-zinc-600" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Sign in with Apple
              <span className="text-xs text-zinc-600">(Coming soon)</span>
            </button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Or
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
            />
          </div>

          {/* Password */}
          <div className="mb-2">
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-300">
                Password
              </label>
              <a
                href="#"
                className="text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-11 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400 hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
          </form>

          {/* Sign up link */}
          <p className="mt-6 text-center text-sm text-zinc-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-cyan-400 underline decoration-cyan-400/30 underline-offset-2 transition-colors hover:text-cyan-300 hover:decoration-cyan-300/50"
            >
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side — Promotional Panel */}
      <div className="relative hidden overflow-hidden border-l border-white/5 bg-zinc-950 lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(185, 100%, 65%, .08) 0, hsla(185, 100%, 55%, .02) 50%, hsla(185, 100%, 45%, 0) 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(260, 100%, 85%, .06) 0, hsla(260, 100%, 55%, .02) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(185, 100%, 85%, .04) 0, hsla(185, 100%, 45%, .02) 80%, transparent 100%)"
        />

        {/* Floating grid */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-size-[80px_80px]" />

        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          {/* 3D Cube */}
          <motion.div
            className="mb-12"
            animate={{ rotateY: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ perspective: 800 }}
          >
            <div className="relative h-32 w-32" style={{ transformStyle: "preserve-3d" }}>
              {/* Cube faces */}
              <div className="absolute inset-0 rounded-2xl border border-cyan-500/20 bg-zinc-900/80 backdrop-blur-sm"
                style={{ transform: "translateZ(64px)" }} />
              <div className="absolute inset-0 rounded-2xl border border-cyan-500/10 bg-zinc-900/60"
                style={{ transform: "rotateY(180deg) translateZ(64px)" }} />
              <div className="absolute inset-0 rounded-2xl border border-violet-500/10 bg-zinc-900/60"
                style={{ transform: "rotateY(90deg) translateZ(64px)" }} />
              <div className="absolute inset-0 rounded-2xl border border-violet-500/10 bg-zinc-900/60"
                style={{ transform: "rotateY(-90deg) translateZ(64px)" }} />
              {/* Dots on cube */}
              <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "translateZ(65px)" }}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-2 w-2 rounded-full bg-cyan-400/50" />
                  <div className="h-2 w-2 rounded-full bg-cyan-400/50" />
                  <div className="h-2 w-2 rounded-full bg-cyan-400/50" />
                  <div className="h-2 w-2 rounded-full bg-cyan-400/50" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Orbit ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/6">
            <motion.div
              animate={{ rotateX: 70, rotateZ: 360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="h-48 w-48 rounded-full border border-violet-500/20"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0 w-0 border-x-4 border-t-6 border-x-transparent border-t-violet-400/60" />
            </motion.div>
          </div>

          {/* Stats heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4"
          >
            <h2 className="mb-4 text-3xl font-bold leading-tight text-white xl:text-4xl">
              10K+ users. AI-powered
              <br />
              <span className="text-zinc-400">interview preparation.</span>
            </h2>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-400 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/20"
            >
              Join Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Floating particles */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-1 w-1 rounded-full bg-cyan-400/30"
                style={{
                  left: `${20 + i * 12}%`,
                  top: `${15 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
