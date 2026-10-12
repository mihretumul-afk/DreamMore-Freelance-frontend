import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

/** Layout for authentication pages (login, register, forgot password). */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-slate-950 text-ink-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-3.5 py-6 sm:px-6 sm:py-10 min-w-0 w-full">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
