import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi';

/**
 * High-Contrast Solid Gold, White, and Midnight Navy Responsive Footer.
 * Enforces 100% opaque bases (no transparency on card boxes), dual-theme structures,
 * and high-contrast, perfectly legible text link matrices.
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
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 transition-colors duration-300 py-16 relative overflow-hidden z-10">
      {/* Subtle tech mesh background overlay for dark theme only */}
      <div className="hidden dark:block absolute -bottom-24 -right-24 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="hidden dark:block absolute -top-24 -left-24 w-80 h-80 bg-yellow-600/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16">
          {/* Brand & Social Column */}
          <div className="col-span-2 md:col-span-1 text-left space-y-5">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center border border-white/10 shadow-md">
                <span className="text-slate-950 font-black text-xs tracking-tighter">IH</span>
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white transition-colors duration-350">
                InternHub
              </span>
            </Link>
            <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed max-w-xs font-semibold">
              Your gateway to professional internships. Browse tracks, collaborate with advisors, and launch your career with verifiable dynamic credentials.
            </p>
            {/* Elegant Solid Social Buttons */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-amber-600 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-400 dark:hover:text-amber-400 hover:border-amber-500/20 shadow-sm transition-all duration-300 hover:-translate-y-0.5"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav Link Columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading} className="text-left space-y-4">
              <h4 className="text-[10px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-xs text-slate-600 dark:text-slate-450 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200 font-semibold block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar credits information */}
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-900 text-center">
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider">
            &copy; 2026 frontierwoxtech all rights reserved
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
