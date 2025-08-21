import { Actor } from "@dfinity/agent";
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
import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import {
  IoAdd,
  IoCalendar,
  IoDocumentText,
  IoEllipsisVertical,
  IoPricetag,
  IoSearch,
} from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader"; // ✅ spinner
import { encrypted_notes_backend } from "../../../../declarations/encrypted-notes-backend";
import AISummary from "../../components/ai/AISummary"; // ✅ AI Summary component
import DashboardLayout from "../../components/layouts/DashboardLayout/DashboardLayout";
import { CryptoService } from "../../utils/encryption";
import DeleteNoteModal from "./DeleteNoteModal";
import ShareEditNoteModal from "./ShareEditNoteModal";
import ShareReadNoteModal from "./ShareReadNoteModal";

const Notes = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { identity } = useInternetIdentity();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteNoteId, setDeleteNoteId] = useState(null);
  const [isShareEditModalOpen, setIsShareEditModalOpen] = useState(false);

  const handleShareEditNote = (noteId) => {
    setSelectedNoteId(noteId);
    setIsShareEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsShareEditModalOpen(false);
    setSelectedNoteId(null);
  };


  const handleDeleteNote = (noteId) => {
    setDeleteNoteId(noteId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const actor = encrypted_notes_backend;
      Actor.agentOf(actor).replaceIdentity(identity);
      await actor.delete_note(deleteNoteId); // asumsi backend ada method delete_note(id)
      setNotes((prev) => prev.filter((n) => n.id !== deleteNoteId));
    } catch (err) {
      console.error("Failed to delete note:", err);
    } finally {
      setIsDeleteModalOpen(false);
      setDeleteNoteId(null);
    }
  };

  useEffect(() => {
    const fetchNotes = async () => {
      if (!identity || identity.getPrincipal().isAnonymous()) {
        console.warn("User is not logged in.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const actor = encrypted_notes_backend;
        Actor.agentOf(actor).replaceIdentity(identity);
        const rawNotes = await actor.read_notes();

        const cryptoService = new CryptoService(actor, identity);
        const decrypted = await Promise.all(
          rawNotes.map(async (n) => {
            try {
              const decryptedContent = await cryptoService.decryptWithNoteKey(
                n.id,
                n.owner,
                n.encrypted
              );
              const parsed = JSON.parse(decryptedContent);
              return {
                id: Number(n.id),
                ...parsed,
              };
            } catch (err) {
              console.error("Failed to decrypt note", n.id, err);
              return {
                id: Number(n.id),
                title: "Failed to decrypt",
                content: "",
                tags: [],
                category: "unknown",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                color: "default",
              };
            }
          })
        );
        setNotes(decrypted);
        console.log("📝 Notes loaded:", decrypted.length, "notes");
        console.log("📝 First note ID:", decrypted[0]?.id, typeof decrypted[0]?.id);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [identity]);

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags?.some((tag) =>
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

  const handleShareNote = (noteId) => {
    setSelectedNoteId(noteId);
    setIsShareModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsShareModalOpen(false);
    setSelectedNoteId(null);
  };


  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background p-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
            <ClipLoader size={50} color="#FFFFFF" />
          </div>
        )}

        {/* Header */}
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
            onPress={() => navigate("/create-note")}
          >
            New Note
          </Button>
        </div>

        {/* Search + Filter */}
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
                    ? "shadow-lg border"
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
                className="border border-[#3C444D] rounded-2xl hover:scale-[1.02] transition-all duration-200 cursor-pointer"
                isPressable
                onPress={() => {
                  console.log(`Card clicked, navigating to: /update-note/${note.id}`);
                  navigate(`/update-note/${note.id}`);
                }}
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
                          onPress={(e) => {
                            e.stopPropagation();
                            console.log("Dropdown button clicked");
                          }}
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
                        <DropdownItem
                          key="edit"
                          onPress={() => {
                            console.log(`Dropdown Edit clicked for note: ${note.id}`);
                            navigate(`/update-note/${note.id}`);
                          }}
                        >
                          Edit
                        </DropdownItem>
                        <DropdownItem
                          key="share-readonly"
                          onPress={() => handleShareNote(note.id)}
                        >
                          Share as Read Only
                        </DropdownItem>
                        <DropdownItem
                          key="share-edit"
                          onPress={() => handleShareEditNote(note.id)}
                        >
                          Share with Edit Access
                        </DropdownItem>
                        <DropdownItem
                          key="delete"
                          className="text-danger"
                          color="danger"
                          onPress={() => handleDeleteNote(note.id)}
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

                  {/* ✅ AI Summary Compact - only for longer notes */}
                  {note.content && note.content.length > 200 && (
                    <div className="mb-4">
                      <AISummary
                        text={note.content}
                        contentType={note.category || 'general'}
                        compact={true}
                        className="w-full"
                      />
                    </div>
                  )}

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
          !loading && ( // ✅ biar gak muncul bareng spinner
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
                  onPress={() => navigate("/create-note")}
                >
                  Create Your First Note
                </Button>
              </div>
            </div>
          )
        )}

        {/* Debug info */}
        <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs">
          Modal Open: {isShareModalOpen ? "Yes" : "No"}
          {selectedNoteId && ` | Note ID: ${selectedNoteId}`}
        </div>
      </div>

      {/* Modal */}
      <ShareReadNoteModal
        isOpen={isShareModalOpen}
        onClose={handleCloseModal}
        noteId={selectedNoteId}
      />

      <ShareEditNoteModal
        isOpen={isShareEditModalOpen}
        onClose={handleCloseEditModal}
        noteId={selectedNoteId}
      />

      <DeleteNoteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </DashboardLayout>
  );
};

export default Notes;
