
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import WorkflowSteps from './components/WorkflowSteps';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Testimonials from './components/Testimonials';

function LandingApp() {
  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      <Hero />
      <WorkflowSteps />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}

export default LandingApp;
