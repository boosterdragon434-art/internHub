import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { FiSearch, FiFileText, FiCreditCard, FiCheckCircle, FiArrowRight, FiChevronDown, FiChevronUp, FiBriefcase } from 'react-icons/fi';
import { getInternshipsList } from '../../api/internshipApi';
import { formatDisplayAmount } from '../../utils/formatters';

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const HomePage = () => {
  const [featuredInternships, setFeaturedInternships] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await getInternshipsList({ limit: 6, status: 'active' });
        if (res.success) setFeaturedInternships(res.data);
      } catch (err) {
        console.error('Error fetching featured internships:', err);
      }
    };
    fetchFeatured();
  }, []);

  const howItWorks = [
    { icon: FiSearch, title: 'Browse', desc: 'Explore a wide range of curated internship opportunities across multiple domains.' },
    { icon: FiFileText, title: 'Apply', desc: 'Submit your application with resume upload — our streamlined process takes minutes.' },
    { icon: FiCreditCard, title: 'Pay Fees', desc: 'Securely pay any joining fees through Razorpay (UPI, cards, net banking).' },
    { icon: FiCheckCircle, title: 'Get Joined', desc: 'Receive your joining confirmation, start the internship, and build your career.' },
  ];

  const faqs = [
    { q: 'How do I apply for an internship?', a: 'Create an account, browse available internships, and click "Apply Now" to submit your application with your resume.' },
    { q: 'Is there a fee to join?', a: 'Some internships may have a nominal joining fee set by the organization. Free internships are also available.' },
    { q: 'How do I pay the fees?', a: 'Once approved, you\'ll receive a payment request. Pay securely via Razorpay supporting UPI, Google Pay, cards, and net banking.' },
    { q: 'Will I receive a certificate?', a: 'Yes! Upon successful completion of your internship, you\'ll receive a completion certificate.' },
    { q: 'Can I apply to multiple internships?', a: 'Absolutely. You can apply to as many internships as you like. Each application is tracked independently.' },
  ];

  const stats = [
    { value: '100+', label: 'Students Joined' },
    { value: '10+', label: 'Active Internships' },
    { value: '100+', label: 'Certificates Issued' },
    { value: '97%', label: 'Satisfaction Rate' },
  ];

  return (
    <>
      <Helmet>
        <title>InternHub — Launch Your Career with Top Internships</title>
        <meta name="description" content="InternHub is the premier platform for students to discover, apply for, and join professional internships across web development, data science, design, and more." />
      </Helmet>

      {/* ========== HERO SECTION ========== */}
      <section className="relative overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800">
        {/* Glowing floating mesh gradients (Orange and Blue) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 right-1/4 w-[500px] h-[500px] bg-accent-500/10 dark:bg-accent-500/5 rounded-full blur-[120px]" />
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-secondary-500/10 dark:bg-secondary-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-50 dark:bg-accent-950/20 border border-accent-100/50 dark:border-accent-900/30 text-xs font-semibold text-accent-700 dark:text-accent-400 mb-6">
              🚀 Over 500 students already joined
            </motion.div>

            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
              Launch Your Career with{' '}
              <span className="bg-gradient-to-r from-accent-500 via-accent-600 to-secondary-500 bg-clip-text text-transparent font-black">
                Top Internships
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="mt-6 text-base md:text-lg text-slate-500 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Discover curated internship opportunities, apply in minutes, and kickstart your professional journey. From web development to data science — your future starts here.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/internships"
                className="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-accent-500/20 hover:shadow-accent-500/30 transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
              >
                Explore Internships <FiArrowRight />
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 bg-secondary-50 dark:bg-secondary-950/10 hover:bg-secondary-100 dark:hover:bg-secondary-950/20 border border-secondary-200 dark:border-secondary-900 text-secondary-600 dark:text-secondary-400 text-sm font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5"
              >
                Create Free Account
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ========== STATS SECTION ========== */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <h3 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-accent-600 to-secondary-500 bg-clip-text text-transparent">
                  {stat.value}
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="bg-slate-50 dark:bg-slate-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              How It Works
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              From discovering the perfect internship to getting your joining confirmation — four simple steps.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15 }}
                className="relative bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg hover:border-accent-200 dark:hover:border-accent-800 transition-all duration-300 group"
              >
                <div className="absolute -top-3 -left-1 w-7 h-7 bg-accent-600 text-white text-xs font-extrabold rounded-full flex items-center justify-center shadow-md">
                  {idx + 1}
                </div>
                <div className="p-3 bg-accent-50 dark:bg-accent-950/20 rounded-xl w-fit text-accent-600 dark:text-accent-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{step.title}</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURED INTERNSHIPS ========== */}
      {featuredInternships.length > 0 && (
        <section className="bg-white dark:bg-slate-900 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
                  Featured Internships
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Handpicked opportunities to jumpstart your career.
                </p>
              </div>
              <Link
                to="/internships"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 transition-colors"
              >
                View All <FiArrowRight />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredInternships.map((internship, idx) => (
                <motion.div
                  key={internship._id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                >
                  <Link
                    to={`/internships/${internship._id}`}
                    className="block bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-accent-200 dark:hover:border-accent-800 transition-all duration-300 group"
                  >
                    {/* Image */}
                    <div className="h-44 bg-gradient-to-br from-accent-100 to-secondary-100 dark:from-accent-950/30 dark:to-secondary-950/30 flex items-center justify-center overflow-hidden">
                      {internship.imageUrl ? (
                        <img src={internship.imageUrl} alt={internship.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <FiBriefcase className="h-12 w-12 text-accent-300 dark:text-accent-700" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-400 border border-accent-100 dark:border-accent-900/30">
                          {internship.category}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {internship.mode}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors line-clamp-1">
                        {internship.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {internship.shortDescription || internship.description}
                      </p>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {internship.duration}
                        </span>
                        <span className="text-sm font-bold text-accent-600 dark:text-accent-400">
                          {formatDisplayAmount(internship.fees, 'Free')}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                to="/internships"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600 dark:text-accent-400"
              >
                View All Internships <FiArrowRight />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========== FAQ SECTION ========== */}
      <section className="bg-slate-50 dark:bg-slate-950 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
              Everything you need to know about InternHub.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {faq.q}
                  </span>
                  {openFaq === idx ? (
                    <FiChevronUp className="h-4 w-4 text-accent-500 flex-shrink-0" />
                  ) : (
                    <FiChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA SECTION ========== */}
      <section className="relative overflow-hidden bg-gradient-to-r from-accent-600 to-secondary-600 py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-extrabold text-white">
            Ready to Start Your Journey?
          </h2>
          <p className="mt-3 text-sm text-slate-100 max-w-lg mx-auto leading-relaxed">
            Join hundreds of students who have already launched their careers through InternHub.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="px-6 py-3 bg-white text-slate-900 text-sm font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              Create Free Account
            </Link>
            <Link
              to="/internships"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl border border-white/20 transition-all duration-300 hover:-translate-y-0.5"
            >
              Browse Internships
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};


export default HomePage;
