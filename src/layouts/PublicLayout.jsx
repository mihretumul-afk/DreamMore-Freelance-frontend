import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/** Layout for public (marketing + marketplace) routes. */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-900 text-ink-900 dark:text-slate-100 transition-colors duration-200">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
