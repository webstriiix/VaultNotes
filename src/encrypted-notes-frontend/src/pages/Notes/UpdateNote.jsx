import { Actor } from "@dfinity/agent";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import {
  IoAdd,
  IoArrowBack,
  IoClose,
  IoDocument,
  IoFolder,
  IoPricetag,
  IoSave,
} from "react-icons/io5";
import { useNavigate, useParams } from "react-router-dom";
import ClipLoader from "react-spinners/ClipLoader";
import { toast } from "react-toastify";
import { encrypted_notes_backend } from "../../../../declarations/encrypted-notes-backend";
import AISummary from "../../components/ai/AISummary";
import DashboardLayout from "../../components/layouts/DashboardLayout/DashboardLayout";
import { CryptoService } from "../../utils/encryption";

const UpdateNote = () => {
  const [title, setTitle] = useState("");
  const navigate = useNavigate();
  const { id } = useParams(); // ✅ Get note ID from URL params
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false); // ✅ untuk tombol
  const [fetchingData, setFetchingData] = useState(true); // ✅ untuk loading fetch data
  const [noteData, setNoteData] = useState(null); // ✅ untuk menyimpan data note yang akan diupdate
  const { identity } = useInternetIdentity();

  // Predefined categories
  const categories = [
    { key: "work", label: "Work", color: "primary" },
    { key: "personal", label: "Personal", color: "success" },
    { key: "education", label: "Education", color: "secondary" },
    { key: "ideas", label: "Ideas", color: "warning" },
    { key: "meeting", label: "Meeting", color: "primary" },
    { key: "project", label: "Project", color: "danger" },
  ];

  useEffect(() => {
    if (identity) {
      console.log("Principal:", identity.getPrincipal().toText());
      fetchNoteData(); // ✅ Fetch note data when identity is available
    } else {
      console.log("No identity (anonymous)");
    }
  }, [identity, id]);

  // ✅ Function to fetch note data and decrypt it
  const fetchNoteData = async () => {
    if (!identity || identity.getPrincipal().isAnonymous()) {
      toast.error("You must log in first.");
      navigate("/notes");
      return;
    }

    if (!id) {
      toast.error("Note ID not provided.");
      navigate("/notes");
      return;
    }

    setFetchingData(true);
    try {
      Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);
      
      console.log(`Fetching note with ID: ${id}...`);
      const noteId = BigInt(id);
      
      // ✅ Use the new get_note function instead of read_notes
      const noteResult = await encrypted_notes_backend.get_note(noteId);
      
      if (!noteResult || noteResult.length === 0) {
        toast.error("Note not found or you don't have access to it.");
        navigate("/notes");
        return;
      }

      const foundNote = noteResult[0]; // Extract note from Optional result

      // Check if user can edit this note
      const userPrincipal = identity.getPrincipal();
      const canEdit = foundNote.owner.compareTo(userPrincipal) === 'eq' || 
                     foundNote.shared_edit.some(p => p.compareTo(userPrincipal) === 'eq');
      
      if (!canEdit) {
        toast.error("You don't have permission to edit this note.");
        navigate("/notes");
        return;
      }

      setNoteData(foundNote);

      // Decrypt the note content
      if (foundNote.encrypted) {
        console.log("Decrypting note content...");
        const cryptoService = new CryptoService(encrypted_notes_backend, identity);
        const owner = foundNote.owner.toText();
        const decryptedData = await cryptoService.decryptWithNoteKey(
          noteId,
          owner,
          foundNote.encrypted
        );

        const noteContent = JSON.parse(decryptedData);
        
        // Populate form fields with decrypted data
        setTitle(noteContent.title || "");
        setContent(noteContent.content || "");
        setCategory(noteContent.category || "");
        setTags(noteContent.tags || []);
        
        console.log("Note data loaded successfully:", noteContent);
        toast.success("Note loaded successfully!");
      }
    } catch (err) {
      console.error("❌ Failed to fetch note:", err);
      toast.error("Failed to load note: " + (err.message || err));
      navigate("/notes");
    } finally {
      setFetchingData(false);
    }
  };

  // Suggested tags
  const suggestedTags = [
    "important",
    "urgent",
    "meeting",
    "project",
    "ideas",
    "todo",
  ];

  const handleAddTag = (tagValue = newTag) => {
    if (tagValue.trim() && !tags.includes(tagValue.trim().toLowerCase())) {
      setTags([...tags, tagValue.trim().toLowerCase()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSave = async () => {
    if (!identity || identity.getPrincipal().isAnonymous()) {
      toast.error("You must log in first.");
      return;
    }

    if (!noteData) {
      toast.error("No note data available to update.");
      return;
    }

    // ✅ Validasi input
    if (!title.trim()) {
      toast.error("Note title is required!");
      return;
    }
    if (!content.trim()) {
      toast.error("Note content is required!");
      return;
    }
    if (!category.trim()) {
      toast.error("Category must be selected!");
      return;
    }
    if (tags.length === 0) {
      toast.error("Please add at least one tag!");
      return;
    }

    setLoading(true);
    try {
      Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);

      // Prepare updated note metadata
      const updatedNoteData = {
        title: title.trim(),
        content: content.trim(),
        category: category || "Personal",
        tags,
        createdAt: noteData.createdAt || new Date().toISOString(), // Keep original created date
        updatedAt: new Date().toISOString(), // Update modified date
      };
      const plaintext = JSON.stringify(updatedNoteData);

      console.log("[1/3] Encrypting updated note locally...");
      const cryptoService = new CryptoService(
        encrypted_notes_backend,
        identity
      );
      const owner = noteData.owner.toText();
      const noteId = noteData.id;
      const encryptedBase64 = await cryptoService.encryptWithNoteKey(
        noteId,
        owner,
        plaintext
      );

      console.log("[2/3] Updating note on-chain with new ciphertext...");
      await encrypted_notes_backend.update_note(noteId, encryptedBase64);

      console.log("[3/3] Done. Note updated successfully.");
      toast.success("Note updated successfully");

      // Navigate back to notes list
      navigate("/notes");
    } catch (err) {
      console.error("❌ Failed to update note:", err);
      toast.error("Failed to update note: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(
    (cat) => cat.key === category.toLowerCase()
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        {/* ✅ Loading overlay for saving */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <ClipLoader color="#FFFFFF" size={50} />
              <p className="text-white text-lg">Updating note...</p>
            </div>
          </div>
        )}

        {/* ✅ Loading state while fetching note data */}
        {fetchingData ? (
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <ClipLoader color="#0066FF" size={60} />
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Loading Note
                </h2>
                <p className="text-default-500">
                  Fetching and decrypting note data...
                </p>
              </div>
            </div>
          </div>
        ) : (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                variant="bordered"
                size="lg"
                className="border border-[#3C444D] shadow-sm hover:shadow-md rounded-xl"
                disabled={loading || fetchingData} // ✅ disable while loading or fetching
                onPress={() => navigate(-1)}
              >
                <IoArrowBack className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">
                  Update Note
                </h1>
                <p className="text-default-500 text-sm sm:text-base lg:text-lg">
                  Update your note details below.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                color="primary"
                size="lg"
                startContent={<IoSave className="h-5 w-5" />}
                onPress={handleSave}
                disabled={loading || fetchingData} // ✅ disable tombol saat loading atau fetching
                className="font-semibold shadow-lg rounded-xl border border-[#3C444D] px-6 sm:px-8"
                variant="solid"
              >
                {loading ? "Updating..." : "Update Note"}
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
            {/* Note Editor */}
            <div className="xl:col-span-2">
              <Card className="border border-[#3C444D] rounded-2xl shadow-sm">
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex items-center gap-3">
                    <IoDocument className="h-6 w-6 text-primary" />
                    <h3 className="text-lg sm:text-xl font-semibold text-foreground">
                      Note Details
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="pt-0 px-6 pb-6">
                  <div className="space-y-6">
                    {/* Title Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground block">
                        Note Title *
                      </label>
                      <Input
                        placeholder="Enter your note title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        size="lg"
                        variant="bordered"
                        disabled={fetchingData} // ✅ disable while fetching
                        classNames={{
                          input: "text-base sm:text-lg font-medium",
                          inputWrapper:
                            "border-[#3C444D] shadow-sm rounded-xl h-12 sm:h-14",
                        }}
                      />
                    </div>

                    {/* Content Textarea */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground block">
                        Note Content *
                      </label>
                      <Textarea
                        placeholder="Write your note content here..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        variant="bordered"
                        minRows={8}
                        maxRows={16}
                        disabled={fetchingData} // ✅ disable while fetching
                        classNames={{
                          input: "text-sm sm:text-base leading-relaxed",
                          inputWrapper: "border-[#3C444D] shadow-sm rounded-xl",
                        }}
                      />
                    </div>

                    {/* AI Summary Section */}
                    {content && content.length > 100 && (
                      <div className="space-y-2">
                        <AISummary
                          text={content}
                          contentType={category || 'general'}
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Category Selection */}
              <Card className="border border-[#3C444D] rounded-2xl shadow-sm">
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex items-center gap-3">
                    <IoFolder className="h-6 w-6 text-secondary" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      Category
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="pt-0 px-6 pb-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground block">
                        Choose Category
                      </label>
                      <Select
                        placeholder="Select a category"
                        selectedKeys={category ? [category] : []}
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0];
                          setCategory(selectedKey || "");
                        }}
                        size="lg"
                        variant="bordered"
                        disabled={fetchingData} // ✅ disable while fetching
                        classNames={{
                          trigger:
                            "pl-4 pr-10 border-[#3C444D] shadow-sm rounded-xl h-12 sm:h-14",
                          listbox:
                            "bg-black text-white rounded-xl shadow-lg ring-1 ring-white/10",
                          popoverContent:
                            "bg-black text-white rounded-xl shadow-lg ring-1 ring-white/10",
                          selectorButton: "text-white",
                        }}
                      >
                        {categories.map((cat) => (
                          <SelectItem key={cat.key} value={cat.key}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Tags Section */}
              <Card className="border border-[#3C444D] rounded-2xl shadow-sm">
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex items-center gap-3">
                    <IoPricetag className="h-6 w-6 text-warning" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      Tags
                    </h3>
                  </div>
                </CardHeader>
                <CardBody className="pt-0 px-6 pb-6">
                  <div className="space-y-4">
                    {/* Add Tag Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground block">
                        Add Tags
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Type to add tags..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={handleKeyPress}
                          size="md"
                          variant="bordered"
                          disabled={fetchingData} // ✅ disable while fetching
                          classNames={{
                            inputWrapper:
                              "border-[#3C444D] shadow-sm rounded-xl h-12",
                          }}
                          className="flex-1"
                        />
                        <Button
                          isIconOnly
                          color="primary"
                          variant="solid"
                          size="lg"
                          onClick={() => handleAddTag()}
                          isDisabled={!newTag.trim() || fetchingData} // ✅ disable while fetching
                          className="shadow-sm rounded-xl h-12 w-12 flex-shrink-0"
                        >
                          <IoAdd className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>

                    {/* Current Tags */}
                    {tags.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-foreground">
                          Current Tags ({tags.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Chip
                              key={tag}
                              variant="bordered"
                              size="md"
                              endContent={
                                <button
                                  onClick={() => handleRemoveTag(tag)}
                                  className="ml-2 hover:bg-danger hover:text-white rounded-full p-1 transition-colors"
                                >
                                  <IoClose className="h-3 w-3" />
                                </button>
                              }
                              className="border border-[#3C444D] px-3 py-1 rounded-xl"
                            >
                              {tag}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Tags */}
                    {suggestedTags.filter((tag) => !tags.includes(tag)).length >
                      0 && (
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-foreground">
                          Suggested Tags
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {suggestedTags
                            .filter((tag) => !tags.includes(tag))
                            .map((tag) => (
                              <Chip
                                key={tag}
                                variant="bordered"
                                size="sm"
                                className="cursor-pointer hover:bg-primary hover:text-white border border-[#3C444D] px-3 py-1 rounded-xl transition-all"
                                onClick={() => handleAddTag(tag)}
                              >
                                {tag}
                              </Chip>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>

              {/* Preview */}
              {(title || content) && (
                <Card className="border border-[#3C444D] rounded-2xl shadow-sm">
                  <CardHeader className="pb-4 pt-6 px-6">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      Preview
                    </h3>
                  </CardHeader>
                  <CardBody className="pt-0 px-6 pb-6">
                    <div className="space-y-3">
                      {selectedCategory && (
                        <div className="flex justify-start">
                          <Chip
                            color={selectedCategory.color}
                            variant="flat"
                            size="sm"
                            className="font-medium"
                          >
                            {selectedCategory.label}
                          </Chip>
                        </div>
                      )}

                      {title && (
                        <h4 className="text-base sm:text-lg font-bold text-foreground line-clamp-2">
                          {title}
                        </h4>
                      )}

                      {content && (
                        <p className="text-xs sm:text-sm text-default-600 line-clamp-3 leading-relaxed">
                          {content}
                        </p>
                      )}

                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 3).map((tag) => (
                            <Chip
                              key={tag}
                              size="sm"
                              variant="bordered"
                              className="text-xs border border-[#3C444D] px-2 py-0.5 rounded-lg"
                            >
                              {tag}
                            </Chip>
                          ))}
                          {tags.length > 3 && (
                            <Chip
                              size="sm"
                              variant="bordered"
                              className="text-xs text-default-500 border border-[#3C444D] px-2 py-0.5 rounded-lg"
                            >
                              +{tags.length - 3}
                            </Chip>
                          )}
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </div>
        )} {/* ✅ Close the fetchingData conditional */}
      </div>
    </DashboardLayout>
  );
};

export default UpdateNote;
