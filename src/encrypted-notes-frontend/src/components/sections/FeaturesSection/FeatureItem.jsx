import { IconContext } from "react-icons";

export default function FeatureItem({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center text-center max-w-xs">
      <IconContext.Provider value={{ size: "3em" }}>
        <Icon />
      </IconContext.Provider>
      <h3 className="text-xl font-semibold mt-4">{title}</h3>
      <p className="text-gray-400 mt-2">{description}</p>
    </div>
  );
}
