import { MdAddCircle, MdNote, MdPerson, MdDashboard } from "react-icons/md";

export const SIDEBAR = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: <MdDashboard />,
  },
 /** {
    key: "profile",
    label: "My Profile",
    href: "/profile",
    icon: <MdPerson />,
  }, **/
  {
    key: "notes",
    label: "My Notes",
    href: "/notes",
    icon: <MdNote />,
  },
  {
    key: "create-notes",
    label: "New Note",
    href: "/create-notes",
    icon: <MdAddCircle />,
  },
];
