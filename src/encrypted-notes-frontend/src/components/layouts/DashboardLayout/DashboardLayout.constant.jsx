import { MdAddCircle, MdNote } from "react-icons/md";

export const SIDEBAR = [
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
