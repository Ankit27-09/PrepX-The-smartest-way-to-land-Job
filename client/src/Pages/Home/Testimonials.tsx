"use client";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

const testimonials = [
  {
    quote:
      "PrepX completely transformed my interview prep. The AI mock interviews felt like the real thing — I walked into my Google interview confident and prepared. Landed the offer!",
    name: "Sarah Chen",
    title: "Software Engineer at Google",
  },
  {
    quote:
      "The career roadmap feature helped me transition from marketing to product management. It gave me a clear path with actionable steps. I got my PM role within 6 months.",
    name: "Marcus Johnson",
    title: "Product Manager at Stripe",
  },
  {
    quote:
      "After 50+ rejections, I started using PrepX. The resume analysis caught issues I never noticed, and the mock interviews built my confidence. Got 3 offers in 2 weeks!",
    name: "Priya Sharma",
    title: "Data Scientist at Meta",
  },
  {
    quote:
      "The behavioral coaching is incredible. PrepX helped me structure my stories using STAR and practice delivery. My interviewer even complimented my communication.",
    name: "David Kim",
    title: "Engineering Manager at Amazon",
  },
  {
    quote:
      "As a bootcamp grad competing against CS majors, PrepX leveled the playing field. The skill assessments showed me exactly what to study, and the mock interviews were spot-on.",
    name: "Emily Rodriguez",
    title: "Frontend Developer at Vercel",
  },
  {
    quote:
      "PrepX's AI adapts to your level perfectly. Started as a junior and the questions grew more challenging as I improved. It's like having a personal interview coach 24/7.",
    name: "Alex Thompson",
    title: "Senior Developer at Shopify",
  },
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="relative bg-black py-24 md:py-32">
      {/* Gradient divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-violet-500/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <span className="mb-4 inline-block rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-pink-400">
            Testimonials
          </span>
          <h2 className="mb-5 text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            Loved by{" "}
            <span className="bg-linear-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent">
              thousands
            </span>{" "}
            of job seekers
          </h2>
          <p className="text-base text-zinc-400 md:text-lg">
            Join 50,000+ professionals who have transformed their interview performance with PrepX.
          </p>
        </div>

        {/* Testimonial Rows */}
        <div className="flex flex-col gap-4">
          <InfiniteMovingCards
            items={testimonials.slice(0, 3)}
            direction="right"
            speed="slow"
            pauseOnHover
          />
          <InfiniteMovingCards
            items={testimonials.slice(3)}
            direction="left"
            speed="slow"
            pauseOnHover
          />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
