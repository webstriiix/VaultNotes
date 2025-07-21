export default function BenefitCard({ icon, title, description }) {
  return (
    <div
      className="relative bg-cover bg-no-repeat text-center p-8 rounded-xl"
      style={{
        backgroundImage: `url(/assets/card.png)`,
        width: "373px",
        height: "500px",
      }}
    >
      <div className="absolute left-60 top-8 transform -translate-x-1/2 -translate-y-1/2 px-6 py-3 text-white text-lg font-semibold bg-transparent w-[240px]">
        <div className="text-center leading-tight">{title}</div>
      </div>

      <div className="mt-32 flex justify-center text-white text-4xl">
        {icon}
      </div>

      <p className="text-gray-300 mt-16 text-sm leading-relaxed px-4">
        {description}
      </p>
    </div>
  );
}
