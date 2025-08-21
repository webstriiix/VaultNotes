import { LoginButton } from "./LoginButton";

export default function HeroSection() {
  const { login, identity, isLoggingIn } = useInternetIdentity();
  
  const disabled = isLoggingIn || !!identity;
  const text = isLoggingIn
    ? "Initializing..."
    : identity
    ? "Already Logged in"
    : "Get Started";

  return (
    <section
      id="home"
      className="relative text-center py-20 md:mt-20 overflow-hidden"
    >
      <div className="container mx-auto px-6 relative z-10">
        <h1 className="text-4xl md:text-6xl mt-10 font-extrabold leading-tight my-5">
          <span className="bg-gradient-to-r from-[#FB928E] to-[#6F41FF] bg-clip-text text-transparent">
            Vault Notes
          </span>
        </h1>
        <p className="mt-4 text-base md:text-lg text-gray-300 mx-auto px-2 md:px-16 whitespace-pre-line">
          Securely store, manage, and collaborate on your notes using Web3
          technology.
          <br />
          Sign up easily using Internet Identity (Web3 Credential). Create,
          edit, and share encrypted notes anytime, anywhere.
        </p>
        <div className="mt-10 -mb-20">
          <LoginButton loginText="Get Started" />
        </div>
      </div>
    </section>
  );
}
