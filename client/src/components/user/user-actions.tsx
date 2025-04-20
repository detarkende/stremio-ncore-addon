import { User } from '@server/types/user';
import { useState } from 'react';
import { EllipsisIcon, LockIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import { UpdatePasswordModal } from '../update-password/update-password-modal';
import { DeleteUserModal } from './delete-user/delete-user-modal';
import { EditUserModal } from './edit-user/edit-user-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

enum OpenedModal {
  None,
  Edit,
  UpdatePassword,
  Delete,
}

interface UserActionsProps {
  user: User;
  isDeleteEnabled?: boolean;
  isMe?: boolean;
}

export const UserActions = ({ user, isDeleteEnabled = true }: UserActionsProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openedModal, setOpenedModal] = useState<OpenedModal>(OpenedModal.None);
  const handleOnOpenChange = (isOpen: boolean) => {
    setIsMenuOpen(false);
    if (!isOpen) {
      setOpenedModal(OpenedModal.None);
    }
  };
  return (
    <>
      <EditUserModal
        user={user}
        open={openedModal === OpenedModal.Edit}
        onOpenChange={handleOnOpenChange}
      />
      <UpdatePasswordModal
        user={user}
        open={openedModal === OpenedModal.UpdatePassword}
        onOpenChange={handleOnOpenChange}
      />
      {isDeleteEnabled && (
        <DeleteUserModal
          user={user}
          open={openedModal === OpenedModal.Delete}
          onOpenChange={handleOnOpenChange}
        />
      )}
      <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen} modal={false}>
        <DropdownMenuTrigger>
          <EllipsisIcon className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setOpenedModal(OpenedModal.Edit)}>
            <PencilIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenedModal(OpenedModal.UpdatePassword)}>
            <LockIcon />
            Change password
          </DropdownMenuItem>
          {isDeleteEnabled && (
            <DropdownMenuItem onClick={() => setOpenedModal(OpenedModal.Delete)}>
              <Trash2Icon />
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
