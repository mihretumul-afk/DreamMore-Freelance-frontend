import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import HeroSection from '../../components/landing/HeroSection';
import CategoriesSection from '../../components/landing/CategoriesSection';
import FeaturedJobsSection from '../../components/landing/FeaturedJobsSection';
import FeaturedFreelancersSection from '../../components/landing/FeaturedFreelancersSection';
import HowItWorksSection from '../../components/landing/HowItWorksSection';
import TrustedBySection from '../../components/landing/TrustedBySection';
import CtaSection from '../../components/landing/CtaSection';
import VideoShowcase from '../../components/landing/VideoShowcase';
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
    <VideoShowcase>
        <HeroSection />
      </VideoShowcase>
      <CategoriesSection />
      <FeaturedJobsSection />
      <FeaturedFreelancersSection />
      <HowItWorksSection />
      <TrustedBySection />
      <CtaSection />
      
    </>
  );
}
