import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiMail, FiMapPin, FiPhone, FiSend, FiCompass } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    // Simulate submission
    setTimeout(() => {
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
      setLoading(false);
    }, 1000);
  };

  const contactInfo = [
    { icon: FiMail, label: 'Email', value: 'support@internhub.com', color: 'text-violet-500' },
    { icon: FiPhone, label: 'Phone', value: '+91 98765 43210', color: 'text-emerald-500' },
    { icon: FiMapPin, label: 'Address', value: 'Bangalore, Karnataka, India', color: 'text-rose-500' },
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us — InternHub</title>
        <meta name="description" content="Get in touch with the InternHub team. We'd love to hear from you." />
      </Helmet>

      {/* Floating lights */}
      <div className="absolute inset-x-0 top-0 h-[400px] overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-36 left-1/3 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-20 right-1/4 w-[450px] h-[450px] bg-indigo-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10 space-y-12 select-none">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-950/20 border border-violet-100/40 dark:border-violet-900/30 text-[9px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            <FiCompass className="w-3.5 h-3.5" /> Support Board
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-50">Contact Us</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Have a question, feedback, or suggestion? Drop us a line.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Contact Info Cards */}
          <div className="lg:col-span-2 space-y-4">
            {contactInfo.map((info, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08, type: 'spring' }}
                className="flex items-start gap-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm hover:shadow-md transition"
              >
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <info.icon className={`h-5 w-5 ${info.color}`} />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">{info.label}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium select-text">{info.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white/80 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm hover:shadow-md transition text-left"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="name" label="Full Name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
                <Input name="email" label="Email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} required />
              </div>
              <Input name="subject" label="Subject" placeholder="What is this about?" value={form.subject} onChange={handleChange} />
              <Input name="message" label="Message" textarea rows={5} placeholder="Your message..." value={form.message} onChange={handleChange} required />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-650/15"
              >
                {loading ? 'Sending...' : 'Send Message'} <FiSend className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
