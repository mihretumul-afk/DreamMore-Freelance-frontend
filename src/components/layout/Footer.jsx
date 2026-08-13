import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 py-10 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <div className="font-extrabold text-lg text-white">Dream More AppWorks</div>
          <p className="text-xs text-slate-500 mt-1">The modern freelance & job marketplace platform.</p>
        </div>
        <div className="flex gap-6 text-xs font-medium">
          <a href="#" className="hover:text-slate-200 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-200 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-200 transition-colors">Support</a>
        </div>
        <div className="text-xs text-slate-600 font-mono">
          &copy; {new Date().getFullYear()} Dream More Platform. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
