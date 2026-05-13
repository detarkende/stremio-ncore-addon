import {
  Button,
  Card,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from '@heroui/react';
import { User } from '@heroui/react';
import { type User as UserType } from '@sna/server';
import { EllipsisVerticalIcon } from 'lucide-react';
import { useState } from 'react';

import { ChangePasswordForm } from './change-password-form';
import { DeleteUser } from './delete-user-form';
import { EditUserForm } from './edit-user-form';
import { Token } from './token';

type UserMenuOption = 'token' | 'edit' | 'change-password' | 'delete';

export function UserCard({ user, isMe }: { user: UserType; isMe: boolean }) {
  const [dropdownValue, setDropdownValue] = useState<UserMenuOption | null>(null);

  const cancelDropdownSelection = () => setDropdownValue(null);

  const username = isMe ? `${user.username} (You)` : user.username;
  return (
    <Card className="rounded-xl flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <User name={username} />
        <Dropdown>
          <DropdownTrigger asChild>
            <Button isIconOnly>
              <EllipsisVerticalIcon size={16} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            onAction={(key) => setDropdownValue(key as UserMenuOption)}
            disabledKeys={isMe ? ['delete'] : []}
          >
            <DropdownItem key="token">View/Rotate token</DropdownItem>
            <DropdownItem key="edit">Edit user</DropdownItem>
            <DropdownItem key="change-password">Change password</DropdownItem>
            <DropdownItem key="delete" color="danger" className="text-danger">
              Delete user
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </div>
      {dropdownValue === 'token' && (
        <Token user={user} isMe={isMe} onClose={cancelDropdownSelection} />
      )}
      {dropdownValue === 'edit' && (
        <EditUserForm user={user} isMe={isMe} onClose={cancelDropdownSelection} />
      )}
      {dropdownValue === 'change-password' && (
        <ChangePasswordForm user={user} isMe={isMe} onClose={cancelDropdownSelection} />
      )}
      {dropdownValue === 'delete' && (
        <DeleteUser user={user} onClose={cancelDropdownSelection} />
      )}
    </Card>
  );
}
