import { Button, Listbox, ListboxItem } from "@heroui/react";
import { CiLogout } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utlis/cn";
import logo from "/assets/logo.png";

export default function Sidebar({ sidebarItems, isOpen }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div
      className={cn(
        "fixed z-50 flex h-screen w-full max-w-[300px] -translate-x-full flex-col justify-between border-r border-gray-50/15 bg-[#0D1117] px-4 py-6 transition-all lg:relative lg:translate-x-0",
        { "translate-x-0": isOpen }
      )}
    >
      <div>
        <div className="flex justify-center">
          <img
            src={logo}
            alt="Logo"
            width={180}
            height={60}
            className="mb-6 w-24 cursor-pointer"
            onClick={() => navigate("/")}
          />
        </div>
        <Listbox
          items={sidebarItems}
          variant="solid"
          aria-label="Dashboard Menu"
        >
          {(item) => (
            <ListboxItem
              key={item.key}
              className={cn("my-1 h-12 text-lg", {
                "bg-[#1f2937] text-white rounded-md":
                  location.pathname.startsWith(item.href),
              })}
              startContent={item.icon}
              textValue={item.label}
              aria-labelledby={item.label}
              aria-describedby={item.label}
              onClick={() => navigate(item.href)}
            >
              <p className="text-small">{item.label}</p>
            </ListboxItem>
          )}
        </Listbox>
      </div>
      <div className="flex items-center p-1">
        <Button
          fullWidth
          variant="light"
          className="flex justify-start rounded-lg px-2 py-1.5 hover:bg-red-600"
          size="lg"
          onClick={handleLogout}
        >
          <CiLogout className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
