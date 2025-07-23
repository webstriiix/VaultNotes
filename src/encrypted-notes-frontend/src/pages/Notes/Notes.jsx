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
import { useState } from "react";
import {
  IoAdd,
  IoCalendar,
  IoDocumentText,
  IoEllipsisVertical,
  IoHeart,
  IoPricetag,
  IoSearch,
} from "react-icons/io5";
import DashboardLayout from "../../components/layouts/DashboardLayout/DashboardLayout";

const Notes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Sample notes data
  const [notes] = useState([
    {
      id: 1,
      title: "Project Ideas",
      content:
        "Brainstorming session for new mobile app features and user experience improvements. Need to focus on user-centric design and accessibility features...",
      category: "Work",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
      isFavorite: true,
      tags: ["project", "mobile", "ux"],
      color: "primary",
    },
    {
      id: 2,
      title: "Meeting Notes",
      content:
        "Discussed quarterly goals, budget allocation, and team restructuring plans. Action items include hiring new developers and updating project timelines...",
      category: "Work",
      createdAt: "2024-01-18",
      updatedAt: "2024-01-18",
      isFavorite: false,
      tags: ["meeting", "goals", "budget"],
      color: "primary",
    },
    {
      id: 3,
      title: "Book Recommendations",
      content:
        "List of books to read this year including fiction, non-fiction, and technical books. Priority on productivity and personal development...",
      category: "Personal",
      createdAt: "2024-01-10",
      updatedAt: "2024-01-12",
      isFavorite: true,
      tags: ["books", "reading", "personal"],
      color: "success",
    },
    {
      id: 4,
      title: "Travel Plans",
      content:
        "Summer vacation itinerary, budget planning, and must-visit places. Research on local culture and transportation options...",
      category: "Personal",
      createdAt: "2024-01-05",
      updatedAt: "2024-01-14",
      isFavorite: false,
      tags: ["travel", "vacation", "planning"],
      color: "success",
    },
    {
      id: 5,
      title: "Recipe Collection",
      content:
        "Favorite recipes from different cuisines, cooking tips, and ingredient lists. Focus on healthy and quick meal preparations...",
      category: "Personal",
      createdAt: "2024-01-08",
      updatedAt: "2024-01-16",
      isFavorite: false,
      tags: ["cooking", "recipes", "food"],
      color: "success",
    },
    {
      id: 6,
      title: "Learning Goals",
      content:
        "Technical skills to develop this year, online courses, and certification plans. Priority on cloud computing and AI/ML fundamentals...",
      category: "Education",
      createdAt: "2024-01-12",
      updatedAt: "2024-01-19",
      isFavorite: true,
      tags: ["learning", "skills", "certification"],
      color: "secondary",
    },
  ]);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (selectedFilter === "all") return matchesSearch;
    if (selectedFilter === "favorites") return matchesSearch && note.isFavorite;
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
    { key: "favorites", label: "Favorites" },
    { key: "work", label: "Work" },
    { key: "personal", label: "Personal" },
    { key: "education", label: "Education" },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6">
        {/* Header Section */}
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

        {/* Search and Filter Section */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10">
          {/* Search Bar */}
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

          {/* Filter Buttons */}
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

        {/* Notes Grid */}
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
                    <div className="flex items-center gap-2">
                      {note.isFavorite && (
                        <IoHeart className="h-6 w-6 text-danger" />
                      )}
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
                          <DropdownItem key="duplicate">Duplicate</DropdownItem>
                          <DropdownItem key="favorite">
                            {note.isFavorite
                              ? "Remove from favorites"
                              : "Add to favorites"}
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
                  </div>
                </CardHeader>

                <CardBody className="pt-0 px-6 pb-4">
                  <h3 className="text-xl font-bold text-foreground mb-4 line-clamp-2 leading-tight">
                    {note.title}
                  </h3>

                  <p className="text-default-600 text-sm leading-relaxed line-clamp-4 mb-5">
                    {note.content}
                  </p>

                  {/* Tags */}
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
          // Empty State
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
