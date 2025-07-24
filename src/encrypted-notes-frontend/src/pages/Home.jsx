import Footer from "../components/commons/Footer";
import Navbar from "../components/commons/Navbar";
import BenefitsSection from "../components/sections/BenefitsSection/BenefitsSection";
import CallToActionSection from "../components/sections/CallToAction";
import FeaturesSection from "../components/sections/FeaturesSection/FeaturesSection";
import HeroSection from "../components/sections/HeroSection";
import { useInternetIdentity } from "ic-use-internet-identity";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Actors from "../components/sections/Actors";

const Home = () => {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) {
      navigate("/dashboard");
    }
  }, [identity, navigate]);

  return (
    <Actors>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <CallToActionSection />
      <Footer />
    </Actors>
  );
};

export default Home;
