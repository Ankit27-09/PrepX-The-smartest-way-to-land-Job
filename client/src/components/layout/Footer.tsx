
const footerLinks = {
  Product: [
    { label: "AI Mock Interviews", href: "#" },
    { label: "Career Roadmaps", href: "#" },
    { label: "Resume Analysis", href: "#" },
    { label: "Skill Assessments", href: "#" },
    { label: "Pricing", href: "#pricing" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Resources: [
    { label: "Interview Guides", href: "#" },
    { label: "Career Blog", href: "#" },
    { label: "Community", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "API Docs", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
};

const Footer = () => {
  return (
    <footer className="relative border-t border-white/10 bg-black">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500">
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Prep<span className="text-cyan-400">X</span>
              </span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-zinc-500">
              AI-powered interview preparation and career guidance platform. Practice smarter, land faster.
            </p>

            {/* Social Links */}
            <div className="mt-5 flex gap-3">
              {["X", "In", "GH"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-xs font-bold text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold text-white">{category}</h4>
              <ul className="flex flex-col gap-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-sm text-zinc-600">
            &copy; {new Date().getFullYear()} PrepX. All rights reserved.
          </p>
          <p className="text-sm text-zinc-600">
            Built with AI for career success.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
