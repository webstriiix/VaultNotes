import Footer from "../commons/Footer";
import Navbar from "../commons/Navbar";
import BenefitsSection from "../sections/BenefitsSection/BenefitsSection";
import CallToActionSection from "../sections/CallToAction";
import FeaturesSection from "../sections/FeaturesSection/FeaturesSection";
import HeroSection from "../sections/HeroSection";

const Home = () => {
  return (
    <>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <CallToActionSection />
      <Footer />
    </>
  );
};

export default Home;
