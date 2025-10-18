import { LoginButton } from "./LoginButton";

export default function CallToActionSection() {
  return (
    <section className="py-20 text-center text-white ">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl md:text-4xl font-bold leading-tight">
          Ready to Secure Your Notes with{" "}
          <span className="bg-gradient-to-r from-[#FB928E] to-[#6F41FF] bg-clip-text text-transparent">
            Vault Notes
          </span>
          ?
        </h2>

        <p className="mt-4 text-gray-300 text-base md:text-lg">
          Protect your thoughts and ideas with end-to-end encryption. Your
          privacy, guaranteed.
        </p>

        <div className="mt-10">
          <LoginButton loginText="Start Encrypting" />
        </div>
      </div>
    </section>
  );
}
