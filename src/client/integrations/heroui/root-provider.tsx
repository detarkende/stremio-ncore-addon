import { Toast } from '@heroui/react';
import type { PropsWithChildren } from 'react';

export const Provider = ({ children }: PropsWithChildren) => {
  return (
    <>
      <Toast.Provider placement="top end" />
      {children}
    </>
  );
};
