import { Button, Listbox, ListboxItem } from "@heroui/react";
import { useInternetIdentity } from "ic-use-internet-identity";
import { CiLogout } from "react-icons/ci";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utlis/cn";
import logo from "/assets/logo.png";
import createBackendActor from "../../utlis/actor"

export default function Sidebar({ sidebarItems, isOpen }) {
    const navigate = useNavigate();
    const { clear, identity } = useInternetIdentity();


    const handleLogout = async () => {
        try {
            clear();
            navigate("/");
        } catch (err) {
            console.error("Logout failed:", err);
        }
    };

    const whoAmI = async () => {
        if (!identity || identity.getPrincipal().isAnonymous()) {
            alert("You must log in first.");
            return;
        }

        console.log("Identity Principal:", identity?.getPrincipal().toText());


        try {
            const actor = createBackendActor(identity);
            const principal = await actor.whoami();
            alert(`Your Principal: ${ principal.toText() }`);
        } catch (err) {
            console.error("Failed to fetch whoami:", err);
            alert("Failed to fetch your identity from the backend.");
        }
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

                <Listbox items={sidebarItems} variant="solid" aria-label="Dashboard Menu">
                    {(item) => (
                        <ListboxItem
                            key={item.key}
                            className={cn(
                                "my-1 h-12 text-lg hover:bg-[#1f2937] rounded-md",
                                {
                                    "bg-[#1f2937] text-white": location.pathname.startsWith(item.href),
                                }
                            )}
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

                <div className="mt-4">
                    <Button fullWidth variant="flat" onPress={whoAmI}>
                        Who am I?
                    </Button>
                </div>
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

