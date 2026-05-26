import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiMail, FiMapPin, FiPhone, FiSend } from 'react-icons/fi';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

const ContactPage = () => {
  const toast = useToast();
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
    // Simulate submission since there's no contact endpoint
    setTimeout(() => {
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
      setLoading(false);
    }, 1200);
  };

  const contactInfo = [
    { icon: FiMail, label: 'Email', value: 'support@internhub.com' },
    { icon: FiPhone, label: 'Phone', value: '+91 98765 43210' },
    { icon: FiMapPin, label: 'Address', value: 'Bangalore, Karnataka, India' },
  ];

  return (
    <>
      <Helmet>
        <title>Contact Us — InternHub</title>
        <meta name="description" content="Get in touch with the InternHub team. We'd love to hear from you." />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">Contact Us</h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Have a question, suggestion, or feedback? We'd love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Contact Info Cards */}
          <div className="lg:col-span-2 space-y-4">
            {contactInfo.map((info, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5"
              >
                <div className="p-3 bg-accent-50 dark:bg-accent-950/20 rounded-xl text-accent-600 dark:text-accent-400">
                  <info.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">{info.label}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{info.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-3"
          >
            <form
              onSubmit={handleSubmit}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="name" label="Full Name" placeholder="John Doe" value={form.name} onChange={handleChange} required />
                <Input name="email" label="Email" type="email" placeholder="john@example.com" value={form.email} onChange={handleChange} required />
              </div>
              <Input name="subject" label="Subject" placeholder="What is this about?" value={form.subject} onChange={handleChange} />
              <Input name="message" label="Message" textarea rows={5} placeholder="Your message..." value={form.message} onChange={handleChange} required />
              <Button type="submit" variant="primary" size="lg" loading={loading} icon={FiSend}>
                Send Message
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
