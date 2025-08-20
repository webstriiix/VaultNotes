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
import { encrypted_notes_backend } from "../../../../declarations/encrypted-notes-backend";

const ShareReadNoteModal = ({ isOpen, onClose, onSave }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [sharedUsers, setSharedUsers] = useState([]);
    const { identity } = useInternetIdentity();

    useEffect(() => {
        const fetchUsers = async () => {
            console.log("teest modal")
            try {
                if (!identity) return;
                Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);

                const users = await encrypted_notes_backend.get_registered_users();
                setAllUsers(users);
            } catch (err) {
                console.error("Failed to fetch users:", err);
            }
        };

        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen, identity]);

    // tambahkan user ke list shared
    const handleAddUser = (user) => {
        if (!sharedUsers.find((u) => u.id.toText() === user.id.toText())) {
            setSharedUsers((prev) => [...prev, user]);
        }
    };

    // hapus user dari list shared
    const handleRemoveUser = (userId) => {
        setSharedUsers((prev) => prev.filter((u) => u.id.toText() !== userId));
    };

    // filter users sesuai search
    const filteredUsers = allUsers.filter(
        (u) =>
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg" backdrop="blur">
            <ModalContent>
                {(close) => (
                    <>
                        <ModalHeader className="text-xl font-semibold">Share Note</ModalHeader>
                        <ModalBody>
                            {/* input search */}
                            <Input
                                placeholder="Search user by username or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />

                            {/* list user yang dipilih */}
                            <div className="mt-3 flex flex-wrap gap-2">
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

                            {/* list user hasil search */}
                            <div className="mt-4 max-h-60 overflow-y-auto border rounded-lg p-2">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <div
                                            key={user.id.toText()}
                                            className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg"
                                            onClick={() => handleAddUser(user)}
                                        >
                                            <p className="font-medium">{user.username}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 text-sm">No users found</p>
                                )}
                            </div>
                        </ModalBody>

                        {/* tombol */}
                        <ModalFooter>
                            <Button variant="flat" onPress={close}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
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

