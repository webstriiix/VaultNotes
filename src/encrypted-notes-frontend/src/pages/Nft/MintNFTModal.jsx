import {
  Button,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";
import { useEffect, useState } from "react";
import {
  IoCheckmarkCircle,
  IoClose,
  IoCreate,
  IoDocumentText,
  IoPricetag,
} from "react-icons/io5";
import ClipLoader from "react-spinners/ClipLoader";

const formatSatsToBtc = (priceOption) => {
  if (!priceOption || priceOption.length === 0) {
    return "";
  }
  const sats = Number(priceOption[0]);
  return (sats / 100_000_000).toString();
};

const MintNFTModal = ({
  isOpen,
  onClose,
  onMint,
  existingNft,
  loading = false,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setTitle(existingNft?.title ?? "");
    setDescription(existingNft?.description ?? "");
    setPrice(formatSatsToBtc(existingNft?.price));
  }, [isOpen, existingNft]);

  const handleSubmit = () => {
    if (!title.trim()) return;

    onMint({
      title: title.trim(),
      description: description.trim(),
      price: price.trim(),
    });
  };

  const disableSubmit = loading || !title.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      hideCloseButton
      backdrop="blur"
      className="bg-gradient-to-br from-[#0A0D12]/98 to-[#0F1419]/98 backdrop-blur-xl"
      classNames={{
        backdrop: "bg-black/80",
      }}
    >
      <ModalContent className="relative border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-3 rounded-full hover:bg-white/20 transition-all duration-200"
        >
          <IoClose className="text-2xl text-white" />
        </button>

        {loading && (
          <div className="absolute inset-0 bg-black/50 z-50 flex flex-col items-center justify-center gap-3">
            <ClipLoader color="#FFFFFF" size={45} />
            <p className="text-white text-sm sm:text-base font-medium">
              {existingNft ? "Updating NFT..." : "Minting NFT..."}
            </p>
          </div>
        )}

        <ModalHeader className="flex flex-col gap-1 border-b border-white/10 pb-4 px-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {existingNft ? "Update ICP NFT" : "Mint New ICP NFT"}
          </h2>
          <p className="text-sm text-default-400 font-normal">
            {existingNft
              ? "Update your NFT details and pricing"
              : "Create an on-chain NFT for your encrypted note"}
          </p>
        </ModalHeader>

        <ModalBody className="space-y-6 py-6 px-6">
          {existingNft && (
            <div className="relative overflow-hidden rounded-xl border border-success/20 bg-gradient-to-br from-success/10 to-success/5 p-4 shadow-md">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-success/20 rounded-full blur-2xl opacity-50" />
              <div className="relative flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success/20">
                    <IoCheckmarkCircle className="text-success text-base" />
                  </div>
                  <span className="text-sm font-medium text-success">
                    NFT Already Minted On-Chain
                  </span>
                </div>
                {existingNft.pointer && (
                  <div className="pl-8">
                    <p className="text-xs text-default-400 break-all font-mono bg-black/30 rounded-md p-2 border border-success/10">
                      {existingNft.pointer}
                    </p>
                  </div>
                )}
                {existingNft.listed && (
                  <div className="pl-8">
                    <Chip
                      size="sm"
                      color="warning"
                      variant="flat"
                      className="font-medium text-xs"
                    >
                      Listed on Marketplace
                    </Chip>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10">
                <IoDocumentText className="text-primary text-sm" />
              </div>
              NFT Title
              <span className="text-danger ml-1">*</span>
            </label>
            <Input
              value={title}
              placeholder="e.g., Encrypted Note #42"
              onChange={(e) => setTitle(e.target.value)}
              size="lg"
              variant="bordered"
              isRequired
              classNames={{
                input: "text-base font-medium placeholder:text-default-400",
                inputWrapper:
                  "border-white/10 hover:border-primary/40 focus-within:border-primary/60 shadow-md rounded-xl h-12 transition-all duration-200 bg-white/5",
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-secondary/10">
                <IoCreate className="text-secondary text-sm" />
              </div>
              Description
            </label>
            <Textarea
              value={description}
              placeholder="Describe what this encrypted note contains and what makes it unique..."
              onChange={(e) => setDescription(e.target.value)}
              minRows={4}
              variant="bordered"
              classNames={{
                input: "text-sm leading-relaxed placeholder:text-default-400",
                inputWrapper:
                  "border-white/10 hover:border-secondary/40 focus-within:border-secondary/60 rounded-xl transition-all duration-200 bg-white/5 shadow-md",
              }}
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-success/10">
                <IoPricetag className="text-success text-sm" />
              </div>
              Price (ckBTC)
            </label>
            <Input
              type="number"
              placeholder="0.0001"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              size="lg"
              variant="bordered"
              startContent={
                <span className="text-default-400 text-sm pl-1 pr-1">₿</span>
              }
              classNames={{
                input:
                  "text-base font-medium placeholder:text-default-400 !pl-2",
                inputWrapper:
                  "border-white/10 hover:border-success/40 focus-within:border-success/60 shadow-md rounded-xl h-12 transition-all duration-200 bg-white/5",
              }}
              className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />

            <p className="text-xs text-default-400 flex items-center gap-1 pl-0.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-default-400/50" />
              Leave empty to keep the NFT unlisted
            </p>
          </div>
        </ModalBody>

        <ModalFooter className="border-t border-white/10 pt-4 px-6">
          <Button
            color="primary"
            onPress={handleSubmit}
            className="w-full rounded-xl shadow-md font-semibold h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
            isDisabled={disableSubmit}
          >
            {existingNft ? "Update NFT" : "Mint NFT"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MintNFTModal;
