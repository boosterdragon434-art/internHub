import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiTarget, FiHeart, FiAward, FiUsers } from 'react-icons/fi';

const AboutPage = () => {
  const values = [
    { icon: FiTarget, title: 'Our Mission', desc: 'To bridge the gap between ambitious students and quality internship opportunities that build real-world skills.' },
    { icon: FiHeart, title: 'Student-First', desc: 'Every feature we build starts with one question: does this make the student experience better?' },
    { icon: FiAward, title: 'Quality Focus', desc: 'We curate internships carefully to ensure each opportunity provides genuine learning and growth.' },
    { icon: FiUsers, title: 'Community', desc: 'We\'re building a community of future professionals who support and inspire each other.' },
  ];

  return (
    <>
      <Helmet>
        <title>About Us — InternHub</title>
        <meta name="description" content="Learn about InternHub's mission to connect students with quality internship opportunities." />
      </Helmet>

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-accent-950 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-extrabold">
            About InternHub
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 text-base text-slate-300 max-w-2xl mx-auto">
            We're on a mission to make professional internships accessible to every student. Our platform simplifies the entire journey — from discovery to joining.
          </motion.p>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white dark:bg-slate-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((val, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-8"
              >
                <div className="p-3 bg-accent-50 dark:bg-accent-950/20 rounded-xl w-fit text-accent-600 dark:text-accent-400 mb-4">
                  <val.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{val.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{val.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="bg-slate-50 dark:bg-slate-950 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Our Story</h2>
          <p className="mt-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            InternHub was born from a simple observation: talented students everywhere struggle to find quality internship opportunities. The process of searching, applying, and managing the joining workflow is fragmented and frustrating. We set out to build a platform that makes the entire internship lifecycle seamless — from browsing curated opportunities to secure payment processing and automated communication. Today, InternHub serves hundreds of students and growing, and we're just getting started.
          </p>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
