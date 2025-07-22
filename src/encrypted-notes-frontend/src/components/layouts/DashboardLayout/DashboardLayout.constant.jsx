import { MdAddCircle, MdDashboard, MdNote } from "react-icons/md";

export const SIDEBAR = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: <MdDashboard />,
  },
  {
    key: "notes",
    label: "My Notes",
    href: "/notes",
    icon: <MdNote />,
  },
  {
    key: "create-note",
    label: "New Note",
    href: "/notes/new",
    icon: <MdAddCircle />,
  },
];
