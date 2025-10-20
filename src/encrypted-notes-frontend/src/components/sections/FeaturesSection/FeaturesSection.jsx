import { FaClipboardCheck, FaLock, FaUpload } from "react-icons/fa";
import { SiBitcoin } from "react-icons/si";
import FeatureItem from "./FeatureItem";

export default function FeaturesSection() {
  return (
    <section id="how-it-works" className="py-20 px-2 text-center text-white">
      <div className="mb-12">
        <div className="inline-flex items-center space-x-2 px-[2px] py-[2px] rounded-xl mb-4 mt-10 bg-gradient-to-r from-[#FB928E] to-[#6F41FF]">
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0B0B0F]">
            <FaLock className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold text-white">
              How This Works
            </span>
          </div>
        </div>

        <h2 className="text-4xl font-bold mt-7">
          How{" "}
          <span className="bg-gradient-to-r from-[#FB928E] to-[#6F41FF] bg-clip-text text-transparent">
            Vault Notes
          </span>{" "}
          Works
        </h2>
        <p className="mt-4 text-gray-400">
          Keep your notes safe, private, and fully under your control
        </p>
      </div>

      <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16">
        <FeatureItem
          icon={FaUpload}
          title="Upload Securely"
          description="Add your notes directly from your browser. Data is encrypted before leaving your device."
        />
        <FeatureItem
          icon={SiBitcoin}
          title="NFT Minting & Ownership"
          description="Each note is minted as a Bitcoin backed NFT on chain, giving you verified and protected ownership."
        />
        <FeatureItem
          icon={FaClipboardCheck}
          title="Access Anywhere"
          description="Access your notes anytime with Internet Identity — no centralized passwords, no compromise."
        />
      </div>
    </section>
  );
}
