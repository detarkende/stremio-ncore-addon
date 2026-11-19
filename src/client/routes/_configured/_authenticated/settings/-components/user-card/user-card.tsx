import { Avatar, Button, Card, Dropdown, Label } from '@heroui/react';
import { type User as UserType } from '@server/exports';
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
        <div className="inline-flex items-center gap-2">
          <Avatar>
            <Avatar.Fallback>{user.username.slice(0, 2).toUpperCase()}</Avatar.Fallback>
          </Avatar>
          <span className="text-sm">{username}</span>
        </div>
        <Dropdown>
          <Button isIconOnly aria-label="User actions" variant="tertiary">
            <EllipsisVerticalIcon size={16} />
          </Button>
          <Dropdown.Popover>
            <Dropdown.Menu
              onAction={(key) => setDropdownValue(key as UserMenuOption)}
              disabledKeys={isMe ? ['delete'] : []}
            >
              <Dropdown.Item id="token" textValue="View/Rotate token">
                <Label>View/Rotate token</Label>
              </Dropdown.Item>
              <Dropdown.Item id="edit" textValue="Edit user">
                <Label>Edit user</Label>
              </Dropdown.Item>
              <Dropdown.Item id="change-password" textValue="Change password">
                <Label>Change password</Label>
              </Dropdown.Item>
              <Dropdown.Item id="delete" textValue="Delete user" variant="danger">
                <Label>Delete user</Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
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
