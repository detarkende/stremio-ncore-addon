import React, { useState } from 'react';
import { DialogTitle } from '@radix-ui/react-dialog';
import { CreateUserForm } from './create-user-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '@/components/ui/dialog';

interface EditUserModalProps {
  trigger: React.ReactNode;
}

export const CreateUserModal = ({ trigger }: EditUserModalProps) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-bold">Create User</DialogTitle>
        </DialogHeader>
        <CreateUserForm closeModal={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
