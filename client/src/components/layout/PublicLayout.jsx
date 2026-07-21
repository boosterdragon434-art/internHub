import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Public layout wrapper with Navbar + Main Content + Footer.
 */
const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-ink-950 transition-colors">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
