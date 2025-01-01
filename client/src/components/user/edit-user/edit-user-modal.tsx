import { User } from '@server/types/user';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EditUserForm } from './edit-user-form';

interface EditUserModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditUserModal = ({ user, open, onOpenChange }: EditUserModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold">Edit User</DialogTitle>
        </DialogHeader>
        <EditUserForm user={user} closeModal={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
};
