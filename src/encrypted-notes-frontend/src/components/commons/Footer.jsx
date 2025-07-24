import { Link } from "react-router-dom";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-8 text-white ">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-700 pb-4">
          <div className="mb-4 md:mb-0 flex justify-center md:justify-start">
            <Link to="/" className="flex items-center space-x-3">
              <img
                src="/assets/logo.png"
                alt="Encrypted Notes Logo"
                className="w-10 md:w-12"
              />
              <span className="text-lg md:text-xl font-semibold">
                Vault Notes
              </span>
            </Link>
          </div>

          {/* Nav Links */}
          <ul className="hidden md:flex flex-wrap justify-center space-x-6 md:space-x-8">
            <li className="hover:text-gray-400">
              <a href="#home">Home</a>
            </li>
            <li className="hover:text-gray-400">
              <a href="#how-it-works">How This Works</a>
            </li>
            <li className="hover:text-gray-400">
              <a href="#benefits">Benefits</a>
            </li>
          </ul>
        </div>

        <p className="text-gray-400 text-center mt-4">
          &copy; {currentYear}, Vault Notes. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
}
