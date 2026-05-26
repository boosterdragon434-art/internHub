import React from 'react';
import { Link } from 'react-router-dom';
import { FiGithub, FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi';

/**
 * Multi-column responsive Footer with brand, navigation links, social icons, and copyright.
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
    <footer className="bg-slate-900 dark:bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-block">
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-accent-400 to-secondary-400 bg-clip-text text-transparent">
                InternHub
              </span>
            </Link>
            <p className="mt-3 text-xs text-slate-400 leading-relaxed max-w-xs">
              Your gateway to professional internships. Browse, apply, and launch your career with confidence.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3 mt-5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all duration-200"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-xs text-slate-400 hover:text-accent-400 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            &copy; {currentYear} InternHub. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-500">
            Built with ❤️ for aspiring professionals.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
