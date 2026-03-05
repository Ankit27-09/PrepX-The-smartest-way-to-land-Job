"use client";
import { LampContainer } from "@/components/ui/lamp";
import { Meteors } from "@/components/ui/meteors";
import { motion } from "motion/react";
import { UserPlus, Mic, BarChart3, Rocket } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Create Your Profile",
    description:
      "Sign up and tell us about your target role, industry, and experience level. Our AI customizes everything just for you.",
    color: "cyan",
  },
  {
    step: "02",
    icon: Mic,
    title: "Practice Interviews",
    description:
      "Engage in realistic AI-powered mock interviews tailored to your industry. Get questioned on technical and behavioral topics.",
    color: "violet",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Get Detailed Feedback",
    description:
      "Receive comprehensive analysis of your performance including answer quality, communication skills, and confidence metrics.",
    color: "pink",
  },
  {
    step: "04",
    icon: Rocket,
    title: "Land Your Dream Job",
    description:
      "Walk into real interviews with confidence. Track your progress, iterate on feedback, and crush your next opportunity.",
    color: "amber",
  },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
  },
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-400",
  },
  pink: {
    bg: "bg-pink-500/10",
    text: "text-pink-400",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
  },
};

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#0a0e1a]">
      <LampContainer>
        <motion.div
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.3,
            duration: 0.8,
            ease: "easeInOut",
          }}
          className="mx-auto max-w-5xl px-4"
        >
          <div className="mb-16 text-center">
            <span className="mb-4 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
              How It Works
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              From zero to interview hero
              <br />
              <span className="text-cyan-400">
                in 4 simple steps
              </span>
            </h2>
          </div>
        </motion.div>
      </LampContainer>

      {/* Steps Grid - below the lamp */}
      <div className="relative -mt-20 mx-auto max-w-6xl px-4 pb-24 md:pb-32 overflow-hidden">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const colors = colorMap[step.color];
            return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                viewport={{ once: true }}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-xl transition-all hover:border-white/20"
              >
                {/* Step number */}
                <span className={`text-5xl font-black ${colors.text} opacity-20`}>
                  {step.step}
                </span>

                {/* Icon */}
                <div className={`mt-2 mb-4 inline-flex rounded-xl ${colors.bg} p-3`}>
                  <step.icon className={`h-6 w-6 ${colors.text}`} />
                </div>

                {/* Content */}
                <h3 className="relative z-10 mb-2 text-lg font-bold text-white">{step.title}</h3>
                <p className="relative z-10 text-sm leading-relaxed text-zinc-400">{step.description}</p>

                {/* Meteor effect */}
                <Meteors number={20} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
