"use client";
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/auth/authSlice";

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    await dispatch(logout());
    setProfileOpen(false);
    setMobileMenuOpen(false);
    navigate("/");
  };

  const navLinks = [
    { label: "Features", href: "/#features" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Courses", href: "/courses", isRoute: true },
    { label: "PDF Chat", href: "/pdf-chat", isRoute: true },
    { label: "Career Path", href: "/career-path", isRoute: true },
    { label: "Jobs", href: "/jobs", isRoute: true },
    { label: "AI Tutor", href: "/ai-tutor", isRoute: true },
    { label: "Interview", href: "/interviews", isRoute: true },
  ];

  /** Render the user's avatar or a fallback initial circle. */
  const Avatar = ({ size = "h-9 w-9" }: { size?: string }) => (
    user?.avatar ? (
      <img
        src={user.avatar}
        alt={user.name}
        className={`${size} rounded-full object-cover ring-2 ring-cyan-500/40`}
        referrerPolicy="no-referrer"
      />
    ) : (
      <div
        className={`${size} flex items-center justify-center rounded-full bg-cyan-500 text-sm font-bold uppercase text-white ring-2 ring-cyan-500/40`}
      >
        {user?.name?.charAt(0) ?? "U"}
      </div>
    )
  );

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              
              <span className="text-xl font-bold tracking-tight text-white">
                Prep<span className="text-cyan-400">X</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden items-center gap-4 lg:flex xl:gap-6">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                  >
                    {link.label}
                  </a>
                )
              )}
            </div>

            {/* Desktop CTA / User menu */}
            <div className="hidden items-center gap-3 lg:flex">
              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 rounded-full p-0.5 transition-all hover:ring-2 hover:ring-cyan-500/30"
                  >
                    <Avatar />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-white/10 bg-zinc-900 p-1.5 shadow-2xl">
                      {/* User info */}
                      <div className="border-b border-white/10 px-3 py-2.5">
                        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                        <p className="truncate text-xs text-zinc-400">{user.email}</p>
                      </div>
                      {/* Links */}
                      <Link
                        to="/courses"
                        onClick={() => setProfileOpen(false)}
                        className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <User className="h-4 w-4" />
                        My Courses
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="rounded-lg bg-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400 hover:shadow-cyan-500/40"
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-72 flex-col border-r border-white/10 bg-zinc-950 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar header */}
        <div className="flex h-16 min-h-[4rem] items-center justify-between border-b border-white/10 px-5">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
            <span className="text-xl font-bold tracking-tight text-white">
              Prep<span className="text-cyan-400">X</span>
            </span>
          </Link>
          <button
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar links */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              )
            )}
          </div>
        </div>

        {/* Sidebar footer — auth */}
        <div className="border-t border-white/10 px-3 py-4 mt-auto">
          {user ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                <Avatar size="h-10 w-10" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-zinc-400">{user.email}</p>
                </div>
              </div>
              <div className="h-px w-full bg-white/10 my-1 px-3"></div>
              
              <Link
                to="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                <User className="h-4 w-4" />
                My Courses
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-cyan-500 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-cyan-400"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started Free
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;
