import { User } from '@server/types/user';
import { UpdatePasswordForm } from './update-password-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpdatePasswordModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdatePasswordModal = ({
  user,
  open,
  onOpenChange,
}: UpdatePasswordModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold">Change password</DialogTitle>
          <DialogDescription>
            Change password for user <strong>{user?.username}</strong>.
          </DialogDescription>
        </DialogHeader>
        <UpdatePasswordForm user={user} closeModal={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};
