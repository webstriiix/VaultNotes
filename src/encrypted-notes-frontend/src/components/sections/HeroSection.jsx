export default function HeroSection() {
  return (
    <section
      id="home"
      className="relative text-center py-20  md:mt-20 overflow-hidden"
    >
      <div className="container mx-auto px-6 relative z-10">
        <h1 className="text-4xl md:text-6xl mt-10 font-extrabold text-white leading-tight my-5">
          Encrypted Notes Web3
        </h1>
        <p className="mt-4 text-base md:text-lg text-gray-300 mx-auto px-2 md:px-16 whitespace-pre-line">
          Securely store, manage, and collaborate on your notes using Web3
          technology.
          <br />
          Sign up easily with Phantom Wallet. Create, edit, and share encrypted
          notes anytime, anywhere.
        </p>
        <button className="mt-6 bg-gradient-to-r from-[#FB928E] to-[#6F41FF] text-white px-6 py-3 rounded-2xl shadow-lg hover:opacity-90 text-base md:text-lg flex items-center justify-center ml-auto mr-auto">
          Get Started
        </button>
      </div>
    </section>
  );
}
