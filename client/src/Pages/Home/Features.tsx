"use client";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { Brain, Route, FileText, Target, MessageSquare, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Mock Interviews",
    description:
      "Practice with our intelligent AI interviewer that adapts to your skill level, industry, and role. Get real-time feedback on your answers, body language tips, and improvement strategies.",
    gradient: "from-cyan-500 to-blue-600",
    shadowColor: "shadow-cyan-500/20",
  },
  {
    icon: Route,
    title: "Career Roadmaps",
    description:
      "Get a personalized career path with step-by-step milestones, skill requirements, and timeline estimates. Powered by real industry data and hiring trends.",
    gradient: "from-violet-500 to-purple-600",
    shadowColor: "shadow-violet-500/20",
  },
  {
    icon: FileText,
    title: "Resume Analysis",
    description:
      "Upload your resume and get instant AI-powered feedback. Identify weak points, optimize for ATS systems, and tailor your resume for specific job postings.",
    gradient: "from-pink-500 to-rose-600",
    shadowColor: "shadow-pink-500/20",
  },
  {
    icon: Target,
    title: "Skill Assessment",
    description:
      "Evaluate your technical and soft skills with comprehensive assessments. Get a detailed score breakdown and personalized improvement plan.",
    gradient: "from-amber-500 to-orange-600",
    shadowColor: "shadow-amber-500/20",
  },
  {
    icon: MessageSquare,
    title: "Behavioral Coaching",
    description:
      "Master the STAR method and craft compelling stories for behavioral interviews. Our AI analyzes your responses and suggests powerful improvements.",
    gradient: "from-emerald-500 to-teal-600",
    shadowColor: "shadow-emerald-500/20",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Monitor your interview performance over time with detailed analytics. Track confidence levels, response quality, and areas for improvement.",
    gradient: "from-blue-500 to-indigo-600",
    shadowColor: "shadow-blue-500/20",
  },
];

const Features = () => {
  return (
    <section id="features" className="relative bg-black py-24 md:py-32">
      {/* Gradient divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-500/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center md:mb-20">
          <span className="mb-4 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Features
          </span>
          <h2 className="mb-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Everything you need to{" "}
            <span className="text-cyan-400">
              succeed
            </span>
          </h2>
          <p className="text-base text-zinc-400 md:text-lg">
            From mock interviews to career planning, PrepX gives you an unfair advantage
            in your job search journey.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <CardContainer key={feature.title} containerClassName="py-0">
              <CardBody className="group/card relative h-full w-full rounded-2xl border border-white/8 bg-zinc-950 p-6 transition-all hover:border-white/15 hover:bg-zinc-900/50 md:p-8">
                {/* Icon */}
                <CardItem translateZ={50} className="mb-5">
                  <div
                    className={`inline-flex rounded-xl bg-linear-to-br ${feature.gradient} p-3 shadow-lg ${feature.shadowColor}`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                </CardItem>

                {/* Title */}
                <CardItem
                  translateZ={40}
                  className="mb-3 text-xl font-bold text-white"
                >
                  {feature.title}
                </CardItem>

                {/* Description */}
                <CardItem
                  translateZ={30}
                  className="text-sm leading-relaxed text-zinc-400"
                >
                  {feature.description}
                </CardItem>

                {/* Learn more link */}
                <CardItem translateZ={20} className="mt-6">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-400 transition-colors group-hover/card:text-cyan-300">
                    Learn more
                    <svg
                      className="h-4 w-4 transition-transform group-hover/card:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </CardItem>
              </CardBody>
            </CardContainer>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
