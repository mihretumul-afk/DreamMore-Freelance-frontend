import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import FreelancerProfilePage from './pages/freelancer/FreelancerProfilePage';
import EmployerProfilePage from './pages/employer/EmployerProfilePage';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/freelancer/profile" replace />} />
          <Route path="/freelancer/profile" element={<FreelancerProfilePage />} />
          <Route path="/freelancers/:id" element={<FreelancerProfilePage />} />
          <Route path="/employer/profile" element={<EmployerProfilePage />} />
          <Route path="/employers/:id" element={<EmployerProfilePage />} />
          <Route path="*" element={
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
              <h2 className="text-3xl font-extrabold text-white">Dream More AppWorks</h2>
              <p className="text-slate-400 mt-2">Manage freelancer and employer profiles using the navigation menu.</p>
            </div>
          } />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
