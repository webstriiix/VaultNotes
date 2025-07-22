import { Navbar } from "@heroui/react";
import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import Sidebar from "../../commons/Sidebar";
import { SIDEBAR } from "./DashboardLayout.constant";

export default function DashboardLayout({
  children,
  title = "",
  description = "",
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="max-w-screen-3xl 3xl:container flex">
      <Sidebar sidebarItems={SIDEBAR} isOpen={open} />
      <div className="h-screen w-full overflow-y-auto p-8">
        <Navbar
          className="flex justify-between bg-transparent px-0"
          isBlurred={false}
          classNames={{ wrapper: "p-0" }}
          position="static"
        >
          <h1 className="text-3xl font-bold">{title}</h1>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-2 text-white"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </Navbar>
        {description && (
          <p className="mb-4 text-sm text-gray-600">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
