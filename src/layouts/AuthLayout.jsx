import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';

/** Layout for authentication pages (login, register, forgot password). */
export default function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
