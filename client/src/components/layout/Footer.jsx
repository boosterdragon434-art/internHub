import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiLinkedin, FiMail, FiArrowUpRight } from 'react-icons/fi';

/**
 * InternHub footer. Same link structure/content as before — only the
 * visual system changed (violet/gold, dark "ink" surface, Space Grotesk
 * wordmark) to match the redesigned pages it now sits underneath.
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Platform: [
      { label: 'Browse Internships', to: '/internships' },
      { label: 'How It Works', to: '/#how-it-works' },
      { label: 'About Us', to: '/about' },
      { label: 'Contact', to: '/contact' },
    ],
    Students: [
      { label: 'Register', to: '/register' },
      { label: 'Sign In', to: '/login' },
      { label: 'My Dashboard', to: '/student/dashboard' },
      { label: 'My Applications', to: '/student/applications' },
    ],
    Legal: [
      { label: 'Privacy Policy', to: '#' },
      { label: 'Terms of Service', to: '#' },
      { label: 'Refund Policy', to: '#' },
    ],
  };

  const socialLinks = [
    { icon: FiGithub, href: '#', label: 'GitHub' },
    { icon: FiTwitter, href: '#', label: 'Twitter' },
    { icon: FiLinkedin, href: '#', label: 'LinkedIn' },
    { icon: FiMail, href: 'mailto:support@internhub.com', label: 'Email' },
  ];

  return (
    <footer className="bg-slate-50 dark:bg-ink-950 border-t border-slate-200 dark:border-ink-800 transition-colors duration-300 py-16 relative overflow-hidden z-10">
      {/* Subtle ambient glow overlays, dark theme only */}
      <div className="hidden dark:block absolute -bottom-24 -right-24 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="hidden dark:block absolute -top-24 -left-24 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand & Social Column */}
          <div className="col-span-2 md:col-span-2 text-left space-y-5">
            <Link to="/" className="flex items-center gap-3 group w-fit">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-md shadow-violet-500/20">
                <span className="text-white font-heading font-bold text-xs tracking-tighter">IH</span>
              </div>
              <span className="text-lg font-heading font-bold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">
                InternHub
              </span>
            </Link>
            <p className="text-[11px] font-mono text-violet-600/70 dark:text-violet-400/70 tracking-wide">
              &gt; building careers, one internship at a time
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs font-semibold">
              Your gateway to professional internships. Browse tracks, collaborate with advisors, and launch your career with verifiable dynamic credentials.
            </p>
            {/* Social Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-violet-600 dark:bg-ink-900 dark:hover:bg-ink-800 dark:border-ink-700 dark:text-slate-400 dark:hover:text-violet-400 hover:border-violet-500/30 shadow-sm transition-all duration-300 hover:-translate-y-0.5"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav Link Columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading} className="text-left space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="group inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors duration-200 font-semibold"
                    >
                      {link.label}
                      <FiArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar credits information */}
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-[10px] text-slate-500 dark:text-slate-500 font-extrabold uppercase tracking-wider">
            &copy; {currentYear} frontierwoxtech. All rights reserved.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 font-mono">
            made for students, by students
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
