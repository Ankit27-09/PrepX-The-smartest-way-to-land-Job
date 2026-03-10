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
          <p className="mb-10 max-w-2xl text-base font-medium text-white/95 drop-shadow-md sm:text-lg md:text-xl">
            Your unfair advantage in the tech job market. Master live interviews, map complex career paths, and upskill faster with a real-time AI co-pilot.
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

        </div>
      </WavyBackground>
    </section>
  );
};

export default Hero;
