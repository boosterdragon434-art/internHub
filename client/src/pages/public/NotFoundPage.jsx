import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import Button from '../../components/common/Button';

const NotFoundPage = () => {
  return (
    <>
      <Helmet>
        <title>404 — Page Not Found — InternHub</title>
        <meta name="description" content="The page you are looking for does not exist on InternHub." />
      </Helmet>

      <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 dark:bg-slate-950 transition-colors">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-12 shadow-xl"
        >
          {/* Animated 404 text */}
          <motion.h1
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 100 }}
            className="text-7xl sm:text-8xl font-black bg-gradient-to-r from-accent-500 to-secondary-500 bg-clip-text text-transparent mb-4"
          >
            404
          </motion.h1>

          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 mb-2">
            Lost in Space?
          </h2>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
            The page you're looking for doesn't exist, has been removed, or is temporarily unavailable. Let's get you back on track!
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="primary" icon={FiHome} className="w-full">
                Go to Home
              </Button>
            </Link>
            <Button
              variant="outline"
              icon={FiArrowLeft}
              className="w-full sm:w-auto"
              onClick={() => window.history.back()}
            >
              Go Back
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default NotFoundPage;
