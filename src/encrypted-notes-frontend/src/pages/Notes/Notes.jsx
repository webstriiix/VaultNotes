import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { useActor } from "../../components/sections/Actors";
import {
  IoAdd,
  IoCalendar,
  IoDocumentText,
  IoEllipsisVertical,
  IoPricetag,
  IoSearch,
} from "react-icons/io5";
import DashboardLayout from "../../components/layouts/DashboardLayout/DashboardLayout";

const Notes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [notes, setNotes] = useState([]);

  const actor = useActor();
  // Ambil notes dari backend saat mount
  useEffect(() => {
    if (!actor) return;
    actor.read_notes().then((backendNotes) => {
      setNotes(
        backendNotes.map((note) => ({
          id: Number(note.id),
          title: note.encrypted,
          content: note.encrypted,
          category: "Personal",
          createdAt: "",
          updatedAt: "",
          tags: [],
          color: "primary",
        }))
      );
    });
  }, [actor]);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (selectedFilter === "all") return matchesSearch;
    return matchesSearch && note.category.toLowerCase() === selectedFilter;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filterButtons = [
    { key: "all", label: "All Notes" },
    { key: "work", label: "Work" },
    { key: "personal", label: "Personal" },
    { key: "education", label: "Education" },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-3">
              Your Notes
            </h1>
            <p className="text-default-500 text-lg">
              Organize your thoughts and ideas
            </p>
          </div>
          <Button
            color="primary"
            size="lg"
            startContent={<IoAdd className="h-5 w-5" />}
            className="font-semibold shadow-lg border border-[#3C444D] rounded-xl"
            variant="solid"
          >
            New Note
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search notes, tags, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={
                <IoSearch className="h-5 w-5 text-default-400 mr-3" />
              }
              size="lg"
              variant="bordered"
              classNames={{
                input: "text-base py-1",
                inputWrapper:
                  "h-14 border border-[#3C444D] shadow-sm rounded-xl",
              }}
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {filterButtons.map((filter) => (
              <Button
                key={filter.key}
                variant={selectedFilter === filter.key ? "solid" : "bordered"}
                color={selectedFilter === filter.key ? "primary" : "default"}
                size="lg"
                onClick={() => setSelectedFilter(filter.key)}
                className={`font-medium h-14 px-6 rounded-xl ${
                  selectedFilter === filter.key
                    ? "shadow-lg border "
                    : "border border-[#3C444D] shadow-sm hover:shadow-md"
                }`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="hover:scale-[1.02] transition-all duration-200 cursor-pointer border border-[#3C444D] rounded-2xl"
                shadow="lg"
                isPressable
              >
                <CardHeader className="pb-3 pt-6 px-6">
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-center gap-3">
                      <IoDocumentText className="h-6 w-6 text-default-400" />
                      <Chip
                        color={note.color}
                        variant="flat"
                        size="md"
                        className="font-semibold px-3 py-1"
                      >
                        {note.category}
                      </Chip>
                    </div>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="md"
                          variant="bordered"
                          className="border border-[#3C444D] shadow-sm hover:shadow-md rounded-md"
                        >
                          <IoEllipsisVertical className="h-5 w-5" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label="Note actions"
                        className="bg-content1 rounded-2xl shadow-lg border bg-black border-[#3C444D]"
                        itemClasses={{
                          base: "bg-content1 hover:bg-default-100 data-[hover=true]:bg-default-100 rounded-xl",
                        }}
                      >
                        <DropdownItem key="edit">Edit</DropdownItem>
                        <DropdownItem
                          key="share-readonly"
                          onClick={() => alert("Share as read only")}
                        >
                          Share as Read Only
                        </DropdownItem>
                        <DropdownItem
                          key="share-edit"
                          onClick={() => alert("Share with edit access")}
                        >
                          Share with Edit Access
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                        >
                          Delete
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </CardHeader>

                <CardBody className="pt-0 px-6 pb-4">
                  <h3 className="text-xl font-bold text-foreground mb-4 line-clamp-2 leading-tight">
                    {note.title}
                  </h3>

                  <p className="text-default-600 text-sm leading-relaxed line-clamp-4 mb-5">
                    {note.content}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {note.tags.slice(0, 3).map((tag) => (
                      <Chip
                        key={tag}
                        size="sm"
                        variant="bordered"
                        startContent={<IoPricetag className="h-3 w-3 mr-1" />}
                        className="text-xs border border-[#3C444D] px-2 py-1 rounded-xl"
                      >
                        {tag}
                      </Chip>
                    ))}
                    {note.tags.length > 3 && (
                      <Chip
                        size="sm"
                        variant="bordered"
                        className="text-xs text-default-500 border border-[#3C444D] px-2 py-1 rounded-xl"
                      >
                        +{note.tags.length - 3} more
                      </Chip>
                    )}
                  </div>
                </CardBody>

                <CardFooter className="pt-2 px-6 pb-6">
                  <div className="flex items-center text-sm text-default-500 font-medium">
                    <IoCalendar className="h-4 w-4 mr-2" />
                    Updated {formatDate(note.updatedAt)}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="text-center max-w-md">
              <div className="bg-default-100 rounded-full p-8 mb-8 inline-block border border-[#3C444D]">
                <IoDocumentText className="h-16 w-16 text-default-400" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                No notes found
              </h3>
              <p className="text-default-500 mb-8 text-lg leading-relaxed">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first note"}
              </p>
              <Button
                color="primary"
                size="lg"
                startContent={<IoAdd className="h-5 w-5" />}
                className="font-semibold shadow-lg border border-[#3C444D] px-8 py-3 rounded-xl"
                variant="solid"
              >
                Create Your First Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Notes;
