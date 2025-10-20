import { LoginButton } from "./LoginButton";

export default function CallToActionSection() {
  return (
    <section className="py-20 text-center text-white">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold leading-tight">
          Take Control of Your Notes with{" "}
          <span className="bg-gradient-to-r from-[#FB928E] to-[#6F41FF] bg-clip-text text-transparent">
            Vault Notes
          </span>
          .
        </h2>

        <p className="mt-4 text-gray-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Secure your ideas. Own your data. Start today.
        </p>

        <div className="mt-10">
          <LoginButton loginText="Get Started" />
        </div>
      </div>
    </section>
  );
}
