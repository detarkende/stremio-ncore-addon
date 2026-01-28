import { clsx } from 'clsx';
import styles from './text.module.scss';

const variants = {
  'heading-lg': styles['heading-lg'],
  'heading-md': styles['heading-md'],
  'heading-sm': styles['heading-sm'],
  'body-lg': styles['body-lg'],
  'body-md': styles['body-md'],
  'body-sm': styles['body-sm'],
  caption: styles['caption'],
} as const satisfies Record<string, string>;

export type TextVariant = keyof typeof variants;

type TextProps<C extends React.ElementType> = {
  as: C;
  ref?: React.Ref<C>;
  children?: React.ReactNode;
  variant?: TextVariant;
} & Omit<React.ComponentPropsWithoutRef<C>, 'as' | 'children' | 'key'>;

export const Text = <C extends React.ElementType>({
  children,
  as: asProp,
  ref,
  variant = 'body-md',
  ...props
}: TextProps<C>) => {
  const Component = asProp as React.ElementType;
  return (
    <Component {...props} ref={ref} className={clsx(variants[variant], props.className)}>
      {children}
    </Component>
  );
};
