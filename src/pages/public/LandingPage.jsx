import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import HeroSection from '../../components/landing/HeroSection';
import CategoriesSection from '../../components/landing/CategoriesSection';
import FeaturedJobsSection from '../../components/landing/FeaturedJobsSection';
import FeaturedFreelancersSection from '../../components/landing/FeaturedFreelancersSection';
import HowItWorksSection from '../../components/landing/HowItWorksSection';
import TrustSection from '../../components/landing/TrustSection';
import CtaSection from '../../components/landing/CtaSection';

export default function LandingPage() {
  usePageTitle('Ethiopian Freelance Marketplace');
  const { hash } = useLocation();

  // Smooth-scroll to section anchors (e.g. /#for-freelancers).
  useEffect(() => {
    if (!hash) return undefined;
    const element = document.querySelector(hash);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return undefined;
  }, [hash]);

  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <FeaturedJobsSection />
      <FeaturedFreelancersSection />
      <HowItWorksSection />
      <TrustSection />
      <CtaSection />
    </>
  );
}
