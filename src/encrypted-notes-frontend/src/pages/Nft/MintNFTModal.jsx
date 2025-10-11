import { useEffect, useState } from "react";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Textarea,
    Chip,
} from "@heroui/react";
import {
    IoPricetag,
    IoDocumentText,
    IoCreate,
    IoCheckmarkCircle,
} from "react-icons/io5";

const formatSatsToBtc = (priceOption) => {
    if (!priceOption || priceOption.length === 0) {
        return "";
    }
    const sats = Number(priceOption[0]);
    return (sats / 100_000_000).toString();
};

const MintNFTModal = ({ isOpen, onClose, onMint, existingNft, loading = false }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setTitle(existingNft?.title ?? "");
        setDescription(existingNft?.description ?? "");
        setPrice(formatSatsToBtc(existingNft?.price));
    }, [isOpen, existingNft]);

    const handleSubmit = () => {
        if (!title.trim()) {
            return;
        }

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
            size="lg"
            className="bg-[#0A0D12]/95 backdrop-blur-md text-foreground"
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    {existingNft ? "Update ICP NFT" : "Mint ICP NFT"}
                </ModalHeader>
                <ModalBody className="space-y-5">
                    {existingNft && (
                        <div className="flex flex-col gap-2 rounded-xl border border-success/20 bg-success/10 p-3 text-sm text-success">
                            <div className="flex items-center gap-2">
                                <IoCheckmarkCircle />
                                <span>This note already has an on-chain NFT.</span>
                            </div>
                            {existingNft.pointer && (
                                <p className="text-xs text-default-500 break-all">
                                    {existingNft.pointer}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <IoDocumentText className="text-primary" />
                            NFT Title
                        </label>
                        <Input
                            value={title}
                            placeholder="Encrypted Note #42"
                            onChange={(e) => setTitle(e.target.value)}
                            size="lg"
                            variant="bordered"
                            classNames={{
                                input: "text-base font-medium",
                                inputWrapper: "border-[#3C444D] shadow-sm rounded-xl h-12",
                            }}
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <IoCreate className="text-secondary" />
                            Short Description
                        </label>
                        <Textarea
                            value={description}
                            placeholder="Describe what this encrypted note contains..."
                            onChange={(e) => setDescription(e.target.value)}
                            minRows={3}
                            variant="bordered"
                            classNames={{
                                input: "text-sm leading-relaxed",
                                inputWrapper: "border-[#3C444D] rounded-xl",
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <IoPricetag className="text-success" />
                            Price (in ckBTC)
                        </label>
                        <Input
                            type="number"
                            placeholder="0.0001"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            size="lg"
                            variant="bordered"
                            classNames={{
                                input: "text-base font-medium",
                                inputWrapper: "border-[#3C444D] shadow-sm rounded-xl h-12",
                            }}
                        />
                        <p className="text-xs text-default-500">
                            Leave empty to keep the NFT unlisted.
                        </p>
                    </div>

                    {existingNft?.listed && (
                        <Chip size="sm" color="warning" variant="flat">
                            Currently listed on the ICP marketplace
                        </Chip>
                    )}
                </ModalBody>
                <ModalFooter className="flex gap-3">
                    <Button
                        variant="bordered"
                        onPress={onClose}
                        className="flex-1 rounded-xl border border-[#3C444D] px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleSubmit}
                        className="flex-1 rounded-xl shadow-lg px-6"
                        isDisabled={disableSubmit}
                        isLoading={loading}
                    >
                        {existingNft ? "Update NFT" : "Mint NFT"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default MintNFTModal;
