import Link from "next/link";

type FooterLink = {
  label: string;
  href: string;
};

type FooterSection = {
  title: string;
  links: FooterLink[];
};

const footerSections: FooterSection[] = [
    {
      title: "Product",
      links: [
        { label: "How it Works", href: "/" },
        { label: "Markets", href: "/markets" },
        { label: "Create a Market", href: "/dashboard/create" },
      ],
    },
    {
      title: "Terms of Use",
      links: [

        { label: "Privacy Policy", href: "/privacy-policy" },
        { label: "Terms & Condition", href: "/terms" },
        { label: "Learn", href: "/learn" },
      ],
    },
  ];

const socials: FooterLink[] = [
  { label: "X", href: "https://x.com/flowwager" },
  { label: "Discord", href: "https://discord.gg/DA3xrUrADa" }
];

export const Footer = () => {
  return (
    <footer className=" text-white w-full px-4 sm:px-8 lg:px-16 py-12 mt-8 flex flex-col gap-10">
      {/* Logo & Description */}
      <div className="flex flex-col sm:flex-row gap-8 sm:gap-12">
        <div className="flex flex-col gap-4 max-w-md">
          <Link href="/" className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#9b87f5] via-[#8b5cf6] to-[#7c3aed] rounded-2xl flex items-center justify-center transform rotate-12">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#0A0C14] rounded-lg transform -rotate-12 flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-br from-[#9b87f5] to-[#8b5cf6] rounded-full"></div>
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-[#a78bfa] to-[#9b87f5] rounded-full animate-pulse"></div>
            </div>
            <div className="sm:text-3xl text-xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-[#9b87f5] via-[#8b5cf6] to-[#a78bfa] bg-clip-text text-transparent">
                Flow
              </span>
              <span className="text-white">Wager</span>
            </div>
          </Link>
          <p className="text-gray-300 text-sm leading-relaxed">
            FlowWager is a decentralized prediction market platform empowering
            users to predict on events, from sports and politics to
            crypto price movements.
          </p>
        </div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 gap-8 flex-1 items-end">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-gray-100 text-base mb-4">
                {section.title}
              </h3>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-[#9b87f5] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Socials & Copyright */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-gray-800 pt-6">
        <div className="flex flex-wrap gap-6">
          {socials.map((social) => (
            <Link
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-[#9b87f5] text-sm transition-colors duration-200"
            >
              {social.label}
            </Link>
          ))}
        </div>
        <div className="text-gray-400 text-xs">
          © {new Date().getFullYear()} FlowWager. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
