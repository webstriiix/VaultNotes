import { FaClipboardCheck, FaLock, FaUpload } from "react-icons/fa";
import FeatureItem from "./FeatureItem";

export default function FeaturesSection() {
  return (
    <section id="how-it-works" className="py-20 px-2 text-center  text-white">
      <div className="mb-12">
        <div className="inline-flex items-center space-x-2 px-4 py-2 border-2 rounded-xl mb-4 mt-10 text-sm font-semibold bg-transparent border-gradient-to-r from-pink-500 to-purple-500 text-white">
          <FaLock className="w-5 h-5" />
          <span>How This Works</span>
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
          description="Add your notes via browser and they are encrypted before leaving your device."
        />
        <FeatureItem
          icon={FaLock}
          title="End-to-End Encryption"
          description="Your notes are protected with strong encryption. Only you hold the key."
        />
        <FeatureItem
          icon={FaClipboardCheck}
          title="Access Anywhere"
          description="Access your notes securely across devices with your private credentials."
        />
      </div>
    </section>
  );
}
