import { Actor } from "@dfinity/agent";
import {
    Button,
    Chip,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    Spinner,
} from "@heroui/react";
import { useInternetIdentity } from "ic-use-internet-identity";
import { useEffect, useState } from "react";
import { IoClose, IoPeople } from "react-icons/io5";
import { toast } from "react-toastify";
import { encrypted_notes_backend } from "../../../../declarations/encrypted-notes-backend";

const UnshareNoteModal = ({ isOpen, onClose, noteId }) => {
    const [readOnlyUsers, setReadOnlyUsers] = useState([]);
    const [editUsers, setEditUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { identity } = useInternetIdentity();

    useEffect(() => {
        const fetchSharedUsers = async () => {
            if (!isOpen || !noteId || !identity) return;
            
            setLoading(true);
            try {
                Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);
                
                // Get the note details
                const note = await encrypted_notes_backend.get_note(noteId);
                if (!note || note.length === 0) {
                    console.error("Note not found");
                    toast.error("Note not found");
                    return;
                }

                const noteData = note[0];
                
                // Get all users
                const allUsers = await encrypted_notes_backend.get_other_users(identity.getPrincipal());
                
                // Filter out current user
                const currentUserPrincipal = identity.getPrincipal().toText();
                const filteredUsers = allUsers.filter(user => user.id.toText() !== currentUserPrincipal);
                
                // Filter users who have read access
                const readUsers = filteredUsers.filter(user => 
                    noteData.shared_read.some(principal => 
                        principal.toText() === user.id.toText()
                    )
                );
                
                // Filter users who have edit access
                const edUsers = filteredUsers.filter(user => 
                    noteData.shared_edit.some(principal => 
                        principal.toText() === user.id.toText()
                    )
                );
                
                setReadOnlyUsers(readUsers);
                setEditUsers(edUsers);
            } catch (err) {
                console.error("Failed to fetch shared users:", err);
                toast.error("Failed to load shared users");
            } finally {
                setLoading(false);
            }
        };

        fetchSharedUsers();
    }, [isOpen, noteId, identity]);

    const handleUnshareRead = async (user) => {
        try {
            Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);
            await encrypted_notes_backend.unshare_note_read(noteId, user.id);
            
            setReadOnlyUsers((prev) => prev.filter((u) => u.id.toText() !== user.id.toText()));
            toast.success(`Removed read access from ${user.username}`);
        } catch (err) {
            console.error(`Failed to unshare note with ${user.username}:`, err);
            toast.error(`Failed to remove access from ${user.username}`);
        }
    };

    const handleUnshareEdit = async (user) => {
        try {
            Actor.agentOf(encrypted_notes_backend).replaceIdentity(identity);
            await encrypted_notes_backend.unshare_note_edit(noteId, user.id);
            
            setEditUsers((prev) => prev.filter((u) => u.id.toText() !== user.id.toText()));
            toast.success(`Removed edit access from ${user.username}`);
        } catch (err) {
            console.error(`Failed to unshare note with ${user.username}:`, err);
            toast.error(`Failed to remove access from ${user.username}`);
        }
    };

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
                            <div className="flex items-center gap-2">
                                <IoPeople className="h-6 w-6 text-blue-500" />
                                <h3 className="text-lg font-bold text-white">Manage Shared Access</h3>
                            </div>
                            <button
                                onClick={close}
                                className="ml-auto text-default-400 hover:text-white transition-colors"
                            >
                                <IoClose className="h-6 w-6" />
                            </button>
                        </ModalHeader>

                        {/* Body */}
                        <ModalBody>
                            {loading ? (
                                <div className="flex justify-center items-center py-8">
                                    <Spinner size="lg" color="primary" />
                                </div>
                            ) : (
                                <>
                                    {/* Edit Access Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-white">Edit Access</h4>
                                            <Chip size="sm" variant="flat" color="warning">
                                                {editUsers.length}
                                            </Chip>
                                        </div>
                                        
                                        {editUsers.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {editUsers.map((user) => (
                                                    <Chip
                                                        key={user.id.toText()}
                                                        onClose={() => handleUnshareEdit(user)}
                                                        variant="flat"
                                                        color="warning"
                                                        classNames={{
                                                            base: "border border-warning-200",
                                                        }}
                                                    >
                                                        {user.username}
                                                    </Chip>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">
                                                No users with edit access
                                            </p>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-[#3C444D]"></div>

                                    {/* Read Only Access Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-white">Read Only Access</h4>
                                            <Chip size="sm" variant="flat" color="primary">
                                                {readOnlyUsers.length}
                                            </Chip>
                                        </div>
                                        
                                        {readOnlyUsers.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {readOnlyUsers.map((user) => (
                                                    <Chip
                                                        key={user.id.toText()}
                                                        onClose={() => handleUnshareRead(user)}
                                                        variant="flat"
                                                        color="primary"
                                                        classNames={{
                                                            base: "border border-primary-200",
                                                        }}
                                                    >
                                                        {user.username}
                                                    </Chip>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">
                                                No users with read-only access
                                            </p>
                                        )}
                                    </div>

                                    {/* Info message */}
                                    {editUsers.length === 0 && readOnlyUsers.length === 0 && (
                                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                                            <p className="text-sm text-blue-400 text-center">
                                                This note is not shared with anyone yet.
                                                <br />
                                                Use the share options to grant access.
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </ModalBody>

                        {/* Footer */}
                        <ModalFooter className="gap-3">
                            <Button
                                className="rounded-xl px-6 font-semibold bg-default hover:bg-default-200 text-white transition-colors"
                                onPress={close}
                            >
                                Close
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};

export default UnshareNoteModal;
