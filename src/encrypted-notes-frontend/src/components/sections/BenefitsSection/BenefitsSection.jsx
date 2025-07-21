import { FiLock, FiUserCheck, FiUsers } from "react-icons/fi";
import BenefitCard from "./BenefitsCard";

export default function BenefitsSection() {
  return (
    <section id="benefits" className="py-20 text-center text-white ">
      <div className="mb-12">
        <div className="inline-flex items-center space-x-2 px-4 py-2 mt-10 border-2 rounded-xl text-sm font-semibold bg-transparent border-gradient-to-r from-pink-500 to-purple-500 text-white">
          <FiUsers className="text-lg" />
          <span>Benefits</span>
        </div>

        <h2 className="text-2xl md:text-4xl mt-10 font-bold">
          Why{" "}
          <span className="bg-gradient-to-r from-[#FB928E] to-[#6F41FF] bg-clip-text text-transparent">
            Encrypted Notes
          </span>{" "}
          is Right for You?
        </h2>
      </div>

      <div className="flex flex-wrap justify-center gap-8 md:gap-12">
        <BenefitCard
          icon={<FiLock size={48} />}
          title="Private by Default"
          description="All your notes are end-to-end encrypted and only accessible by you and your collaborators."
        />
        <BenefitCard
          icon={<FiUserCheck size={48} />}
          title="Wallet-Based Access"
          description="Sign in securely with your Phantom Wallet—no passwords, just Web3-native authentication."
        />
        <BenefitCard
          icon={<FiUsers size={48} />}
          title="Real-Time Collaboration"
          description="Invite others to view or edit your notes, making teamwork seamless and secure."
        />
      </div>
    </section>
  );
}
