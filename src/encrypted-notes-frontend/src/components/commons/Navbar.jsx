import { useEffect, useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      setIsScrolled(currentScrollY > 50);

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setShowNavbar(false);
        setIsMenuOpen(false);
      } else {
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#0C0B27] border-b border-white/5 ${
          showNavbar ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="container mx-auto flex justify-between items-center py-4 px-6 md:px-10">
          <div className="flex items-center space-x-2">
            <img
              src="/assets/logo.png"
              alt="Encrypted Notes Logo"
              className="w-14 md:w-20"
            />
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white text-2xl"
            >
              {isMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          <ul
            className={`transition-all duration-300 transform md:flex text-white md:static md:flex-row md:space-x-8 ${
              isMenuOpen
                ? `absolute top-full left-0 right-0 bg-[#0C0B27] flex flex-col items-center space-y-6 py-6 md:flex ${
                    showNavbar ? "translate-y-0" : "-translate-y-full"
                  }`
                : "hidden md:flex"
            }`}
          >
            <li className="hover:text-gray-400 text-lg">
              <a href="#home" onClick={() => setIsMenuOpen(false)}>
                Home
              </a>
            </li>
            <li className="hover:text-gray-400 text-lg">
              <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>
                How This Works
              </a>
            </li>
            <li className="hover:text-gray-400 text-lg">
              <a href="#benefits" onClick={() => setIsMenuOpen(false)}>
                Benefits
              </a>
            </li>
            <li className="md:hidden">
              <button className="bg-gradient-to-r from-[#FB928E] to-[#6F41FF] text-white px-6 py-3 rounded-full shadow-md hover:opacity-90">
                Login
              </button>
            </li>
          </ul>

          <div className="hidden md:flex items-center space-x-4">
            <button className="bg-gradient-to-r from-[#FB928E] to-[#6F41FF] text-white px-6 py-3 rounded-full shadow-md hover:opacity-90">
              Login
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
