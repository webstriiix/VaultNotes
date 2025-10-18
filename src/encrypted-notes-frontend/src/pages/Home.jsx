import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/commons/Footer";
import Navbar from "../components/commons/Navbar";
import BenefitsSection from "../components/sections/BenefitsSection/BenefitsSection";
import CallToActionSection from "../components/sections/CallToAction";
import FeaturesSection from "../components/sections/FeaturesSection/FeaturesSection";
import HeroSection from "../components/sections/HeroSection";

const Home = () => {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) {
      navigate("/dashboard");
    }
  }, [identity, navigate]);

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
