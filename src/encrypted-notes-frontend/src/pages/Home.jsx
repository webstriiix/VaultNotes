import Footer from "../components/commons/Footer";
import Navbar from "../components/commons/Navbar";
import BenefitsSection from "../components/sections/BenefitsSection/BenefitsSection";
import CallToActionSection from "../components/sections/CallToAction";
import FeaturesSection from "../components/sections/FeaturesSection/FeaturesSection";
import HeroSection from "../components/sections/HeroSection";

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
