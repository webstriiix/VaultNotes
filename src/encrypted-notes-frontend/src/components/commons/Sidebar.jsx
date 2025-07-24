import { Button, Listbox, ListboxItem } from "@heroui/react";
import { CiLogout } from "react-icons/ci";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../utlis/cn";
import logo from "/assets/logo.png";
import { useInternetIdentity } from "ic-use-internet-identity";

export default function Sidebar({ sidebarItems, isOpen }) {
  const navigate = useNavigate();
<<<<<<< HEAD
  const { clear } = useInternetIdentity();
=======
  const location = useLocation();
>>>>>>> 651b38e6d85e2cc2a27cdff82a149c49867e9763

  const handleLogout = async () => {
    await clear();
    navigate(`/`);
  };

  return (
    <div
      className={cn(
        "fixed z-50 flex h-screen w-full max-w-[300px] -translate-x-full flex-col justify-between border-r border-gray-50/15 bg-[#0D1117] px-4 py-6 transition-all lg:relative lg:translate-x-0",
        { "translate-x-0": isOpen }
      )}
    >
      <div>
        <div
          className="flex items-center justify-center gap-3 mb-6 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="Logo" className="w-16 h-16" />
          <span className="text-xl font-bold text-white tracking-wide">
            Vault Notes
          </span>
        </div>

        <Listbox
          items={sidebarItems}
          variant="solid"
          aria-label="Dashboard Menu"
        >
          {(item) => (
            <ListboxItem
              key={item.key}
              className={cn("my-1 h-12 text-lg hover:bg-[#1f2937] rounded-md", {
                "bg-[#1f2937] text-white": location.pathname.startsWith(
                  item.href
                ),
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
          onPress={handleLogout}
        >
          <CiLogout className="mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
