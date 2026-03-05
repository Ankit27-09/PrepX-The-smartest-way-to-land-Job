"use client";
import { Spotlight } from "@/components/ui/spotlight-new";
import { ArrowRight, Check } from "lucide-react";

const benefits = [
  "Unlimited AI mock interviews",
  "Personalized career roadmaps",
  "Resume & cover letter analysis",
  "Real-time performance analytics",
  "24/7 AI coaching support",
  "Industry-specific interview prep",
];

const CTASection = () => {
  return (
    <section id="pricing" className="relative overflow-hidden bg-zinc-950 py-24 md:py-32">
      {/* Gradient divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-500/50 to-transparent" />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Spotlight
          gradientFirst="radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(280, 100%, 85%, .08) 0, hsla(280, 100%, 55%, .02) 50%, hsla(280, 100%, 45%, 0) 80%)"
          gradientSecond="radial-gradient(50% 50% at 50% 50%, hsla(200, 100%, 85%, .06) 0, hsla(200, 100%, 55%, .02) 80%, transparent 100%)"
          gradientThird="radial-gradient(50% 50% at 50% 50%, hsla(280, 100%, 85%, .04) 0, hsla(280, 100%, 45%, .02) 80%, transparent 100%)"
        />

        <div className="relative z-10 rounded-3xl border border-white/10 bg-linear-to-b from-zinc-900/80 to-zinc-950/80 p-8 backdrop-blur-xl md:p-16">
          <div className="mx-auto max-w-3xl text-center">
            <span className="mb-4 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
              Limited Time Offer
            </span>

            <h2 className="mb-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Ready to{" "}
              <span className="text-cyan-400">
                transform
              </span>{" "}
              your career?
            </h2>

            <p className="mb-10 text-base text-zinc-400 md:text-lg">
              Start your journey today with our free plan. No credit card required.
              Upgrade anytime to unlock the full potential of AI-powered interview prep.
            </p>

            {/* Benefits Grid */}
            <div className="mb-10 grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                    <Check className="h-3 w-3 text-cyan-400" />
                  </div>
                  <span className="text-sm text-zinc-300">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400 hover:shadow-cyan-500/40"
              >
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </a>

              <p className="text-sm text-zinc-500">
                No credit card required • Free forever plan available
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
