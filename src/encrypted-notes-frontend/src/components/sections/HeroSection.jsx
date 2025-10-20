import { useInternetIdentity } from "ic-use-internet-identity";
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

        <p className="mt-6 text-base md:text-lg text-gray-300 mx-auto max-w-3xl leading-relaxed">
          Securely create, store, and manage your private notes all powered by
          Web3 technology. Mint your notes as unique NFTs and trade them using
          ckBTC directly on chain. Experience secure note ownership with Bitcoin
          backed NFT minting and Internet Identity login.
        </p>

        <div className="mt-10 -mb-20">
          <LoginButton loginText={text} disabled={disabled} />
        </div>
      </div>
    </section>
  );
}
