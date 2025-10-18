import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { IoClose } from "react-icons/io5";

const DeleteNoteModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      placement="center"
      backdrop="blur"
      hideCloseButton={true}
      classNames={{
        backdrop: "bg-black/60 backdrop-blur-md",
        base: "rounded-2xl border border-[#3C444D] bg-black shadow-xl z-[9999]",
        header:
          "px-6 py-4 flex items-center justify-between border-b border-[#3C444D]",
        body: "px-6 py-6",
        footer: "px-6 py-4 border-t border-[#3C444D]",
      }}
    >
      <ModalContent>
        {(close) => (
          <>
            {/* Header with title + single close button */}
            <ModalHeader>
              <h3 className="text-lg font-bold text-white">Delete Note</h3>
              <button
                onClick={close}
                className="ml-auto text-default-400 hover:text-white transition-colors"
              >
                <IoClose className="h-6 w-6" />
              </button>
            </ModalHeader>

            {/* Body */}
            <ModalBody>
              <p className="text-default-400 text-base leading-relaxed">
                Are you sure you want to delete this note?
                <br />
                <span className="text-default-500">
                  This action cannot be undone.
                </span>
              </p>
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
                className="rounded-xl px-6 font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors"
                onPress={onConfirm}
              >
                Delete
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default DeleteNoteModal;
