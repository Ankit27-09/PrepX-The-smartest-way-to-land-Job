"use client";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";
import { Brain, Route, FileText, BookOpen, Search, MonitorPlay } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "AI Course Generation",
    description:
      "Generate customized courses tailored to your goals. Learn via interactive flashcards, dynamic mind maps, and comprehensive AI quizzes.",
    gradient: "from-cyan-500 to-blue-600",
    shadowColor: "shadow-cyan-500/20",
  },
  {
    icon: FileText,
    title: "Smart PDF Chat",
    description:
      "Transform static documents into interactive learning experiences. Chat directly with your PDFs to extract insights and generate instant summaries.",
    gradient: "from-violet-500 to-purple-600",
    shadowColor: "shadow-violet-500/20",
  },
  {
    icon: Route,
    title: "Graph Career Paths",
    description:
      "Visualize your future with an interactive graph-based career roadmap. Receive tailored, step-by-step milestones to land your dream role.",
    gradient: "from-pink-500 to-rose-600",
    shadowColor: "shadow-pink-500/20",
  },
  {
    icon: Search,
    title: "ATS Job Discovery",
    description:
      "Unlock smart job hunting connected directly to company ATS systems. Instantly discover and track relevant job roles matching your customized roadmap.",
    gradient: "from-amber-500 to-orange-600",
    shadowColor: "shadow-amber-500/20",
  },
  {
    icon: MonitorPlay,
    title: "Live AI Tutor",
    description:
      "Connect with a real-time voice and video webRTC agent. Share your code or screen and get instant, multimodal educational assistance.",
    gradient: "from-emerald-500 to-teal-600",
    shadowColor: "shadow-emerald-500/20",
  },
  {
    icon: Brain,
    title: "AI Mock Interviews",
    description:
      "Practice via live video with an intelligent AI interviewer that adapts to your skill level. Get real-time feedback and improvement strategies.",
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
