"use client";
import { WavyBackground } from "@/components/ui/wavy-background";
import { FlipWords } from "@/components/ui/flip-words";
import { ArrowRight, Play } from "lucide-react";

const Hero = () => {
  const words = ["ace interviews", "plan careers", "land dream jobs", "build confidence"];

  return (
    <section id="hero" className="relative min-h-screen">
      <WavyBackground
        className="mx-auto max-w-5xl px-4 pb-20"
        containerClassName="min-h-screen flex items-center"
        colors={["#06b6d4", "#8b5cf6", "#a855f7", "#ec4899", "#22d3ee"]}
        waveWidth={50}
        backgroundFill="black"
        blur={12}
        speed="slow"
        waveOpacity={0.4}
      >
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            <span className="text-sm font-medium text-zinc-300">
              AI-Powered Interview Platform
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="mb-2 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            The smartest way to
          </h1>
          <div className="mb-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            <FlipWords
              words={words}
              duration={3000}
              className="text-cyan-400"
            />
          </div>

          {/* Subtitle */}
          <p className="mb-10 max-w-2xl text-base font-normal text-zinc-400 sm:text-lg md:text-xl">
            PrepX uses cutting-edge AI to simulate real interviews, provide personalized career
            guidance, and help you land your dream role — faster than ever.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400 hover:shadow-cyan-500/40"
            >
              Start Practicing Free
              <ArrowRight className="h-4 w-4" />
            </a>

            <button className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-medium text-zinc-300 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/10">
              <Play className="h-4 w-4 fill-current" />
              Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-8 md:gap-16">
            <div className="text-center">
              <div className="text-2xl font-bold text-white md:text-3xl">50K+</div>
              <div className="text-xs text-zinc-500 md:text-sm">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white md:text-3xl">1M+</div>
              <div className="text-xs text-zinc-500 md:text-sm">Interviews Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white md:text-3xl">95%</div>
              <div className="text-xs text-zinc-500 md:text-sm">Success Rate</div>
            </div>
          </div>
        </div>
      </WavyBackground>
    </section>
  );
};

export default Hero;
