import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi';

/**
 * Premium, modern multi-column responsive Footer.
 * Incorporates technical backdrop, stylized vector branding, circular social glass badges,
 * and elegant responsive alignment across breakpoints.
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
    <footer className="bg-slate-950 border-t border-slate-900 relative overflow-hidden z-10 transition-colors duration-300 py-16">
      {/* Decorative subtle ambient lights */}
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-violet-600/5 dark:bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-indigo-650/5 dark:bg-indigo-650/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16">
          {/* Brand & Social Column */}
          <div className="col-span-2 md:col-span-1 text-left space-y-5">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center border border-white/10 shadow-lg shadow-indigo-600/10">
                <span className="text-white font-black text-xs tracking-tighter">IH</span>
              </div>
              <span className="text-lg font-black tracking-tight text-white group-hover:text-violet-400 transition-colors">
                InternHub
              </span>
            </Link>
            <p className="text-xs text-slate-450 dark:text-slate-400 leading-relaxed max-w-xs font-medium">
              Your gateway to professional internships. Browse tracks, collaborate with advisors, and launch your career with verifiable dynamic credentials.
            </p>
            {/* Elegant Circular Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-violet-500/30 hover:shadow-[0_0_12px_rgba(124,58,237,0.15)] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Nav Link Columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading} className="text-left space-y-4">
              <h4 className="text-[10px] font-black text-slate-300 dark:text-slate-400 uppercase tracking-widest">
                {heading}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-xs text-slate-450 dark:text-slate-450 hover:text-violet-400 dark:hover:text-violet-400 transition-colors duration-250 font-medium block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Thin bottom line separator */}
        <div className="mt-16 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            &copy; {currentYear} InternHub. All rights reserved.
          </p>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            Built with 💜 for aspiring professionals.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
