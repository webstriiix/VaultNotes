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
import { useState } from "react";
import {
  IoAdd,
  IoArrowBack,
  IoClose,
  IoDocument,
  IoFolder,
  IoPricetag,
  IoSave,
} from "react-icons/io5";
import DashboardLayout from "../../components/layouts/DashboardLayout/DashboardLayout";

const CreateNotes = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");

  // Predefined categories
  const categories = [
    { key: "work", label: "Work", color: "primary" },
    { key: "personal", label: "Personal", color: "success" },
    { key: "education", label: "Education", color: "secondary" },
    { key: "ideas", label: "Ideas", color: "warning" },
    { key: "meeting", label: "Meeting", color: "primary" },
    { key: "project", label: "Project", color: "danger" },
  ];

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

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required!");
      return;
    }

    const newNote = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      category: category || "Personal",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
      tags,
      color:
        categories.find((cat) => cat.key === category.toLowerCase())?.color ||
        "primary",
    };

    console.log("New Note:", newNote);
    alert("Note saved successfully!");

    // Reset form
    setTitle("");
    setContent("");
    setCategory("");
    setTags([]);
    setNewTag("");
  };

  const selectedCategory = categories.find(
    (cat) => cat.key === category.toLowerCase()
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button
                isIconOnly
                variant="bordered"
                size="lg"
                className="border border-[#3C444D] shadow-sm hover:shadow-md rounded-xl"
              >
                <IoArrowBack className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-1">
                  Create New Note
                </h1>
                <p className="text-default-500 text-sm sm:text-base lg:text-lg">
                  Capture your thoughts and ideas
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                color="primary"
                size="lg"
                startContent={<IoSave className="h-5 w-5" />}
                onClick={handleSave}
                className="font-semibold shadow-lg rounded-xl border border-[#3C444D] px-6 sm:px-8"
                variant="solid"
              >
                <span className="hidden sm:inline">Save Note</span>
                <span className="sm:hidden">Save</span>
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
                        classNames={{
                          input: "text-sm sm:text-base leading-relaxed",
                          inputWrapper: "border-[#3C444D] shadow-sm rounded-xl",
                        }}
                      />
                    </div>
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
                          isDisabled={!newTag.trim()}
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
      </div>
    </DashboardLayout>
  );
};

export default CreateNotes;
