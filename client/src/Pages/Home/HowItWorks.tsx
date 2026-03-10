"use client";
import { LampContainer } from "@/components/ui/lamp";
import { motion } from "motion/react";

const steps = [
  {
    step: "01",
    title: "1. Career Planning",
    bullets: ["Interactive path mapping", "Live ATS job discovery", "Skill gap analysis"],
    gradient: "from-cyan-500 to-blue-600",
    posClasses: "left-[220px] top-[0px]",
    delay: 0.1,
  },
  {
    step: "02",
    title: "2. Smart Learning",
    bullets: ["AI-generated courses", "Chat with PDFs via RAG", "Dynamic flashcards"],
    gradient: "from-violet-500 to-purple-600",
    posClasses: "left-[0px] top-[129px]",
    delay: 0.2,
  },
  {
    step: "03",
    title: "3. Live AI Tutor",
    bullets: ["Real-time WebRTC room", "Audio & video agents", "Code pairing session"],
    gradient: "from-pink-500 to-rose-600",
    posClasses: "left-[440px] top-[129px]",
    delay: 0.3,
  },
  {
    step: "04",
    title: "4. Mock Interviews",
    bullets: ["Simulated tech rounds", "Deep performance metrics", "Walk in with confidence"],
    gradient: "from-emerald-500 to-teal-600",
    posClasses: "left-[220px] top-[258px]",
    delay: 0.4,
  },
];

const HexagonFeature = ({ step, index, isMobile }: { step: typeof steps[0], index: number, isMobile?: boolean }) => {
  // SVG points for a perfect flat-topped hexagon
  const hexShape = "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)";

  // Creates the interlocking organic cluster look on mobile stacked view
  const mobileOffsets = isMobile && index > 0 ? "-mt-16" : "";
  const mobileTrans = isMobile ? (index % 2 === 0 ? "-translate-x-6" : "translate-x-6") : "";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ delay: step.delay, duration: 0.5, ease: "easeOut" }}
      viewport={{ once: true }}
      className={`
        ${isMobile ? `relative mx-auto ${mobileOffsets} ${mobileTrans}` : `absolute ${step.posClasses}`}
        w-72 h-[250px] bg-linear-to-br ${step.gradient} text-white
        flex flex-col items-center justify-center p-8
        transition-all duration-500 hover:scale-105 hover:z-50 cursor-pointer
        shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]
      `}
      style={{ clipPath: hexShape }}
    >
      <div className="flex flex-col items-center text-center">
        <h3 className="text-[20px] font-extrabold mb-4 leading-tight drop-shadow-md px-2">
          {step.title}
        </h3>
        <div className="flex flex-col items-start space-y-2.5">
          {step.bullets.map((b, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[13.5px] font-bold drop-shadow-sm text-white/95">
              <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-white shrink-0" />
              <span className="text-left leading-snug">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#0a0e1a]">
      <LampContainer>
        <motion.div
          initial={{ opacity: 0.5, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="mx-auto max-w-5xl px-4"
        >
          <div className="mb-16 text-center">
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

      <div className="relative z-10 -mt-52 md:-mt-64 lg:-mt-[340px] mx-auto max-w-7xl px-4 pb-32 flex flex-col items-center justify-center pointer-events-none">
        
        {/* Desktop Hexagon grid -> uses precise absolute coordinate math to interlock them */}
        <div className="relative hidden md:block w-[728px] h-[508px] origin-top scale-[0.75] lg:scale-100 pointer-events-auto">
          {steps.map((step, idx) => (
            <HexagonFeature key={step.step} step={step} index={idx} isMobile={false} />
          ))}
        </div>

        {/* Mobile Stack -> zigzag margins to emulate the interlocking cluster */}
        <div className="flex flex-col items-center md:hidden w-full overflow-hidden pb-10 pointer-events-auto mt-16">
          {steps.map((step, idx) => (
            <HexagonFeature key={step.step} step={step} index={idx} isMobile={true} />
          ))}
        </div>

      </div>
    </section>
  );
};

export default HowItWorks;
