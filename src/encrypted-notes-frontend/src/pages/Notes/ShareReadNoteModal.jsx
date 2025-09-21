import { Actor } from "@dfinity/agent";
import {
    Button,
    Chip,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
} from "@heroui/react";
import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { encrypted_notes_backend } from "../../../../declarations/encrypted-notes-backend";

const ShareReadNoteModal = ({ isOpen, onClose, noteId }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sharedUsers, setSharedUsers] = useState([]);
    const { identity } = useInternetIdentity();

    // simpan snapshot daftar user yang sudah shared saat modal dibuka
    const [originalSharedUsers, setOriginalSharedUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                if (!identity) return;
                Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);
                const users = await encrypted_notes_backend.get_other_users(identity.getPrincipal());
                setAllUsers(users);
            } catch (err) {
                console.error("Failed to fetch users:", err);
            }
        };

        if (isOpen) {
            fetchUsers();
                // snapshot awal: dipakai buat nentuin user yang dihapus (unshare)
            setOriginalSharedUsers(sharedUsers);
        }
    }, [isOpen, identity]);


    const onSave = async () => {
        console.log("Shared users JSON:", JSON.stringify(sharedUsers, null, 2));

        if (!noteId) {
            console.warn("No noteId selected!");
            return;
        }

        Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);

        // additions: ada di sharedUsers sekarang, tapi TIDAK ada di snapshot awal
        const additions = sharedUsers.filter(
        (u) => !originalSharedUsers.some(o => o.id.toText() === u.id.toText())             
        );
        // removals: ada di snapshot awal, tapi TIDAK ada di sharedUsers sekarang
        const removals = originalSharedUsers.filter(
        (o) => !sharedUsers.some(u => u.id.toText() === o.id.toText())
        );
        // jalankan share untuk additions
        for (const user of additions) {
        try {
            await encrypted_notes_backend.share_note_read(noteId, user.id);
            alert(`✅ Shared note ${noteId} with ${user.username}`);
        } catch (err) {
            console.error(`❌ Failed to share (read) for ${user.username}:`, err);
        }
        }
        // jalankan unshare untuk removals
        for (const user of removals) {
        try {
            await encrypted_notes_backend.unshare_note_read(noteId, user.id);
            alert(`✅ unShared note ${noteId} with ${user.username}`);
        } catch (err) {
            console.error(`❌ Failed to unshare (read) for ${user.username}:`, err);
        }
        }
    };

    const handleAddUser = (user) => {
        if (!sharedUsers.find((u) => u.id.toText() === user.id.toText())) {
            setSharedUsers((prev) => [...prev, user]);
        }
    };

    const handleRemoveUser = (userId) => {
        setSharedUsers((prev) => prev.filter((u) => u.id.toText() !== userId));
    };

    const filteredUsers = allUsers.filter(
        (u) =>
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            placement="center"
            backdrop="blur"
            hideCloseButton={true}
            size="md"
            classNames={{
                backdrop: "bg-black/60 backdrop-blur-md",
                base: "rounded-2xl border border-[#3C444D] bg-black shadow-xl z-[9999]",
                header:
                    "px-6 py-4 flex items-center justify-between border-b border-[#3C444D]",
                body: "px-6 py-6 space-y-4",
                footer: "px-6 py-4 border-t border-[#3C444D]",
            }}
        >
            <ModalContent>
                {(close) => (
                    <>
                        {/* Header */}
                        <ModalHeader>
                            <h3 className="text-lg font-bold text-white">Share Note</h3>
                            <button
                                onClick={close}
                                className="ml-auto text-default-400 hover:text-white transition-colors"
                            >
                                <IoClose className="h-6 w-6" />
                            </button>
                        </ModalHeader>

                        {/* Body */}
                        <ModalBody>
                            {/* Input search */}
                            <Input
                                placeholder="Search user by username or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                                variant="bordered"
                            />

                            {/* Shared users */}
                            {sharedUsers.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {sharedUsers.map((user) => (
                                        <Chip
                                            key={user.id.toText()}
                                            onClose={() => handleRemoveUser(user.id.toText())}
                                            variant="flat"
                                            color="primary"
                                        >
                                            {user.username} ({user.email})
                                        </Chip>
                                    ))}
                                </div>
                            )}

                            {/* Search result */}
                            <div className="max-h-60 overflow-y-auto border border-[#3C444D] rounded-xl divide-y divide-[#3C444D]">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <div
                                            key={user.id.toText()}
                                            className="p-3 hover:bg-[#1F2937] cursor-pointer transition-colors"
                                            onClick={() => handleAddUser(user)}
                                        >
                                            <p className="font-medium">{user.username}</p>
                                            <p className="text-sm text-gray-400">{user.email}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm p-3 text-center">
                                        No users found
                                    </p>
                                )}
                            </div>
                        </ModalBody>

                        {/* Footer */}
                        <ModalFooter className="gap-3">
                            <Button
                                variant="bordered"
                                className="border border-[#3C444D] rounded-xl px-6 text-white hover:bg-[#3C444D] transition-colors"
                                onPress={close}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="rounded-xl px-6 font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
                                onPress={() => {
                                    onSave(sharedUsers);
                                    close();
                                }}
                            >
                                Save
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default ShareReadNoteModal;
