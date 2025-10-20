import { FiLock, FiUserCheck, FiUsers } from "react-icons/fi";
import BenefitCard from "./BenefitsCard";

export default function BenefitsSection() {
  return (
    <section id="benefits" className="py-20 text-center text-white">
      <div className="mb-12">
        {/* Gradient border chip */}
        <div className="inline-flex items-center space-x-2 px-[2px] py-[2px] rounded-xl mt-10 bg-gradient-to-r from-[#FB928E] to-[#6F41FF]">
          <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0B0B0F]">
            <FiUsers className="text-lg text-white" />
            <span className="text-sm font-semibold text-white">Benefits</span>
          </div>
        </div>

        <h2 className="text-2xl md:text-4xl mt-10 font-bold">
          Why{" "}
          <span className="bg-gradient-to-r from-[#FB928E] to-[#6F41FF] bg-clip-text text-transparent">
            Vault Notes
          </span>{" "}
          is Right for You?
        </h2>
      </div>

      <div className="flex flex-wrap justify-center gap-8 md:gap-12">
        <BenefitCard
          icon={<FiLock size={48} />}
          title="Own What You Create"
          description="Each note you make can be minted as a Bitcoin backed NFT, giving you verifiable ownership and long term security."
        />
        <BenefitCard
          icon={<FiUserCheck size={48} />}
          title="Passwordless Access"
          description="Sign in instantly using Internet Identity a secure Web3 authentication system with no centralized passwords or data tracking."
        />
        <BenefitCard
          icon={<FiUsers size={48} />}
          title="Collaborate with Confidence"
          description="Share your NFT backed notes safely with others while keeping full control of your data and blockchain verified ownership."
        />
      </div>
    </section>
  );
}
