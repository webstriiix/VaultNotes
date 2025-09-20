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
} from "@heroui/react";
import { IoPricetag, IoDocumentText, IoCreate } from "react-icons/io5";

const MintNFTModal = ({ isOpen, onClose, onMint, existingNft }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");


    useEffect(() => {
        if (existingNft) {
            setTitle(existingNft.title || "");
            setDescription(existingNft.description || "");
            setPrice(existingNft.price ? (existingNft.price / 100_000_000).toString() : "");
        } else {
            setTitle("");
            setDescription("");
            setPrice("");
        }
    }, [existingNft, isOpen]);

    const handleMint = () => {
        if (!title.trim() || !description.trim() || !price.trim()) {
            alert("⚠️ Please fill in all fields!");
            return;
        }
        onMint({ title, description, price });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            backdrop="blur"
            className="rounded-2xl shadow-2xl border border-[#3C444D] bg-background"
        >
            <ModalContent>
                <ModalHeader className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <IoCreate className="text-primary" />
                    {existingNft ? "Update NFT" : "Mint Note as NFT"}
                </ModalHeader>

                <ModalBody className="space-y-5">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <IoDocumentText className="text-secondary" /> NFT Title
                        </label>
                        <Input
                            placeholder="Enter a short NFT title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            size="lg"
                            variant="bordered"
                            classNames={{
                                input: "text-base font-medium",
                                inputWrapper: "border-[#3C444D] shadow-sm rounded-xl h-12",
                            }}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <IoDocumentText className="text-warning" /> NFT Description
                        </label>
                        <Textarea
                            placeholder="Write a short description about this note..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            minRows={4}
                            variant="bordered"
                            classNames={{
                                input: "text-sm leading-relaxed",
                                inputWrapper: "border-[#3C444D] shadow-sm rounded-xl",
                            }}
                        />
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <IoPricetag className="text-success" /> Price (in BTC sats)
                        </label>
                        <Input
                            type="number"
                            placeholder="1000"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            size="lg"
                            variant="bordered"
                            classNames={{
                                input: "text-base font-medium",
                                inputWrapper: "border-[#3C444D] shadow-sm rounded-xl h-12",
                            }}
                        />
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button
                        variant="bordered"
                        onPress={onClose}
                        className="rounded-xl border border-[#3C444D] px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleMint}
                        className="rounded-xl shadow-lg px-6"
                    >
                        {existingNft ? "Update NFT" : "Mint NFT"}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default MintNFTModal;

