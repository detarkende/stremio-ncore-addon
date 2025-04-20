import { User } from '@server/types/user';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/api';
import { MutationKeys } from '@/constants/mutation-keys';
import { FullScreenLoader } from '@/components/ui/full-screen-loader';
import { QueryKeys } from '@/constants/query-keys';
import { handleError, HttpError } from '@/lib/errors';

interface DeleteUserModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteUserModal = ({ open, onOpenChange, user }: DeleteUserModalProps) => {
  const queryClient = useQueryClient();
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async () => {
      const req = await api.users[':userId'].$delete({ param: { userId: `${user.id}` } });
      onOpenChange(false);
      if (!req.ok) {
        throw new HttpError(req);
      }
      return await req.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.USERS] });
      toast.success('User deleted successfully');
    },
    onError: (e) => handleError(e, 'Failed to delete user'),
    mutationKey: [MutationKeys.DELETE_USER, user.id],
  });

  return (
    <>
      {isPending && <FullScreenLoader />}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-bold">Delete User {user.username}</DialogTitle>
          </DialogHeader>
          <p>
            Do you want to delete the user by the username{' '}
            <strong>{user.username}</strong>?
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </DialogClose>
            <Button variant="destructive" onClick={() => mutateAsync()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
