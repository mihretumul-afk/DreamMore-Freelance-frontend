import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, User, LogOut, Search, PlusCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 px-6 py-4 shadow-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Dream More
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block -mt-1">
              AppWorks Marketplace
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link to="/jobs" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
            <Search className="w-4 h-4" /> Find Jobs
          </Link>
          <Link to="/freelancers" className="hover:text-indigo-400 transition-colors">
            Find Talent
          </Link>
          {user?.role === 'employer' && (
            <Link to="/jobs/post" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30">
              <PlusCircle className="w-4 h-4" /> Post a Job
            </Link>
          )}
        </div>

        {/* User Account / Auth Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3">
              <Link to={user?.role === 'employer' ? '/employer/profile' : '/freelancer/profile'} className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 px-3 py-1.5 rounded-lg border border-slate-700 transition-all">
                <div className="w-7 h-7 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-xs font-semibold text-slate-200 hidden sm:inline">{user.name}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {user.role}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 text-slate-400 transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2">
                Sign In
              </Link>
              <Link to="/register" className="text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-600/20 transition-all">
                Get Started
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
