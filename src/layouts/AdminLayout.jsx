import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useAuth } from '../hooks/useAuth';
import { ADMIN_NAV_LINKS } from '../constants/navigation';
import { cn } from '../utils/cn';

/**
 * App shell for the admin area. Renders a persistent sidebar on desktop
 * and a horizontally scrollable pill nav on mobile, matching the same
 * layout pattern used by the freelancer and employer dashboards.
 */
export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-ink-900 text-white' : 'text-ink-700 hover:bg-gray-100',
    );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[240px_1fr] lg:items-start lg:gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block" aria-label="Admin dashboard">
            <nav className="sticky top-24 space-y-1">
              <div className="mb-4 px-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">
                  Admin
                </span>
              </div>
              {ADMIN_NAV_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                );
              })}
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-gray-100"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" /> Sign out
              </button>
            </nav>
          </aside>

          {/* Content column */}
          <div className="min-w-0">
            {/* Mobile pill nav */}
            <nav
              aria-label="Admin dashboard"
              className="-mx-4 mb-6 overflow-x-auto px-4 lg:hidden"
            >
              <div className="flex w-max gap-2">
                {ADMIN_NAV_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 whitespace-nowrap rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'border-ink-900 bg-ink-900 text-white'
                            : 'border-gray-200 bg-white text-ink-700 hover:border-gray-300',
                        )
                      }
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </nav>

            <main>
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
